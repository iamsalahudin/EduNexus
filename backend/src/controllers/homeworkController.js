const mongoose = require('mongoose');
const { Homework, HomeworkFile, Student, Subject, User } = require('../models');

function toObjectId(value) {
  try {
    return new mongoose.Types.ObjectId(value);
  } catch {
    return null;
  }
}

async function resolveStudentForUser(user) {
  const profile = user?.profile || {};
  if (profile.studentRef) {
    const byRef = await Student.findById(profile.studentRef);
    if (byRef) return byRef;
  }
  if (profile.studentId) {
    const byStudentId = await Student.findOne({ studentId: String(profile.studentId) });
    if (byStudentId) return byStudentId;
  }
  // last-resort: allow profile.studentRef to be a studentId string
  if (typeof profile.studentRef === 'string') {
    const byStudentId = await Student.findOne({ studentId: String(profile.studentRef) });
    if (byStudentId) return byStudentId;
  }
  return null;
}

function computeIsLate(homework) {
  return Date.now() > new Date(homework.dueDate).getTime();
}

function pickSubmissionForStudent(homeworkDoc, studentId) {
  return homeworkDoc.submissions.find((s) => String(s.student) === String(studentId)) || null;
}

function ensureSubmission(homeworkDoc, student, studentUserId) {
  let submission = pickSubmissionForStudent(homeworkDoc, student._id);
  if (!submission) {
    homeworkDoc.submissions.push({
      student: student._id,
      studentUser: studentUserId,
      status: 'draft',
      contentText: '',
      files: []
    });
    submission = homeworkDoc.submissions[homeworkDoc.submissions.length - 1];
  }
  return submission;
}

function canStudentModifySubmission(homeworkDoc, submission) {
  const now = Date.now();
  const due = new Date(homeworkDoc.dueDate).getTime();
  if (now > due) return false;
  if (!submission) return true;
  if (['received', 'returned'].includes(submission.status)) return false;
  return true;
}

function appendHomeworkEdit(homework, user, action = 'update', note = '') {
  homework.lastEditedBy = user?.id || user?._id || null;
  homework.lastEditedAt = new Date();
  homework.editHistory = Array.isArray(homework.editHistory) ? homework.editHistory : [];
  homework.editHistory.push({
    editedBy: user?.id || user?._id || null,
    editorRole: String(user?.role || ''),
    action,
    note: String(note || ''),
    editedAt: new Date()
  });
}

// Teacher: Post homework
async function createHomework(req, res, next) {
  try {
    const {
      title,
      description,
      subject,
      class: cls,
      section,
      dueDate,
      gradingMode,
      maxMarks
    } = req.body;

    const subjectDoc = await Subject.findById(subject).select('name');
    if (!subjectDoc) return res.status(404).json({ error: 'Subject not found' });

    const homework = await Homework.create({
      title,
      description,
      subject,
      subjectName: subjectDoc.name,
      teacher: req.user.id,
      teacherName: req.user.name,
      class: cls,
      section,
      dueDate: new Date(dueDate),
      gradingMode: gradingMode || 'none',
      maxMarks: gradingMode === 'marks' ? maxMarks : undefined,
      totalMarks: gradingMode === 'marks' ? (maxMarks || 0) : 0,
      status: 'published'
    });

    await homework.populate('subject', 'name');
    await homework.populate('teacher', 'name email');

    res.status(201).json({ homework });
  } catch (err) {
    next(err);
  }
}

// Teacher: Get their homeworks
async function getHomeworksByTeacher(req, res, next) {
  try {
    const filter = { teacher: new mongoose.Types.ObjectId(req.user.id) };
    const { class: cls, section, status, subject } = req.query;

    if (cls) filter.class = cls;
    if (section) filter.section = section;
    if (status) filter.status = status;
    if (subject) {
      const subjectId = toObjectId(subject);
      if (subjectId) filter.subject = subjectId;
    }

    const homeworks = await Homework.find(filter)
      .populate('subject', 'name')
      .populate('submissions.student', 'firstName lastName studentId')
      .sort({ postedDate: -1 });

    res.json({ homeworks });
  } catch (err) {
    next(err);
  }
}

