const mongoose = require('mongoose');
const { DailyDiary, Subject, User, Student, AttendanceAssignment } = require('../models');

function normalizeDay(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
}

function appendDiaryEdit(diary, user, action = 'update', note = '') {
  diary.updatedBy = user?.id || user?._id || null;
  diary.editHistory = Array.isArray(diary.editHistory) ? diary.editHistory : [];
  diary.editHistory.push({
    editedBy: user?.id || user?._id || null,
    editorRole: String(user?.role || ''),
    action,
    note: String(note || ''),
    editedAt: new Date()
  });
}

async function resolveStudentForUser(user) {
  if (user?.id || user?._id) {
    const byUser = await Student.findOne({ user: user.id || user._id });
    if (byUser) return byUser;
  }

  const profile = user?.profile || {};
  if (profile.studentRef) {
    const byRef = await Student.findById(profile.studentRef);
    if (byRef) return byRef;
  }
  if (profile.studentId) {
    const byStudentId = await Student.findOne({ studentId: String(profile.studentId) });
    if (byStudentId) return byStudentId;
  }
  if (typeof profile.studentRef === 'string') {
    const byStudentId = await Student.findOne({ studentId: String(profile.studentRef) });
    if (byStudentId) return byStudentId;
  }
  return null;
}

function sanitizeDiaryRow(row) {
  return {
    id: String(row._id),
    date: row.date,
    class: row.class,
    section: row.section,
    subject: row.subject ? { id: String(row.subject._id || row.subject), name: row.subject?.name || row.subjectName || '' } : { id: '', name: row.subjectName || '' },
    teacher: row.teacher ? { id: String(row.teacher._id || row.teacher), name: row.teacher?.name || row.teacherName || '' } : { id: '', name: row.teacherName || '' },
    title: row.title,
    content: row.content || '',
    status: row.status,
    updatedAt: row.updatedAt,
    createdAt: row.createdAt
  };
}

function isTeacherRole(req) {
  return String(req.user?.role || '') === 'Teacher';
}

function isAdminScopeRole(req) {
  return ['Admin', 'Principal'].includes(String(req.user?.role || ''));
}

function isReceptionRole(req) {
  return String(req.user?.role || '') === 'Reception';
}

async function assertTeacherIncharge(req, className, section) {
  const assignment = await AttendanceAssignment.findOne({
    teacher: new mongoose.Types.ObjectId(req.user.id),
    className: String(className || '').trim(),
    section: String(section || '').trim()
  })
    .select('_id')
    .lean();

  if (!assignment) {
    const err = new Error('Only class incharge teacher can add daily diary for this class and section');
    err.status = 403;
    throw err;
  }
}

async function createDailyDiary(req, res, next) {
  try {
    const body = req.body || {};
    const normalizedDate = normalizeDay(body.date);
    if (!normalizedDate) return res.status(400).json({ error: 'Invalid date' });

    const className = String(body.class || '').trim();
    const section = String(body.section || '').trim();
    if (!className || !section) return res.status(400).json({ error: 'class and section are required' });

    const subject = await Subject.findById(body.subject).select('_id name').lean();
    if (!subject) return res.status(404).json({ error: 'Subject not found' });

    if (isTeacherRole(req)) {
      await assertTeacherIncharge(req, className, section);
    }

    const duplicate = await DailyDiary.findOne({
      class: className,
      section,
      subject: subject._id,
      date: normalizedDate
    })
      .select('_id')
      .lean();
    if (duplicate) {
      return res.status(409).json({ error: 'Diary already exists for this class, section, subject, and date' });
    }

    let teacherId = req.user.id;
    if (isAdminScopeRole(req) || isReceptionRole(req)) {
      if (body.teacherId) {
        const teacherUser = await User.findById(body.teacherId).select('_id role name').lean();
        if (!teacherUser || String(teacherUser.role || '').toLowerCase() !== 'teacher') {
          return res.status(404).json({ error: 'Teacher not found' });
        }
        teacherId = teacherUser._id;
      }
    }

    const teacherUser = await User.findById(teacherId).select('_id name role').lean();
    if (!teacherUser) return res.status(404).json({ error: 'Teacher not found' });

    const diary = await DailyDiary.create({
      date: normalizedDate,
      class: className,
      section,
      subject: subject._id,
      subjectName: subject.name,
      teacher: teacherUser._id,
      teacherName: teacherUser.name,
      title: String(body.title || '').trim(),
      content: String(body.content || ''),
      status: body.status || 'published',
      createdBy: req.user.id,
      updatedBy: req.user.id,
      editHistory: [{
        editedBy: req.user.id,
        editorRole: req.user.role,
        action: 'create',
        note: String(body.auditNote || 'Daily diary created'),
        editedAt: new Date()
      }]
    });

    await diary.populate('subject', 'name');
    await diary.populate('teacher', 'name');
    return res.status(201).json({ diary: sanitizeDiaryRow(diary) });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ error: 'Diary already exists for this class, section, subject, and date' });
    }
    next(err);
  }
}

