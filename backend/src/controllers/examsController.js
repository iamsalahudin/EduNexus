const { ExamConfig, Exam, SchoolClass, ExamMark, Student, Subject, Timetable, Marksheet } = require('../models');
const { ensureDefaultExamConfigForClass, ensureDefaultExamConfigsForAllClasses, resolveAcademicYear } = require('../services/examDefaults');

function isAdminOrPrincipal(user) {
  return user?.role === 'Admin' || user?.role === 'Principal';
}

function isTeacher(user) {
  return user?.role === 'Teacher';
}

function isStudent(user) {
  return user?.role === 'Student';
}

function isParent(user) {
  return user?.role === 'Parent';
}

function isReceptionist(user) {
  return user?.role === 'Reception' || user?.role === 'Receptionist';
}

function isPublishedOnlyViewer(user) {
  return isStudent(user) || isParent(user) || isReceptionist(user);
}

function toObjectIdString(v) {
  return String(v || '').trim();
}

function defaultExamName(type, year, month) {
  if (type === 'monthly') return `Monthly Test ${month || ''} (${year})`.trim();
  if (type === 'mid') return `Mid Term (${year})`;
  if (type === 'final') return `Final Term (${year})`;
  return `Exam (${year})`;
}

async function resolveAllowedClassesForUser(user) {
  if (isStudent(user)) {
    const me = await Student.findOne({ user: user.id }).select('class').lean();
    return me?.class ? [String(me.class).trim()] : [];
  }

  if (isParent(user)) {
    const children = await Student.find({ parents: user.id }).select('class').lean();
    const uniq = new Set();
    for (const child of children) {
      const className = String(child?.class || '').trim();
      if (className) uniq.add(className);
    }
    return [...uniq];
  }

  return null;
}

async function buildDefaultSubjectsForClass(className, userId) {
  const normalizedClass = String(className || '').trim();
  if (!normalizedClass) return [];

  await ensureDefaultExamConfigForClass(normalizedClass, userId);
  const cfg = await ExamConfig.findOne({ className: normalizedClass }).lean();
  const defaultMaxMarks = Number(cfg?.structure?.defaultMaxMarks);
  const defaultPassingMarks = Number(cfg?.structure?.defaultPassingMarks);

  const subjects = await Subject.find({ className: normalizedClass, active: true })
    .sort({ order: 1, name: 1 })
    .select('_id')
    .lean();

  return subjects.map((s) => ({
    subject: s._id,
    ...(Number.isFinite(defaultMaxMarks) ? { maxMarks: defaultMaxMarks } : {}),
    ...(Number.isFinite(defaultPassingMarks) ? { passingMarks: defaultPassingMarks } : {})
  }));
}

async function createOrReuseExam({
  className,
  type,
  name,
  year,
  month,
  instructions,
  academicYear,
  subjects,
  userId
}) {
  const payload = {
    className: String(className || '').trim(),
    type: String(type || '').trim(),
    name: String(name || '').trim(),
    year: Number(year),
    instructions: String(instructions || '').trim(),
    createdBy: userId,
    updatedBy: userId,
    ...(academicYear ? { academicYear } : {})
  };

  if (!payload.className || !payload.name || !payload.type || !payload.year) {
    return { error: 'Missing required fields' };
  }

  const classExists = await SchoolClass.exists({ name: payload.className });
  if (!classExists) {
    return { error: `Class not found: ${payload.className}` };
  }

  const existingFilter = {
    className: payload.className,
    type: payload.type,
    year: payload.year,
    isArchived: false
  };

  if (payload.type === 'monthly') {
    const m = Number(month);
    if (!Number.isFinite(m)) return { error: 'Monthly exams require a valid month (1-12)' };
    payload.month = m;
    existingFilter.month = m;
  }

  const existingExams = await Exam.find(existingFilter)
    .select('_id status updatedAt createdAt')
    .sort({ updatedAt: -1, createdAt: -1 })
    .lean();

  if (existingExams.length) {
    const latestDraft = existingExams.find((x) => x?.status === 'draft');
    const preferred = latestDraft || existingExams[0];
    const exam = await Exam.findById(preferred._id).populate('subjects.subject', 'name className').lean();
    return {
      exam,
      reused: true,
      reusedFrom: latestDraft ? 'draft' : 'existing'
    };
  }

  const sourceSubjects = Array.isArray(subjects) ? subjects.filter((s) => toObjectIdString(s?.subject)) : [];
  payload.subjects = sourceSubjects.length ? sourceSubjects : await buildDefaultSubjectsForClass(payload.className, userId);

  try {
    const created = await Exam.create(payload);
    const exam = await Exam.findById(created._id).populate('subjects.subject', 'name className').lean();
    
    // Auto-create marksheets for each section of the class
    await autoCreateMarksheetsForExam(created._id, payload.className);
    
    return { exam, reused: false };
  } catch (err) {
    if (err && (err.code === 11000 || String(err.message || '').includes('E11000'))) {
      const existingDraft = await Exam.findOne({ ...existingFilter, status: 'draft' })
        .select('_id')
        .sort({ updatedAt: -1, createdAt: -1 })
        .lean();
      if (existingDraft?._id) {
        const exam = await Exam.findById(existingDraft._id).populate('subjects.subject', 'name className').lean();
        return { exam, reused: true, reusedFrom: 'draft' };
      }
    }
    throw err;
  }
}