// Students: Get homeworks for their class
async function getHomeworksForStudent(req, res, next) {
  try {
    const student = await resolveStudentForUser(req.user);
    if (!student) return res.status(404).json({ error: 'Student record not linked to this login' });

    const filter = { class: student.class, section: student.section, status: 'published' };
    const { subject } = req.query;
    if (subject) {
      const subjectId = toObjectId(subject);
      if (subjectId) filter.subject = subjectId;
    }

    const homeworks = await Homework.find(filter)
      .populate('subject', 'name')
      .populate('teacher', 'name email')
      .sort({ dueDate: 1 });

    // Add submission status for this student
    const withStatus = homeworks.map((hw) => {
      const submission = pickSubmissionForStudent(hw, student._id);
      return {
        ...hw.toObject(),
        submitted: submission ? submission.status !== 'draft' : false,
        submissionDetails: submission || null,
        canCancel: submission ? submission.status === 'submitted' && canStudentModifySubmission(hw, submission) : false,
        canEditDraft: canStudentModifySubmission(hw, submission)
      };
    });

    res.json({ homeworks: withStatus });
  } catch (err) {
    next(err);
  }
}

// Parents: Get homeworks for their children
async function getHomeworksForParent(req, res, next) {
  try {
    const children = await Student.find({ parents: req.user.id });
    if (children.length === 0) return res.json({ children: [], homeworksByChild: [] });

    const orFilters = children
      .filter((c) => c.class && c.section)
      .map((c) => ({ class: c.class, section: c.section, status: 'published' }));

    const homeworks = await Homework.find({ $or: orFilters })
      .populate('subject', 'name')
      .populate('teacher', 'name email')
      .sort({ dueDate: 1 });

    const homeworksByChild = children.map((child) => {
      const relevant = homeworks
        .filter((hw) => hw.class === child.class && hw.section === child.section)
        .map((hw) => {
          const submission = pickSubmissionForStudent(hw, child._id);
          return {
            ...hw.toObject(),
            submissionDetails: submission || null
          };
        });
      return { child, homeworks: relevant };
    });

    res.json({ children, homeworksByChild });
  } catch (err) {
    next(err);
  }
}

// Admin/Principal: View-only list with required class+section filter
async function getHomeworksForAdminPrincipal(req, res, next) {
  try {
    const { class: cls, section, status, subject, sortBy, order } = req.query;

    if (!cls || !section) {
      return res.status(400).json({ error: 'class and section are required' });
    }

    const filter = { class: cls, section };
    if (status) filter.status = status;
    else filter.status = 'published';
    if (subject) {
      const subjectId = toObjectId(subject);
      if (subjectId) filter.subject = subjectId;
    }

    const sortDir = order === 'asc' ? 1 : -1;
    const sort = { dueDate: 1 };
    if (sortBy === 'teacher') sort.teacherName = sortDir;
    else if (sortBy === 'subject') sort.subjectName = sortDir;
    else if (sortBy === 'postedDate') sort.postedDate = sortDir;
    else sort.dueDate = sortDir;

    const homeworks = await Homework.find(filter)
      .populate('subject', 'name')
      .populate('teacher', 'name email')
      .sort(sort);

    res.json({ homeworks });
  } catch (err) {
    next(err);
  }
}

// Student: Submit homework
async function submitHomework(req, res, next) {
  try {
    const homework = await Homework.findById(req.params.id);
    if (!homework) return res.status(404).json({ error: 'Homework not found' });

    if (homework.status !== 'published') {
      return res.status(400).json({ error: 'Homework is not open for submission' });
    }

    const student = await resolveStudentForUser(req.user);
    if (!student) return res.status(404).json({ error: 'Student record not linked to this login' });
    if (homework.class !== student.class || homework.section !== student.section) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    let submission = pickSubmissionForStudent(homework, student._id);
    submission = ensureSubmission(homework, student, req.user.id);

    if (!canStudentModifySubmission(homework, submission)) {
      return res.status(400).json({ error: 'Submission can no longer be modified' });
    }

    submission.status = 'submitted';
    submission.submittedAt = new Date();
    submission.isLate = computeIsLate(homework);

    await homework.save();
    res.json({ homework });
  } catch (err) {
    next(err);
  }
}