async function listDailyDiaries(req, res, next) {
  try {
    const role = String(req.user?.role || '');
    const query = req.query || {};
    const filter = {};

    if (query.date) {
      const day = normalizeDay(query.date);
      if (!day) return res.status(400).json({ error: 'Invalid date' });
      filter.date = day;
    }

    if (query.fromDate || query.toDate) {
      filter.date = filter.date || {};
      if (query.fromDate) {
        const fromDate = normalizeDay(query.fromDate);
        if (!fromDate) return res.status(400).json({ error: 'Invalid fromDate' });
        filter.date.$gte = fromDate;
      }
      if (query.toDate) {
        const toDate = normalizeDay(query.toDate);
        if (!toDate) return res.status(400).json({ error: 'Invalid toDate' });
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        filter.date.$lte = end;
      }
    }

    if (query.class) filter.class = String(query.class).trim();
    if (query.section) filter.section = String(query.section).trim();
    if (query.subject) filter.subject = query.subject;
    if (query.teacherId) filter.teacher = query.teacherId;
    if (query.status) filter.status = query.status;

    if (role === 'Teacher') {
      filter.teacher = req.user.id;
    } else if (role === 'Student') {
      const student = await resolveStudentForUser(req.user);
      if (!student) return res.status(404).json({ error: 'Student record not linked to this login' });
      filter.class = student.class;
      filter.section = student.section;
      filter.status = 'published';
    } else if (role === 'Parent') {
      const children = await Student.find({ parents: req.user.id }).select('_id firstName lastName studentId class section').lean();
      if (!children.length) return res.json({ children: [], diariesByChild: [] });

      const childId = String(query.childId || '').trim();
      const targetChildren = childId ? children.filter((child) => String(child._id) === childId) : children;
      if (childId && !targetChildren.length) return res.status(403).json({ error: 'Selected child is not linked to this parent' });

      const childFilters = targetChildren.map((child) => ({ class: child.class, section: child.section, status: 'published' }));
      const rows = await DailyDiary.find({
        ...(filter.date ? { date: filter.date } : {}),
        ...(filter.subject ? { subject: filter.subject } : {}),
        ...(filter.teacher ? { teacher: filter.teacher } : {}),
        ...(query.q ? { title: { $regex: String(query.q), $options: 'i' } } : {}),
        $or: childFilters
      })
        .populate('subject', 'name')
        .populate('teacher', 'name')
        .sort({ date: -1, updatedAt: -1 })
        .lean();

      const diariesByChild = targetChildren.map((child) => {
        const diaries = rows
          .filter((row) => row.class === child.class && row.section === child.section)
          .map((row) => ({
            id: String(row._id),
            date: row.date,
            class: row.class,
            section: row.section,
            subject: row.subject?.name || row.subjectName,
            title: row.title,
            status: row.status
          }));

        return {
          child: {
            id: String(child._id),
            name: [child.firstName, child.lastName].filter(Boolean).join(' ').trim(),
            studentId: child.studentId,
            class: child.class,
            section: child.section
          },
          diaries
        };
      });

      return res.json({ children: targetChildren, diariesByChild });
    }

    const rows = await DailyDiary.find(filter)
      .populate('subject', 'name')
      .populate('teacher', 'name')
      .sort({ date: -1, updatedAt: -1 })
      .lean();

    const q = String(query.q || '').trim().toLowerCase();
    const filtered = q
      ? rows.filter((row) => [row.title, row.content, row.class, row.section, row.subjectName, row.teacherName].join(' ').toLowerCase().includes(q))
      : rows;

    return res.json({ diaries: filtered.map((row) => sanitizeDiaryRow(row)) });
  } catch (err) {
    next(err);
  }
}

