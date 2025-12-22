const { Homework, Student } = require('../models');
const mongoose = require('mongoose');

// Teacher: Post homework
async function createHomework(req, res, next) {
  try {
    const { title, description, subject, class: cls, section, dueDate, attachments, totalMarks } = req.body;
    if (!title || !subject || !cls || !dueDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const homework = await Homework.create({
      title,
      description,
      subject,
      teacher: req.user.id,
      class: cls,
      section,
      dueDate: new Date(dueDate),
      attachments: attachments || [],
      totalMarks: totalMarks || 0,
      status: 'published'
    });

    await homework.populate('subject', 'name code');
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
    const { class: cls, status } = req.query;

    if (cls) filter.class = cls;
    if (status) filter.status = status;

    const homeworks = await Homework.find(filter)
      .populate('subject', 'name code')
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
    const student = await Student.findOne({ _id: req.user.id });
    if (!student) return res.status(404).json({ error: 'Student record not found' });

    const filter = { class: student.class, status: 'published' };
    const { subject } = req.query;
    if (subject) filter.subject = new mongoose.Types.ObjectId(subject);

    const homeworks = await Homework.find(filter)
      .populate('subject', 'name code')
      .populate('teacher', 'name email')
      .sort({ dueDate: 1 });

    // Add submission status for this student
    const withStatus = homeworks.map((hw) => {
      const submission = hw.submissions.find((s) => s.student.toString() === req.user.id.toString());
      return {
        ...hw.toObject(),
        submitted: !!submission,
        submissionDetails: submission || null
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
    if (children.length === 0) return res.json({ homeworks: [] });

    const childClasses = [...new Set(children.map((c) => c.class))];
    const homeworks = await Homework.find({ class: { $in: childClasses }, status: 'published' })
      .populate('subject', 'name code')
      .populate('teacher', 'name email')
      .populate('submissions.student', 'firstName lastName studentId')
      .sort({ dueDate: 1 });

    res.json({ homeworks });
  } catch (err) {
    next(err);
  }
}

// Student: Submit homework
async function submitHomework(req, res, next) {
  try {
    const { files } = req.body;
    const homework = await Homework.findById(req.params.id);
    if (!homework) return res.status(404).json({ error: 'Homework not found' });

    if (homework.status !== 'published') {
      return res.status(400).json({ error: 'Homework is not open for submission' });
    }

    const existingSubmission = homework.submissions.find((s) => s.student.toString() === req.user.id.toString());
    if (existingSubmission) {
      // Update existing submission
      existingSubmission.submittedAt = new Date();
      existingSubmission.files = files || [];
      existingSubmission.isLate = new Date() > new Date(homework.dueDate);
    } else {
      // Add new submission
      homework.submissions.push({
        student: req.user.id,
        files: files || [],
        isLate: new Date() > new Date(homework.dueDate)
      });
    }

    await homework.save();
    res.json({ homework });
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

    const submission = homework.submissions.find((s) => s.student.toString() === submissionStudentId);
    if (!submission) return res.status(404).json({ error: 'Submission not found' });

    if (marks !== undefined) submission.marks = marks;
    if (feedback) submission.feedback = feedback;

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
      .populate('subject', 'name code')
      .populate('teacher', 'name email')
      .populate('submissions.student', 'firstName lastName studentId');

    if (!homework) return res.status(404).json({ error: 'Not found' });
    res.json({ homework });
  } catch (err) {
    next(err);
  }
}

// Teacher: Update homework
async function updateHomework(req, res, next) {
  try {
    const { title, description, dueDate, status } = req.body;
    const homework = await Homework.findById(req.params.id);
    if (!homework) return res.status(404).json({ error: 'Not found' });

    if (homework.teacher.toString() !== req.user.id.toString() && req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (title) homework.title = title;
    if (description) homework.description = description;
    if (dueDate) homework.dueDate = new Date(dueDate);
    if (status) homework.status = status;

    await homework.save();
    res.json({ homework });
  } catch (err) {
    next(err);
  }
}

module.exports = { createHomework, getHomeworksByTeacher, getHomeworksForStudent, getHomeworksForParent, submitHomework, gradeSubmission, getHomework, updateHomework };