// Student: Update draft content
async function updateSubmissionDraft(req, res, next) {
  try {
    const { contentText } = req.body;
    const homework = await Homework.findById(req.params.id);
    if (!homework) return res.status(404).json({ error: 'Homework not found' });
    if (homework.status !== 'published') {
      return res.status(400).json({ error: 'Homework is not open for submission' });
    }

    const student = await resolveStudentForUser(req.user);
    if (!student) return res.status(404).json({ error: 'Student record not linked to this login' });
    if (homework.class !== student.class || homework.section !== student.section) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const submission = ensureSubmission(homework, student, req.user.id);
    if (!canStudentModifySubmission(homework, submission)) {
      return res.status(400).json({ error: 'Submission can no longer be modified' });
    }
    if (submission.status !== 'draft') {
      return res.status(400).json({ error: 'Only draft submissions can be edited' });
    }

    submission.contentText = String(contentText || '');
    await homework.save();
    res.json({ submission });
  } catch (err) {
    next(err);
  }
}

// Student: Cancel submission (revert to draft)
async function cancelSubmission(req, res, next) {
  try {
    const homework = await Homework.findById(req.params.id);
    if (!homework) return res.status(404).json({ error: 'Homework not found' });
    if (homework.status !== 'published') {
      return res.status(400).json({ error: 'Homework is not open for submission' });
    }

    const student = await resolveStudentForUser(req.user);
    if (!student) return res.status(404).json({ error: 'Student record not linked to this login' });
    if (homework.class !== student.class || homework.section !== student.section) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const submission = pickSubmissionForStudent(homework, student._id);
    if (!submission) return res.status(404).json({ error: 'Submission not found' });
    if (submission.status !== 'submitted') {
      return res.status(400).json({ error: 'Only submitted work can be cancelled' });
    }
    if (!canStudentModifySubmission(homework, submission)) {
      return res.status(400).json({ error: 'Submission can no longer be cancelled' });
    }

    submission.status = 'draft';
    submission.cancelledAt = new Date();
    await homework.save();
    res.json({ submission });
  } catch (err) {
    next(err);
  }
}