function nowMs() {
  return Date.now();
}

function isWithinUploadWindow(exam) {
  const opensAt = exam?.marksEntry?.uploadOpensAt ? new Date(exam.marksEntry.uploadOpensAt).getTime() : null;
  const closesAt = exam?.marksEntry?.uploadClosesAt ? new Date(exam.marksEntry.uploadClosesAt).getTime() : null;
  const t = nowMs();
  if (opensAt && t < opensAt) return false;
  if (closesAt && t > closesAt) return false;
  return true;
}

function canTeacherEditMarks(exam) {
  if (!exam) return false;
  if (exam.status !== 'open') return false;
  if (exam?.marksEntry?.locked) return false;
  return isWithinUploadWindow(exam);
}

async function autoCreateMarksheetsForExam(examId, className) {
  try {
    const exam = await Exam.findById(examId).select('subjects').lean();
    if (!exam) return;

    const schoolClass = await SchoolClass.findOne({ name: className }).select('sections').lean();
    if (!schoolClass || !Array.isArray(schoolClass.sections)) return;

    const subjects = Array.isArray(exam.subjects)
      ? exam.subjects.map(s => s.subject).filter(s => s)
      : [];

    for (const section of schoolClass.sections) {
      try {
        // Check if marksheet already exists
        const exists = await Marksheet.exists({ exam: examId, className, section });
        if (exists) continue;

        // Get active students for this class/section
        const students = await Student.find({ class: className, section, status: 'incampus' })
          .select('_id')
          .lean();

        // Create subject max marks map
        const subjectMaxMarks = new Map();
        for (const subj of exam.subjects) {
          if (subj?.subject && subj?.maxMarks) {
            subjectMaxMarks.set(String(subj.subject), subj.maxMarks);
          }
        }

        // Build student rows
        const studentRows = students.map(student => ({
          student: student._id,
          subjectMarks: subjects.map(subjectId => ({
            subject: subjectId
          })),
          grPerformanceMarks: 0,
          teacherComments: ''
        }));

        // Create marksheet
        await Marksheet.create({
          exam: examId,
          className,
          section,
          subjects,
          subjectMaxMarks,
          studentRows,
          status: 'draft'
        });
      } catch (err) {
        console.error(`Error creating marksheet for ${className}/${section}:`, err.message);
      }
    }
  } catch (err) {
    console.error('Error in autoCreateMarksheetsForExam:', err.message);
  }
}

async function teacherHasAssignment({ teacherId, exam, subjectId, section }) {
  const year = Number(exam?.year) || new Date().getFullYear();
  const filter = { class: String(exam?.className || '').trim(), year, isActive: true };
  if (section) filter.section = String(section).trim();

  const timetables = await Timetable.find(filter).select('slots.teacher slots.subject').lean();
  if (!timetables.length) return { ok: false, error: 'No timetable found for this class/year (and section). Ask Admin to create timetable first.' };

  const teacherStr = String(teacherId);
  const subjectStr = String(subjectId);

  for (const tt of timetables) {
    for (const slot of tt?.slots || []) {
      if (!slot?.teacher || !slot?.subject) continue;
      if (String(slot.teacher) !== teacherStr) continue;
      if (String(slot.subject) !== subjectStr) continue;
      return { ok: true };
    }
  }

  return { ok: false, error: 'Forbidden: you are not assigned to this subject/class in the timetable.' };
}