async function getDailyDiary(req, res, next) {
  try {
    const diary = await DailyDiary.findById(req.params.id)
      .populate('subject', 'name')
      .populate('teacher', 'name')
      .lean();

    if (!diary) return res.status(404).json({ error: 'Daily diary not found' });

    const role = String(req.user?.role || '');
    if (role === 'Teacher' && String(diary.teacher?._id || diary.teacher) !== String(req.user.id)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (role === 'Student') {
      const student = await resolveStudentForUser(req.user);
      if (!student) return res.status(404).json({ error: 'Student record not linked to this login' });
      if (diary.class !== student.class || diary.section !== student.section || diary.status !== 'published') {
        return res.status(403).json({ error: 'Forbidden' });
      }
    }

    if (role === 'Parent') {
      const children = await Student.find({ parents: req.user.id }).select('_id class section').lean();
      const allowed = children.some((child) => child.class === diary.class && child.section === diary.section);
      if (!allowed || diary.status !== 'published') return res.status(403).json({ error: 'Forbidden' });
      return res.json({
        diary: {
          id: String(diary._id),
          date: diary.date,
          class: diary.class,
          section: diary.section,
          subject: diary.subject?.name || diary.subjectName,
          title: diary.title,
          status: diary.status
        }
      });
    }

    return res.json({ diary: sanitizeDiaryRow(diary) });
  } catch (err) {
    next(err);
  }
}

async function updateDailyDiary(req, res, next) {
  try {
    const diary = await DailyDiary.findById(req.params.id);
    if (!diary) return res.status(404).json({ error: 'Daily diary not found' });

    const role = String(req.user?.role || '');
    if (role === 'Teacher' && String(diary.teacher) !== String(req.user.id)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const body = req.body || {};

    if (body.class !== undefined) diary.class = String(body.class || '').trim();
    if (body.section !== undefined) diary.section = String(body.section || '').trim();

    if (body.date !== undefined) {
      const normalizedDate = normalizeDay(body.date);
      if (!normalizedDate) return res.status(400).json({ error: 'Invalid date' });
      diary.date = normalizedDate;
    }

    if (body.subject !== undefined) {
      const subject = await Subject.findById(body.subject).select('_id name').lean();
      if (!subject) return res.status(404).json({ error: 'Subject not found' });
      diary.subject = subject._id;
      diary.subjectName = subject.name;
    }

    if (isTeacherRole(req)) {
      await assertTeacherIncharge(req, diary.class, diary.section);
    }

    if (body.title !== undefined) diary.title = String(body.title || '').trim();
    if (body.content !== undefined) diary.content = String(body.content || '');
    if (body.status !== undefined) diary.status = body.status;

    const duplicate = await DailyDiary.findOne({
      _id: { $ne: diary._id },
      class: diary.class,
      section: diary.section,
      subject: diary.subject,
      date: diary.date
    })
      .select('_id')
      .lean();
    if (duplicate) {
      return res.status(409).json({ error: 'Diary already exists for this class, section, subject, and date' });
    }

    appendDiaryEdit(diary, req.user, 'update', body.auditNote || 'Daily diary updated');
    await diary.save();
    await diary.populate('subject', 'name');
    await diary.populate('teacher', 'name');

    return res.json({ diary: sanitizeDiaryRow(diary) });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ error: 'Diary already exists for this class, section, subject, and date' });
    }
    next(err);
  }
}

async function deleteDailyDiary(req, res, next) {
  try {
    const diary = await DailyDiary.findById(req.params.id);
    if (!diary) return res.status(404).json({ error: 'Daily diary not found' });

    if (!isAdminScopeRole(req)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await diary.deleteOne();
    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createDailyDiary,
  listDailyDiaries,
  getDailyDiary,
  updateDailyDiary,
  deleteDailyDiary
};