// Teacher: Grade submission
async function gradeSubmission(req, res, next) {
  try {
    const { submissionStudentId, marks, feedback } = req.body;
    const homework = await Homework.findById(req.params.id);
    if (!homework) return res.status(404).json({ error: 'Homework not found' });

    if (homework.teacher.toString() !== req.user.id.toString() && req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const submission = homework.submissions.find((s) => String(s.student) === String(submissionStudentId));
    if (!submission) return res.status(404).json({ error: 'Submission not found' });

    if (homework.gradingMode === 'marks') {
      if (marks === undefined || marks === null) {
        return res.status(400).json({ error: 'marks are required for this homework' });
      }
      if (homework.maxMarks !== undefined && homework.maxMarks !== null && Number(marks) > Number(homework.maxMarks)) {
        return res.status(400).json({ error: 'marks cannot exceed maxMarks' });
      }
      submission.marks = marks;
    }
    if (feedback !== undefined) submission.feedback = feedback;

    // This endpoint is now treated as "return" (checked + feedback)
    submission.status = 'returned';
    submission.returnedAt = new Date();

    await homework.save();
    res.json({ homework });
  } catch (err) {
    next(err);
  }
}

// Teacher: Mark submission received (checked)
async function receiveSubmission(req, res, next) {
  try {
    const { submissionStudentId } = req.body;
    const homework = await Homework.findById(req.params.id);
    if (!homework) return res.status(404).json({ error: 'Homework not found' });
    if (homework.teacher.toString() !== req.user.id.toString() && req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const submission = homework.submissions.find((s) => String(s.student) === String(submissionStudentId));
    if (!submission) return res.status(404).json({ error: 'Submission not found' });
    if (submission.status !== 'submitted') {
      return res.status(400).json({ error: 'Only submitted work can be received' });
    }

    submission.status = 'received';
    submission.receivedAt = new Date();
    await homework.save();
    res.json({ homework });
  } catch (err) {
    next(err);
  }
}

// Get single homework with submissions
async function getHomework(req, res, next) {
  try {
    const homework = await Homework.findById(req.params.id)
      .populate('subject', 'name')
      .populate('teacher', 'name email')
      .populate('submissions.student', 'firstName lastName studentId class section')
      .populate('submissions.studentUser', 'name email role');

    if (!homework) return res.status(404).json({ error: 'Not found' });

    const role = req.user.role;
    if (role === 'Teacher') {
      const teacherId = homework.teacher?._id ? homework.teacher._id.toString() : homework.teacher.toString();
      if (teacherId !== req.user.id.toString()) return res.status(403).json({ error: 'Forbidden' });
      return res.json({ homework });
    }
    if (['Admin', 'Principal'].includes(role)) {
      return res.json({ homework });
    }
    if (role === 'Student') {
      const student = await resolveStudentForUser(req.user);
      if (!student) return res.status(404).json({ error: 'Student record not linked to this login' });
      if (homework.status !== 'published') return res.status(403).json({ error: 'Forbidden' });
      if (homework.class !== student.class || homework.section !== student.section) return res.status(403).json({ error: 'Forbidden' });

      const obj = homework.toObject();
      obj.submissions = obj.submissions.filter((s) => String(s.student) === String(student._id));
      return res.json({ homework: obj });
    }
    if (role === 'Parent') {
      const children = await Student.find({ parents: req.user.id });
      if (children.length === 0) return res.status(403).json({ error: 'Forbidden' });

      const childId = req.query.childId;
      let child = null;
      if (childId) child = children.find((c) => String(c._id) === String(childId)) || null;
      if (!child) {
        child = children.find((c) => c.class === homework.class && c.section === homework.section) || null;
      }
      if (!child) return res.status(403).json({ error: 'Forbidden' });
      if (homework.status !== 'published') return res.status(403).json({ error: 'Forbidden' });

      const obj = homework.toObject();
      obj.submissions = obj.submissions.filter((s) => String(s.student) === String(child._id));
      return res.json({ homework: obj, child });
    }

    return res.status(403).json({ error: 'Forbidden' });
  } catch (err) {
    next(err);
  }
}

// Teacher: Update homework
async function updateHomework(req, res, next) {
  try {
    const { title, description, dueDate, status, auditNote } = req.body;
    const homework = await Homework.findById(req.params.id);
    if (!homework) return res.status(404).json({ error: 'Not found' });

    const canEditAsAdmin = ['Admin', 'Principal'].includes(req.user.role);
    if (homework.teacher.toString() !== req.user.id.toString() && !canEditAsAdmin) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (title) homework.title = title;
    if (description) homework.description = description;
    if (dueDate) homework.dueDate = new Date(dueDate);
    if (status) homework.status = status;
    appendHomeworkEdit(homework, req.user, 'update', auditNote || 'Homework updated');

    await homework.save();
    res.json({ homework });
  } catch (err) {
    next(err);
  }
}

async function deleteHomework(req, res, next) {
  try {
    const homework = await Homework.findById(req.params.id);
    if (!homework) return res.status(404).json({ error: 'Not found' });

    const canDeleteAsAdmin = ['Admin', 'Principal'].includes(req.user.role);
    if (homework.teacher.toString() !== req.user.id.toString() && !canDeleteAsAdmin) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await HomeworkFile.deleteMany({ homework: homework._id });
    await homework.deleteOne();
    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

async function getHomeworkAuditSummary(req, res, next) {
  try {
    const { class: cls, section, teacherId, subject, fromDate, toDate } = req.query;
    const filter = {};
    if (cls) filter.class = String(cls).trim();
    if (section) filter.section = String(section).trim();
    if (teacherId) filter.teacher = teacherId;
    if (subject) filter.subject = subject;

    if (fromDate || toDate) {
      filter.postedDate = {};
      if (fromDate) filter.postedDate.$gte = new Date(fromDate);
      if (toDate) {
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        filter.postedDate.$lte = end;
      }
    }

    const rows = await Homework.find(filter)
      .populate('subject', 'name')
      .populate('teacher', 'name email')
      .select('title class section subject subjectName teacher teacherName status dueDate postedDate submissions lastEditedAt')
      .sort({ postedDate: -1 })
      .lean();

    const summary = {
      totalHomework: rows.length,
      published: rows.filter((row) => row.status === 'published').length,
      closed: rows.filter((row) => row.status === 'closed').length,
      draft: rows.filter((row) => row.status === 'draft').length,
      submittedCount: 0,
      receivedCount: 0,
      returnedCount: 0,
      pendingReviewCount: 0
    };

    const byTeacher = new Map();
    const bySubject = new Map();

    const audits = rows.map((row) => {
      const submissions = Array.isArray(row.submissions) ? row.submissions : [];
      const statusCounts = submissions.reduce(
        (acc, s) => {
          const key = String(s?.status || 'draft');
          if (!acc[key]) acc[key] = 0;
          acc[key] += 1;
          return acc;
        },
        { draft: 0, submitted: 0, received: 0, returned: 0 }
      );

      summary.submittedCount += statusCounts.submitted;
      summary.receivedCount += statusCounts.received;
      summary.returnedCount += statusCounts.returned;
      summary.pendingReviewCount += statusCounts.submitted + statusCounts.received;

      const teacherName = row.teacherName || row.teacher?.name || 'Unknown Teacher';
      const teacherKey = String(row.teacher?._id || row.teacher || teacherName);
      const teacherStat = byTeacher.get(teacherKey) || { id: teacherKey, name: teacherName, totalHomework: 0, pendingReview: 0 };
      teacherStat.totalHomework += 1;
      teacherStat.pendingReview += statusCounts.submitted + statusCounts.received;
      byTeacher.set(teacherKey, teacherStat);

      const subjectName = row.subjectName || row.subject?.name || 'Unknown Subject';
      const subjectKey = String(row.subject?._id || row.subject || subjectName);
      const subjectStat = bySubject.get(subjectKey) || { id: subjectKey, name: subjectName, totalHomework: 0, pendingReview: 0 };
      subjectStat.totalHomework += 1;
      subjectStat.pendingReview += statusCounts.submitted + statusCounts.received;
      bySubject.set(subjectKey, subjectStat);

      return {
        id: String(row._id),
        title: row.title,
        class: row.class,
        section: row.section,
        subject: subjectName,
        teacher: teacherName,
        status: row.status,
        dueDate: row.dueDate,
        postedDate: row.postedDate,
        lastEditedAt: row.lastEditedAt || null,
        submissions: {
          total: submissions.length,
          draft: statusCounts.draft,
          submitted: statusCounts.submitted,
          received: statusCounts.received,
          returned: statusCounts.returned
        }
      };
    });

    return res.json({
      summary,
      byTeacher: Array.from(byTeacher.values()).sort((a, b) => b.pendingReview - a.pendingReview),
      bySubject: Array.from(bySubject.values()).sort((a, b) => b.pendingReview - a.pendingReview),
      audits
    });
  } catch (err) {
    next(err);
  }
}

// Teacher: Upload attachments
async function uploadAttachments(req, res, next) {
  try {
    const homework = await Homework.findById(req.params.id);
    if (!homework) return res.status(404).json({ error: 'Homework not found' });
    if (homework.teacher.toString() !== req.user.id.toString() && req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const files = Array.isArray(req.files) ? req.files : [];
    if (files.length === 0) return res.status(400).json({ error: 'No files uploaded' });

    const created = [];
    for (const f of files) {
      const doc = await HomeworkFile.create({
        homework: homework._id,
        owner: req.user.id,
        kind: 'teacher-attachment',
        filename: f.originalname,
        mimeType: f.mimetype,
        size: f.size,
        data: f.buffer
      });
      const ref = {
        fileId: doc._id,
        name: doc.filename,
        mimeType: doc.mimeType,
        size: doc.size,
        url: `/api/homeworks/files/${doc._id}`
      };
      homework.attachments.push(ref);
      created.push(ref);
    }

    await homework.save();
    res.status(201).json({ attachments: created });
  } catch (err) {
    next(err);
  }
}

// Student: Upload submission files (adds to draft)
async function uploadSubmissionFiles(req, res, next) {
  try {
    const homework = await Homework.findById(req.params.id);
    if (!homework) return res.status(404).json({ error: 'Homework not found' });
    if (homework.status !== 'published') {
      return res.status(400).json({ error: 'Homework is not open for submission' });
    }

    const student = await resolveStudentForUser(req.user);
    if (!student) return res.status(404).json({ error: 'Student record not linked to this login' });
    if (homework.class !== student.class || homework.section !== student.section) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const submission = ensureSubmission(homework, student, req.user.id);
    if (!canStudentModifySubmission(homework, submission)) {
      return res.status(400).json({ error: 'Submission can no longer be modified' });
    }
    if (submission.status !== 'draft') {
      return res.status(400).json({ error: 'Only draft submissions can accept uploads' });
    }

    const files = Array.isArray(req.files) ? req.files : [];
    if (files.length === 0) return res.status(400).json({ error: 'No files uploaded' });

    const created = [];
    for (const f of files) {
      const doc = await HomeworkFile.create({
        homework: homework._id,
        owner: req.user.id,
        student: student._id,
        kind: 'student-submission',
        filename: f.originalname,
        mimeType: f.mimetype,
        size: f.size,
        data: f.buffer
      });

      const ref = {
        fileId: doc._id,
        name: doc.filename,
        mimeType: doc.mimeType,
        size: doc.size,
        url: `/api/homeworks/files/${doc._id}`
      };
      submission.files.push(ref);
      created.push(ref);
    }

    await homework.save();
    res.status(201).json({ files: created, submission });
  } catch (err) {
    next(err);
  }
}

async function getHomeworkFile(req, res, next) {
  try {
    const file = await HomeworkFile.findById(req.params.fileId);
    if (!file) return res.status(404).json({ error: 'File not found' });

    const homework = await Homework.findById(file.homework).select('teacher class section status');
    if (!homework) return res.status(404).json({ error: 'Homework not found' });

    const role = req.user.role;
    let allowed = false;

    if (['Admin', 'Principal'].includes(role)) {
      allowed = true;
    } else if (role === 'Teacher') {
      allowed = String(homework.teacher) === String(req.user.id);
    } else if (role === 'Student') {
      const student = await resolveStudentForUser(req.user);
      if (student && homework.status === 'published' && homework.class === student.class && homework.section === student.section) {
        if (file.kind === 'teacher-attachment') allowed = true;
        if (file.kind === 'student-submission') allowed = String(file.student) === String(student._id);
      }
    } else if (role === 'Parent') {
      const children = await Student.find({ parents: req.user.id });
      if (children.length > 0 && homework.status === 'published') {
        if (file.kind === 'teacher-attachment') {
          allowed = children.some((c) => c.class === homework.class && c.section === homework.section);
        } else if (file.kind === 'student-submission') {
          allowed = children.some((c) => String(c._id) === String(file.student));
        }
      }
    }

    if (!allowed) return res.status(403).json({ error: 'Forbidden' });

    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Length', file.size);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.filename)}"`);
    res.end(file.data);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createHomework,
  getHomeworksByTeacher,
  getHomeworksForStudent,
  getHomeworksForParent,
  getHomeworksForAdminPrincipal,
  getHomework,
  updateHomework,
  deleteHomework,
  updateSubmissionDraft,
  uploadSubmissionFiles,
  submitHomework,
  cancelSubmission,
  receiveSubmission,
  gradeSubmission,
  uploadAttachments,
  getHomeworkFile,
  getHomeworkAuditSummary
};