async function teacherHasAnyAssignment({ teacherId, exam }) {
  const year = Number(exam?.year) || new Date().getFullYear();
  const filter = { class: String(exam?.className || '').trim(), year, isActive: true, 'slots.teacher': teacherId };
  const has = await Timetable.exists(filter);
  if (!has) {
    return { ok: false, error: 'Forbidden: you are not assigned to this class in the timetable.' };
  }
  return { ok: true };
}

async function listExamConfigs(req, res, next) {
  try {
    const { className } = req.query;
    const filter = {};
    if (className) filter.className = String(className).trim();

    const configs = await ExamConfig.find(filter).sort({ className: 1 }).lean();
    res.json({ configs });
  } catch (err) {
    next(err);
  }
}

async function ensureConfigs(req, res, next) {
  try {
    await ensureDefaultExamConfigsForAllClasses(req.user.id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

async function getExamConfig(req, res, next) {
  try {
    const config = await ExamConfig.findById(req.params.id).lean();
    if (!config) return res.status(404).json({ error: 'Not found' });
    res.json({ config });
  } catch (err) {
    next(err);
  }
}

function normalizeMonths(months) {
  if (!Array.isArray(months)) return undefined;
  const out = [];
  const seen = new Set();
  for (const m of months) {
    const n = Number(m);
    if (!Number.isFinite(n)) continue;
    const clamped = Math.min(12, Math.max(1, Math.floor(n)));
    if (seen.has(clamped)) continue;
    seen.add(clamped);
    out.push(clamped);
  }
  return out.sort((a, b) => a - b);
}

async function updateExamConfig(req, res, next) {
  try {
    const updates = { ...(req.body || {}) };

    if (updates.academicYear) {
      const preset = updates.academicYear.preset;
      const startMonth = updates.academicYear.startMonth;
      updates.academicYear = resolveAcademicYear(preset, startMonth);
    }

    if (updates.examTypes?.monthly?.months) {
      const normalized = normalizeMonths(updates.examTypes.monthly.months);
      updates.examTypes.monthly.months = normalized;
    }

    updates.updatedBy = req.user.id;

    const config = await ExamConfig.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!config) return res.status(404).json({ error: 'Not found' });

    if (req.body?.applyToAllClasses) {
      const allClasses = await SchoolClass.find({}).select('name').lean();
      const { className: sourceClassName } = config;

      for (const c of allClasses) {
        const targetName = String(c?.name || '').trim();
        if (!targetName) continue;
        if (targetName === sourceClassName) continue;

        // eslint-disable-next-line no-await-in-loop
        await ExamConfig.findOneAndUpdate(
          { className: targetName },
          {
            className: targetName,
            academicYear: config.academicYear,
            examTypes: config.examTypes,
            structure: config.structure,
            visibility: config.visibility,
            updatedBy: req.user.id,
            createdBy: req.user.id
          },
          { upsert: true, new: false }
        );
      }
    }

    res.json({ config });
  } catch (err) {
    next(err);
  }
}

async function getExam(req, res, next) {
  try {
    const exam = await Exam.findById(req.params.id)
      .populate('subjects.subject', 'name className')
      .lean();

    if (!exam || exam.isArchived) return res.status(404).json({ error: 'Not found' });

    if (isPublishedOnlyViewer(req.user) && exam.status !== 'published') {
      return res.status(404).json({ error: 'Not found' });
    }

    const allowedClasses = await resolveAllowedClassesForUser(req.user);
    if (Array.isArray(allowedClasses) && !allowedClasses.includes(String(exam.className || '').trim())) {
      return res.status(404).json({ error: 'Not found' });
    }

    res.json({ exam });
  } catch (err) {
    next(err);
  }
}

async function getTeacherAssignments(req, res, next) {
  try {
    const year = req.query?.year ? Number(req.query.year) : new Date().getFullYear();
    const timetables = await Timetable.find({ year, isActive: true, 'slots.teacher': req.user.id })
      .populate('slots.subject', 'name className')
      .lean();

    const seen = new Set();
    const assignments = [];

    for (const tt of timetables) {
      const className = String(tt?.class || '').trim();
      const section = String(tt?.section || '').trim();
      if (!className) continue;

      for (const slot of tt?.slots || []) {
        if (!slot?.teacher || !slot?.subject) continue;
        if (String(slot.teacher) !== String(req.user.id)) continue;
        const subj = slot.subject;
        if (!subj?._id) continue;
        const key = `${className}|${section}|${String(subj._id)}`;
        if (seen.has(key)) continue;
        seen.add(key);
        assignments.push({
          className,
          section,
          subject: { _id: subj._id, name: subj.name }
        });
      }
    }

    assignments.sort((a, b) => {
      if (a.className !== b.className) return a.className.localeCompare(b.className);
      if (a.section !== b.section) return a.section.localeCompare(b.section);
      return String(a?.subject?.name || '').localeCompare(String(b?.subject?.name || ''));
    });

    res.json({ year, assignments });
  } catch (err) {
    next(err);
  }
}

async function getMarksSheet(req, res, next) {
  try {
    const subjectId = String(req.query?.subjectId || '').trim();
    const section = req.query?.section ? String(req.query.section).trim() : '';
    if (!subjectId) return res.status(400).json({ error: 'subjectId is required' });

    const exam = await Exam.findById(req.params.id).lean();
    if (!exam || exam.isArchived) return res.status(404).json({ error: 'Exam not found' });

    const subject = await Subject.findById(subjectId).select('name className').lean();
    if (!subject) return res.status(404).json({ error: 'Subject not found' });
    if (String(subject.className || '').trim() !== String(exam.className || '').trim()) {
      return res.status(400).json({ error: 'Subject does not belong to this class' });
    }

    if (isTeacher(req.user)) {
      const perm = await teacherHasAssignment({ teacherId: req.user.id, exam, subjectId, section });
      if (!perm.ok) return res.status(403).json({ error: perm.error || 'Forbidden' });
    }

    const studentsFilter = { class: String(exam.className).trim(), status: 'active' };
    if (section) studentsFilter.section = section;
    const students = await Student.find(studentsFilter).sort({ firstName: 1, lastName: 1, studentId: 1 }).lean();

    const studentIds = students.map((s) => s._id);
    const marks = await ExamMark.find({ exam: exam._id, subject: subjectId, student: { $in: studentIds } }).lean();
    const marksByStudent = new Map(marks.map((m) => [String(m.student), m]));

    const cfg = (exam.subjects || []).find((s) => String(s?.subject) === subjectId);
    const constraints = cfg
      ? {
          maxMarks: typeof cfg.maxMarks === 'number' ? cfg.maxMarks : undefined,
          passingMarks: typeof cfg.passingMarks === 'number' ? cfg.passingMarks : undefined,
          theoryMax: typeof cfg.theoryMax === 'number' ? cfg.theoryMax : undefined,
          practicalMax: typeof cfg.practicalMax === 'number' ? cfg.practicalMax : undefined
        }
      : {};

    const canEdit = isAdminOrPrincipal(req.user)
      ? exam.status !== 'published' && exam.status !== 'approved'
      : isTeacher(req.user)
        ? canTeacherEditMarks(exam)
        : false;

    const rows = students.map((st) => {
      const existing = marksByStudent.get(String(st._id));
      return {
        student: {
          _id: st._id,
          studentId: st.studentId,
          firstName: st.firstName,
          lastName: st.lastName,
          class: st.class,
          section: st.section
        },
        marks: existing
          ? {
              marks: existing.marks,
              theoryMarks: existing.theoryMarks,
              practicalMarks: existing.practicalMarks
            }
          : {}
      };
    });

    res.json({
      exam: {
        _id: exam._id,
        name: exam.name,
        className: exam.className,
        type: exam.type,
        year: exam.year,
        month: exam.month,
        status: exam.status,
        marksEntry: exam.marksEntry
      },
      subject: { _id: subject._id, name: subject.name },
      constraints,
      canEdit,
      rows
    });
  } catch (err) {
    next(err);
  }
}

function parseMaybeNumber(value) {
  if (value === null || value === undefined) return undefined;
  if (value === '') return undefined;
  const n = Number(value);
  if (!Number.isFinite(n)) return undefined;
  return n;
}

async function upsertMarks(req, res, next) {
  try {
    const subjectId = String(req.query?.subjectId || '').trim();
    const section = req.query?.section ? String(req.query.section).trim() : '';
    if (!subjectId) return res.status(400).json({ error: 'subjectId is required' });

    const exam = await Exam.findById(req.params.id).lean();
    if (!exam || exam.isArchived) return res.status(404).json({ error: 'Exam not found' });
    if (exam.status === 'published') return res.status(409).json({ error: 'Marks are frozen for published exams' });
    if (exam.status === 'approved') return res.status(409).json({ error: 'Marks are locked for approved exams. Reopen the exam to make changes.' });

    const subject = await Subject.findById(subjectId).select('name className').lean();
    if (!subject) return res.status(404).json({ error: 'Subject not found' });
    if (String(subject.className || '').trim() !== String(exam.className || '').trim()) {
      return res.status(400).json({ error: 'Subject does not belong to this class' });
    }

    const bodyRows = Array.isArray(req.body?.rows) ? req.body.rows : [];
    if (!bodyRows.length) return res.json({ ok: true, updated: 0 });

    if (isTeacher(req.user)) {
      const perm = await teacherHasAssignment({ teacherId: req.user.id, exam, subjectId, section });
      if (!perm.ok) return res.status(403).json({ error: perm.error || 'Forbidden' });
      if (!canTeacherEditMarks(exam)) return res.status(409).json({ error: 'Marks entry window is closed or exam is locked' });
    }

    if (!isTeacher(req.user) && !isAdminOrPrincipal(req.user)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const cfg = (exam.subjects || []).find((s) => String(s?.subject) === subjectId);
    const maxMarks = cfg && typeof cfg.maxMarks === 'number' ? cfg.maxMarks : null;
    const theoryMax = cfg && typeof cfg.theoryMax === 'number' ? cfg.theoryMax : null;
    const practicalMax = cfg && typeof cfg.practicalMax === 'number' ? cfg.practicalMax : null;

    const studentIds = bodyRows.map((r) => String(r?.student || '').trim()).filter(Boolean);
    const uniqueStudentIds = [...new Set(studentIds)];
    const studentsFilter = { _id: { $in: uniqueStudentIds }, class: String(exam.className).trim(), status: 'active' };
    if (section) studentsFilter.section = section;
    const existingStudents = await Student.find(studentsFilter).select('_id').lean();
    const existingSet = new Set(existingStudents.map((s) => String(s._id)));

    for (const id of uniqueStudentIds) {
      if (!existingSet.has(String(id))) {
        return res.status(400).json({ error: 'One or more students are not in this class/section' });
      }
    }

    const ops = [];

    for (const row of bodyRows) {
      const student = String(row?.student || '').trim();
      if (!student) continue;
      if (!existingSet.has(student)) continue;

      const marks = parseMaybeNumber(row?.marks);
      const theoryMarks = parseMaybeNumber(row?.theoryMarks);
      const practicalMarks = parseMaybeNumber(row?.practicalMarks);

      if (maxMarks !== null && typeof marks === 'number' && marks > maxMarks) {
        return res.status(400).json({ error: `Marks cannot exceed maxMarks (${maxMarks})` });
      }
      if (theoryMax !== null && typeof theoryMarks === 'number' && theoryMarks > theoryMax) {
        return res.status(400).json({ error: `Theory marks cannot exceed theoryMax (${theoryMax})` });
      }
      if (practicalMax !== null && typeof practicalMarks === 'number' && practicalMarks > practicalMax) {
        return res.status(400).json({ error: `Practical marks cannot exceed practicalMax (${practicalMax})` });
      }

      const hasAny = typeof marks === 'number' || typeof theoryMarks === 'number' || typeof practicalMarks === 'number';
      if (!hasAny) {
        ops.push({
          deleteOne: {
            filter: { exam: exam._id, student, subject: subjectId }
          }
        });
        continue;
      }

      const update = {
        updatedBy: req.user.id,
        ...(typeof marks === 'number' ? { marks } : {}),
        ...(typeof theoryMarks === 'number' ? { theoryMarks } : {}),
        ...(typeof practicalMarks === 'number' ? { practicalMarks } : {})
      };

      ops.push({
        updateOne: {
          filter: { exam: exam._id, student, subject: subjectId },
          update: {
            $set: update,
            $setOnInsert: { createdBy: req.user.id }
          },
          upsert: true
        }
      });
    }

    if (!ops.length) return res.json({ ok: true, updated: 0 });
    await ExamMark.bulkWrite(ops, { ordered: true });

    res.json({ ok: true, updated: ops.length });
  } catch (err) {
    next(err);
  }
}

async function openExam(req, res, next) {
  try {
    const existing = await Exam.findById(req.params.id).select('status isArchived').lean();
    if (!existing) return res.status(404).json({ error: 'Not found' });
    if (existing.isArchived) return res.status(409).json({ error: 'Archived exams cannot be opened' });
    if (existing.status === 'published') return res.status(409).json({ error: 'Cannot reopen a published exam' });

    const exam = await Exam.findByIdAndUpdate(
      req.params.id,
      {
        status: 'open',
        'marksEntry.locked': false,
        submittedBy: null,
        submittedAt: null,
        approvedBy: null,
        approvedAt: null,
        updatedBy: req.user.id
      },
      { new: true }
    );
    res.json({ exam });
  } catch (err) {
    next(err);
  }
}

async function lockExam(req, res, next) {
  try {
    const existing = await Exam.findById(req.params.id).select('status isArchived').lean();
    if (!existing) return res.status(404).json({ error: 'Not found' });
    if (existing.isArchived) return res.status(409).json({ error: 'Archived exams cannot be locked' });
    if (existing.status === 'published') return res.status(409).json({ error: 'Cannot lock a published exam' });
    if (existing.status !== 'open') return res.status(409).json({ error: 'Only open exams can be locked' });

    const exam = await Exam.findByIdAndUpdate(
      req.params.id,
      { status: 'locked', 'marksEntry.locked': true, updatedBy: req.user.id },
      { new: true }
    );
    res.json({ exam });
  } catch (err) {
    next(err);
  }
}

async function approveExam(req, res, next) {
  try {
    const existing = await Exam.findById(req.params.id).select('status isArchived').lean();
    if (!existing) return res.status(404).json({ error: 'Not found' });
    if (existing.isArchived) return res.status(409).json({ error: 'Archived exams cannot be approved' });
    if (existing.status === 'published') return res.status(409).json({ error: 'Cannot approve a published exam' });
    if (existing.status !== 'submitted') return res.status(409).json({ error: 'Only submitted exams can be approved' });

    const exam = await Exam.findByIdAndUpdate(
      req.params.id,
      { status: 'approved', 'marksEntry.locked': true, approvedBy: req.user.id, approvedAt: new Date(), updatedBy: req.user.id },
      { new: true }
    );
    res.json({ exam });
  } catch (err) {
    next(err);
  }
}

async function publishExam(req, res, next) {
  try {
    const existing = await Exam.findById(req.params.id).select('status isArchived').lean();
    if (!existing) return res.status(404).json({ error: 'Not found' });
    if (existing.isArchived) return res.status(409).json({ error: 'Archived exams cannot be published' });
    if (existing.status === 'published') {
      const exam = await Exam.findById(req.params.id).lean();
      return res.json({ exam });
    }
    if (existing.status !== 'approved') return res.status(409).json({ error: 'Only approved exams can be published' });

    const exam = await Exam.findByIdAndUpdate(
      req.params.id,
      { status: 'published', 'marksEntry.locked': true, publishedBy: req.user.id, publishedAt: new Date(), updatedBy: req.user.id },
      { new: true }
    );
    res.json({ exam });
  } catch (err) {
    next(err);
  }
}

async function submitExam(req, res, next) {
  try {
    const exam = await Exam.findById(req.params.id).lean();
    if (!exam) return res.status(404).json({ error: 'Not found' });
    if (exam.isArchived) return res.status(409).json({ error: 'Archived exams cannot be submitted' });
    if (exam.status === 'published') return res.status(409).json({ error: 'Cannot submit a published exam' });
    if (exam.status !== 'open') return res.status(409).json({ error: 'Exam must be open to submit' });
    if (exam?.marksEntry?.locked) return res.status(409).json({ error: 'Exam is locked' });

    if (!isTeacher(req.user)) return res.status(403).json({ error: 'Forbidden' });
    const perm = await teacherHasAnyAssignment({ teacherId: req.user.id, exam });
    if (!perm.ok) return res.status(403).json({ error: perm.error || 'Forbidden' });

    const updated = await Exam.findByIdAndUpdate(
      req.params.id,
      {
        status: 'submitted',
        'marksEntry.locked': true,
        submittedBy: req.user.id,
        submittedAt: new Date(),
        updatedBy: req.user.id
      },
      { new: true }
    );

    res.json({ exam: updated });
  } catch (err) {
    next(err);
  }
}

async function createExam(req, res, next) {
  try {
    const payload = { ...(req.body || {}) };
    const result = await createOrReuseExam({
      className: payload.className,
      type: payload.type,
      name: payload.name,
      year: payload.year,
      month: payload.month,
      instructions: payload.instructions,
      academicYear: payload.academicYear,
      subjects: payload.subjects,
      userId: req.user.id
    });

    if (result?.error) return res.status(400).json({ error: result.error });
    return res.status(result.reused ? 200 : 201).json(result);
  } catch (err) {
    next(err);
  }
}

async function createExamsForAllClasses(req, res, next) {
  try {
    const { type, year, month, name, instructions } = req.body || {};
    const classes = await SchoolClass.find({}).sort({ name: 1 }).select('name').lean();

    const results = [];
    for (const cls of classes) {
      const className = String(cls?.name || '').trim();
      if (!className) continue;

      // eslint-disable-next-line no-await-in-loop
      const result = await createOrReuseExam({
        className,
        type,
        year,
        month,
        name: String(name || '').trim() || defaultExamName(type, year, month),
        instructions,
        userId: req.user.id
      });

      if (result?.error) {
        results.push({ className, error: result.error });
      } else {
        results.push({
          className,
          examId: result?.exam?._id,
          status: result?.exam?.status,
          reused: !!result?.reused
        });
      }
    }

    const created = results.filter((r) => !r.error && !r.reused).length;
    const reused = results.filter((r) => !r.error && r.reused).length;
    const failed = results.filter((r) => !!r.error).length;

    res.status(201).json({
      summary: { totalClasses: results.length, created, reused, failed },
      results
    });
  } catch (err) {
    next(err);
  }
}

async function listExamSetupSummary(req, res, next) {
  try {
    const type = String(req.query?.type || '').trim();
    const year = Number(req.query?.year);
    const month = req.query?.month ? Number(req.query.month) : undefined;

    const classes = await SchoolClass.find({}).sort({ name: 1 }).select('name').lean();
    const examFilter = {
      type,
      year,
      isArchived: false,
      ...(type === 'monthly' ? { month } : {})
    };

    const exams = await Exam.find(examFilter)
      .select('_id className status updatedAt')
      .sort({ updatedAt: -1, createdAt: -1 })
      .lean();

    const examByClass = new Map();
    for (const ex of exams) {
      const className = String(ex?.className || '').trim();
      if (!className || examByClass.has(className)) continue;
      examByClass.set(className, ex);
    }

    const rows = classes.map((cls) => {
      const className = String(cls?.name || '').trim();
      const exam = examByClass.get(className);
      if (!exam) {
        return { className, state: 'pending', exam: null };
      }
      return {
        className,
        state: String(exam.status || 'draft'),
        exam: { _id: exam._id, status: exam.status, updatedAt: exam.updatedAt }
      };
    });

    res.json({
      type,
      year,
      ...(type === 'monthly' ? { month } : {}),
      summary: {
        totalClasses: rows.length,
        pending: rows.filter((r) => r.state === 'pending').length,
        created: rows.filter((r) => r.state !== 'pending').length
      },
      rows
    });
  } catch (err) {
    next(err);
  }
}

async function listExams(req, res, next) {
  try {
    const { className, type, year, month, status, archived } = req.query;
    const filter = {};

    if (className) filter.className = String(className).trim();
    if (type) filter.type = String(type).trim();
    if (status) filter.status = String(status).trim();
    if (year) filter.year = Number(year);
    if (month) filter.month = Number(month);

    const archivedMode = String(archived || 'active').trim();
    if (isAdminOrPrincipal(req.user)) {
      if (archivedMode === 'archived') filter.isArchived = true;
      else if (archivedMode !== 'all') filter.isArchived = false;
    } else {
      filter.isArchived = false;
    }

    if (isPublishedOnlyViewer(req.user)) {
      filter.status = 'published';
    }

    const allowedClasses = await resolveAllowedClassesForUser(req.user);
    if (Array.isArray(allowedClasses)) {
      if (allowedClasses.length === 0) return res.json({ exams: [] });

      if (filter.className && !allowedClasses.includes(filter.className)) {
        return res.json({ exams: [] });
      }

      if (!filter.className) filter.className = { $in: allowedClasses };
    }

    const exams = await Exam.find(filter).sort({ year: -1, month: -1, createdAt: -1 }).lean();
    res.json({ exams });
  } catch (err) {
    next(err);
  }
}

async function updateExam(req, res, next) {
  try {
    const existing = await Exam.findById(req.params.id).select('status isArchived').lean();
    if (!existing) return res.status(404).json({ error: 'Not found' });
    if (existing.isArchived) return res.status(409).json({ error: 'Archived exams cannot be edited' });
    if (existing.status === 'published') return res.status(409).json({ error: 'Published exams cannot be edited' });

    const updates = { ...(req.body || {}) };
    if (updates.className) updates.className = String(updates.className).trim();
    if (updates.name) updates.name = String(updates.name).trim();
    if (updates.type) updates.type = String(updates.type).trim();
    if (typeof updates.year !== 'undefined') updates.year = Number(updates.year);
    if (typeof updates.month !== 'undefined' && updates.month !== null && updates.month !== '') updates.month = Number(updates.month);

    // Status and locking are controlled via workflow action endpoints, not generic PATCH.
    if (typeof updates.status !== 'undefined') delete updates.status;
    if (updates.marksEntry && typeof updates.marksEntry === 'object') {
      // allow only window edits here
      if (typeof updates.marksEntry.locked !== 'undefined') delete updates.marksEntry.locked;
      if (Object.keys(updates.marksEntry).length === 0) delete updates.marksEntry;
    }

    updates.updatedBy = req.user.id;

    const exam = await Exam.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!exam) return res.status(404).json({ error: 'Not found' });
    res.json({ exam });
  } catch (err) {
    next(err);
  }
}

async function archiveExam(req, res, next) {
  try {
    const exam = await Exam.findById(req.params.id).lean();
    if (!exam) return res.status(404).json({ error: 'Not found' });
    if (exam.isArchived) return res.json({ exam });

    const updated = await Exam.findByIdAndUpdate(
      req.params.id,
      {
        isArchived: true,
        archivedAt: new Date(),
        archivedBy: req.user.id,
        updatedBy: req.user.id
      },
      { new: true }
    ).lean();

    res.json({ exam: updated });
  } catch (err) {
    next(err);
  }
}

async function hardDeleteExam(req, res, next) {
  try {
    const exam = await Exam.findById(req.params.id).select('_id isArchived').lean();
    if (!exam) return res.status(404).json({ error: 'Not found' });
    if (!exam.isArchived) return res.status(409).json({ error: 'Only archived exams can be permanently deleted' });

    // Cascade delete: marksheets and exam marks
    await Marksheet.deleteMany({ exam: exam._id });
    await ExamMark.deleteMany({ exam: exam._id });
    await Exam.deleteOne({ _id: exam._id });

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listExamConfigs,
  ensureConfigs,
  getExamConfig,
  updateExamConfig,
  listExamSetupSummary,
  createExamsForAllClasses,
  createExam,
  listExams,
  updateExam,
  archiveExam,
  hardDeleteExam,
  getExam,
  getTeacherAssignments,
  getMarksSheet,
  upsertMarks,
  openExam,
  lockExam,
  submitExam,
  approveExam,
  publishExam
};
