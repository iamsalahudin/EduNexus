const mongoose = require('mongoose');
const { SchoolClass, Student, Teacher, Timetable } = require('../models');

function parseBool(value) {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'boolean') return value;
  return String(value).toLowerCase() === 'true';
}

function normalizeId(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value._id) return String(value._id);
  return String(value);
}

function trimText(value) {
  return String(value || '').trim();
}

async function resolveLevelFromClassName(className) {
  const normalized = trimText(className);
  if (!normalized) return undefined;

  const schoolClass = await SchoolClass.findOne({ name: normalized }).select('level').lean();
  return trimText(schoolClass?.level) || undefined;
}

function hasSectionSpecificSlots(slots, className) {
  return (Array.isArray(slots) ? slots : []).some((slot) => trimText(slot?.class) === className && trimText(slot?.section));
}

function projectSlotsForClass(slots, className, section) {
  const all = (Array.isArray(slots) ? slots : []).filter((slot) => trimText(slot?.class) === className);
  if (!all.length) return { slots: [], usedSectionFilter: false };

  const normalizedSection = trimText(section);
  const sectionSpecific = hasSectionSpecificSlots(all, className);

  if (!sectionSpecific) {
    return {
      slots: all.filter((slot) => !trimText(slot?.section)),
      usedSectionFilter: false
    };
  }

  return {
    slots: all.filter((slot) => trimText(slot?.section) === normalizedSection),
    usedSectionFilter: true
  };
}

function filterSlotsByTeacher(slots, teacherIdentities) {
  const identitySet = teacherIdentities instanceof Set
    ? teacherIdentities
    : new Set([String(teacherIdentities || '').trim().toLowerCase()].filter(Boolean));

  return (Array.isArray(slots) ? slots : []).filter((slot) => {
    const candidates = [];
    const teacher = slot?.teacher;

    if (teacher && typeof teacher === 'object') {
      candidates.push(trimText(normalizeId(teacher)));
      candidates.push(trimText(teacher?.name));
      candidates.push(trimText(teacher?.username));
      candidates.push(trimText(teacher?.email));
    } else {
      candidates.push(trimText(teacher));
    }

    return candidates
      .filter(Boolean)
      .some((value) => identitySet.has(String(value).toLowerCase()));
  });
}

function mergeTeacherParallelSlots(slots) {
  const grouped = new Map();

  (Array.isArray(slots) ? slots : []).forEach((slot) => {
    const subjectId = trimText(normalizeId(slot?.subject));
    const room = trimText(slot?.room);
    const key = [
      trimText(slot?.day),
      trimText(slot?.startTime),
      trimText(slot?.endTime),
      trimText(slot?.class),
      subjectId,
      room
    ].join('|');

    const current = grouped.get(key) || [];
    current.push(slot);
    grouped.set(key, current);
  });

  const merged = [];
  grouped.forEach((rows) => {
    const base = { ...(rows[0] || {}) };
    const sections = [...new Set(rows.map((row) => trimText(row?.section)).filter(Boolean))].sort();

    if (sections.length > 1) {
      base.section = sections.join('+');
      base.mergedSections = sections;
    } else if (sections.length === 1) {
      base.section = sections[0];
    } else {
      base.section = '';
    }

    merged.push(base);
  });

  return merged;
}

function buildTeacherParallelConflicts(slots) {
  const byPeriodAndTeacher = new Map();

  (Array.isArray(slots) ? slots : []).forEach((slot) => {
    const teacherId = trimText(normalizeId(slot?.teacher));
    if (!teacherId) return;

    const day = trimText(slot?.day);
    const startTime = trimText(slot?.startTime);
    const endTime = trimText(slot?.endTime);
    const className = trimText(slot?.class);
    const section = trimText(slot?.section);

    const key = [day, startTime, endTime, teacherId].join('|');
    const rows = byPeriodAndTeacher.get(key) || [];
    rows.push({ day, startTime, endTime, className, section });
    byPeriodAndTeacher.set(key, rows);
  });

  const conflicts = [];

  byPeriodAndTeacher.forEach((rows, key) => {
    if (rows.length <= 1) return;

    const classNames = [...new Set(rows.map((row) => row.className).filter(Boolean))];
    if (classNames.length <= 1) return;

    conflicts.push({
      key,
      day: rows[0].day,
      startTime: rows[0].startTime,
      endTime: rows[0].endTime,
      classes: classNames
    });
  });

  return conflicts;
}

function validateTeacherParallelAssignments(slots) {
  const conflicts = buildTeacherParallelConflicts(slots);
  if (!conflicts.length) return;

  const formatted = conflicts
    .map((c) => `${c.day} ${c.startTime}-${c.endTime}: ${c.classes.join(', ')}`)
    .join('; ');

  const err = new Error(`Teacher cannot be assigned in parallel across different classes. Conflicts: ${formatted}`);
  err.status = 400;
  throw err;
}

async function applyRoleFilter(req, filter = {}) {
  const scopedFilter = { ...filter };
  const role = trimText(req.user?.role);

  if (role === 'Admin' || role === 'Principal' || role === 'Reception') {
    if (req.query.teacher) scopedFilter['slots.teacher'] = trimText(req.query.teacher);
    if (req.query.class) scopedFilter['slots.class'] = trimText(req.query.class);
    if (req.query.section) scopedFilter['slots.section'] = trimText(req.query.section);
    return scopedFilter;
  }

  if (role === 'Teacher') {
    scopedFilter['slots.teacher'] = normalizeId(req.user.id);
    return scopedFilter;
  }

  if (role === 'Student') {
    const student = await Student.findOne({ user: req.user.id }).select('class').lean();
    if (!student) {
      scopedFilter._id = null;
      return scopedFilter;
    }

    const className = trimText(student.class);
    const level = await resolveLevelFromClassName(className);
    if (level) scopedFilter.level = scopedFilter.level || level;
    scopedFilter['slots.class'] = className;
    return scopedFilter;
  }

  if (role === 'Parent') {
    const linkedStudents = await Student.find({ parents: req.user.id }).select('class').lean();
    const classes = [...new Set(linkedStudents.map((row) => trimText(row.class)).filter(Boolean))];
    if (classes.length === 0) {
      scopedFilter._id = null;
      return scopedFilter;
    }

    const requestedClass = trimText(req.query.class);
    if (requestedClass) {
      if (!classes.includes(requestedClass)) {
        scopedFilter._id = null;
        return scopedFilter;
      }
      scopedFilter['slots.class'] = requestedClass;
    } else {
      scopedFilter['slots.class'] = { $in: classes };
    }

    const allowedLevels = await Promise.all(classes.map((cls) => resolveLevelFromClassName(cls)));
    const levels = [...new Set(allowedLevels.filter(Boolean))];
    if (!scopedFilter.level && levels.length === 1) {
      scopedFilter.level = levels[0];
    }

    return scopedFilter;
  }

  scopedFilter._id = null;
  return scopedFilter;
}

function buildQueryFilter(query = {}) {
  const filter = {};
  if (query.level) filter.level = trimText(query.level);
  if (query.year) filter.year = parseInt(query.year, 10);
  if (query.status) filter.status = trimText(query.status);
  const isActive = parseBool(query.isActive);
  if (isActive !== undefined) filter.isActive = isActive;
  return filter;
}

const TIMETABLE_POPULATE_PATHS = [
  { path: 'slots.subject', select: 'name code' },
  { path: 'slots.teacher', select: 'name email' },
  { path: 'createdBy', select: 'name email' },
  { path: 'updatedBy', select: 'name email' }
];

async function populateTimetable(target) {
  if (!target) return target;
  return Timetable.populate(target, TIMETABLE_POPULATE_PATHS);
}

function buildNoTimetableMeta(scope, message) {
  return {
    status: 'no-timetable',
    scope,
    message
  };
}

async function getTeacherPersonalTimetables(req, baseFilter) {
  const teacherId = normalizeId(req.user.id);
  const teacherProfile = await Teacher.findOne({ user: req.user.id }).select('_id').lean();
  const teacherProfileId = normalizeId(teacherProfile?._id);

  const identityValues = [
    teacherId,
    teacherProfileId,
    trimText(req.user?.name),
    trimText(req.user?.username),
    trimText(req.user?.email)
  ].filter(Boolean);

  const teacherIdentitySet = new Set(identityValues.map((value) => String(value).toLowerCase()));

  const teacherObjectIds = [teacherId, teacherProfileId]
    .filter((value) => mongoose.Types.ObjectId.isValid(value))
    .map((value) => new mongoose.Types.ObjectId(value));

  // Teacher personal view should show assigned timetables even when legacy rows
  // have inconsistent status/isActive values.
  const teacherFilter = { ...baseFilter };
  delete teacherFilter.status;
  delete teacherFilter.isActive;

  const rows = await Timetable.find({
    ...teacherFilter,
    'slots.teacher': {
      $in: teacherObjectIds
    }
  }).sort({ year: -1, level: 1, updatedAt: -1 });
  await populateTimetable(rows);

  const timetables = rows
    .map((row) => {
      const filtered = filterSlotsByTeacher(row.slots, teacherIdentitySet);
      if (!filtered.length) return null;

      return {
        ...row.toObject(),
        slots: mergeTeacherParallelSlots(filtered)
      };
    })
    .filter((row) => row && row.slots.length);

  if (!timetables.length) {
    return {
      timetables: [],
      meta: buildNoTimetableMeta('teacher-personal', 'No timetable linked to your teaching assignments yet.')
    };
  }

  return { timetables };
}

async function getStudentClassTimetables(req, baseFilter) {
  const student = await Student.findOne({ user: req.user.id }).select('class section studentId').lean();
  if (!student) {
    return {
      timetables: [],
      scope: null,
      meta: buildNoTimetableMeta('student-class', 'No student profile found for your account.')
    };
  }

  const className = trimText(student.class);
  const section = trimText(student.section);
  const level = await resolveLevelFromClassName(className);

  const filter = { ...baseFilter, 'slots.class': className };
  if (level && !filter.level) filter.level = level;

  const rows = await Timetable.find(filter).sort({ year: -1, level: 1, updatedAt: -1 });
  await populateTimetable(rows);

  const timetables = rows
    .map((row) => {
      const projected = projectSlotsForClass(row.slots, className, section);
      if (!projected.slots.length) return null;
      return {
        ...row.toObject(),
        class: className,
        section: projected.usedSectionFilter ? section : '',
        slots: projected.slots
      };
    })
    .filter((row) => row && row.slots.length);

  if (!timetables.length) {
    return {
      timetables: [],
      scope: { class: className, section: section || '' },
      meta: buildNoTimetableMeta('student-class', 'No timetable till now for your class scope.')
    };
  }

  return {
    timetables,
    scope: { class: className, section: section || '' }
  };
}

async function getParentChildTimetables(req, baseFilter) {
  const linkedStudents = await Student.find({ parents: req.user.id })
    .select('_id user class section studentId')
    .populate('user', 'name')
    .lean();

  if (!linkedStudents.length) {
    return {
      children: [],
      selectedChildId: '',
      meta: buildNoTimetableMeta('parent-child', 'No linked children found for this account.')
    };
  }

  const requestedChildId = trimText(req.query.childId);
  const selectedChildren = requestedChildId
    ? linkedStudents.filter((child) => String(child._id) === requestedChildId)
    : linkedStudents;

  if (!selectedChildren.length) {
    return {
      children: [],
      selectedChildId: '',
      meta: buildNoTimetableMeta('parent-child', 'Selected child is not linked to this parent account.')
    };
  }

  const classNames = [...new Set(selectedChildren.map((child) => trimText(child.class)).filter(Boolean))];
  const levels = await Promise.all(classNames.map((cls) => resolveLevelFromClassName(cls)));
  const levelFilter = [...new Set(levels.filter(Boolean))];

  const filter = { ...baseFilter, 'slots.class': { $in: classNames } };
  if (!filter.level && levelFilter.length === 1) filter.level = levelFilter[0];

  const rows = await Timetable.find(filter).sort({ year: -1, level: 1, updatedAt: -1 });
  await populateTimetable(rows);

  const children = selectedChildren.map((child) => {
    const className = trimText(child.class);
    const section = trimText(child.section);

    const timetables = rows
      .map((row) => {
        const projected = projectSlotsForClass(row.slots, className, section);
        if (!projected.slots.length) return null;
        return {
          ...row.toObject(),
          class: className,
          section: projected.usedSectionFilter ? section : '',
          slots: projected.slots
        };
      })
      .filter((row) => row && row.slots.length);

    return {
      childId: String(child._id),
      studentId: trimText(child.studentId),
      name: trimText(child?.user?.name) || 'Student',
      class: className,
      section,
      timetables,
      status: timetables.length ? 'active' : 'no-timetable'
    };
  });

  return {
    children,
    selectedChildId: requestedChildId || String(children[0]?.childId || ''),
    meta: children.some((child) => child.timetables.length)
      ? undefined
      : buildNoTimetableMeta('parent-child', 'No timetable till now for linked children.')
  };
}

// Create timetable
async function createTimetable(req, res, next) {
  try {
    const { year, slots, level, class: cls, section, status } = req.body;
    if (!level || !year || !slots) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    if (cls !== undefined || section !== undefined) {
      return res.status(400).json({ error: 'class/section cannot be set at timetable root. Use slot-level fields.' });
    }

    validateTeacherParallelAssignments(slots);

    const normalizedLevel = trimText(level);
    const existingTimetable = await Timetable.findOne({ level: normalizedLevel, year });
    if (existingTimetable) {
      return res.status(409).json({ error: 'Timetable already exists for this level/year' });
    }

    const timetable = await Timetable.create({
      level: normalizedLevel,
      year,
      slots,
      status: trimText(status) || 'active',
      createdBy: req.user.id,
      updatedBy: req.user.id
    });

    await populateTimetable(timetable);

    res.status(201).json({ timetable });
  } catch (err) {
    next(err);
  }
}

// Get timetables
async function getTimetables(req, res, next) {
  try {
    const baseFilter = buildQueryFilter(req.query || {});
    const view = trimText(req.query?.view || '');
    const role = trimText(req.user?.role || '');

    if (view === 'teacher-personal') {
      if (role !== 'Teacher') return res.status(403).json({ error: 'Forbidden' });
      const payload = await getTeacherPersonalTimetables(req, baseFilter);
      return res.json(payload);
    }

    if (view === 'student-class') {
      if (role !== 'Student') return res.status(403).json({ error: 'Forbidden' });
      const payload = await getStudentClassTimetables(req, baseFilter);
      return res.json(payload);
    }

    if (view === 'parent-child') {
      if (role !== 'Parent') return res.status(403).json({ error: 'Forbidden' });
      const payload = await getParentChildTimetables(req, baseFilter);
      return res.json(payload);
    }

    const filter = await applyRoleFilter(req, baseFilter);

    const timetables = await Timetable.find(filter)
      .sort({ year: -1, level: 1, updatedAt: -1 });
    await populateTimetable(timetables);

    const byClass = {};
    timetables.forEach((row) => {
      (row?.slots || []).forEach((slot) => {
        const className = trimText(slot?.class);
        const sectionName = trimText(slot?.section);
        if (!className || !sectionName) return;
        if (!byClass[className]) byClass[className] = new Set();
        byClass[className].add(sectionName);
      });
    });

    const sectionAvailability = Object.fromEntries(
      Object.entries(byClass).map(([className, sections]) => [className, sections.size > 0])
    );

    res.json({
      timetables,
      meta: {
        sectionSelectionEnabledByClass: sectionAvailability
      }
    });
  } catch (err) {
    next(err);
  }
}

// Get single timetable
async function getTimetable(req, res, next) {
  try {
    const scoped = await applyRoleFilter(req, { _id: req.params.id });
    const timetable = await Timetable.findOne(scoped);

    if (!timetable) return res.status(404).json({ error: 'Not found' });

    await populateTimetable(timetable);
    res.json({ timetable });
  } catch (err) {
    next(err);
  }
}

// Update timetable
async function updateTimetable(req, res, next) {
  try {
    const { slots, isActive, year, level, class: cls, status } = req.body;
    const timetable = await Timetable.findById(req.params.id);

    if (!timetable) return res.status(404).json({ error: 'Not found' });

    if (cls !== undefined) {
      return res.status(400).json({ error: 'class cannot be updated at timetable root. Use slot-level class fields.' });
    }

    const nextLevel = level !== undefined ? trimText(level) : timetable.level;
    const nextYear = year !== undefined ? year : timetable.year;

    const duplicate = await Timetable.findOne({
      _id: { $ne: timetable._id },
      level: nextLevel,
      year: nextYear
    }).select('_id').lean();

    if (duplicate) {
      return res.status(409).json({ error: 'Timetable already exists for this level/year' });
    }

    if (slots !== undefined) {
      validateTeacherParallelAssignments(slots);
      timetable.slots = slots;
    }

    if (level !== undefined) {
      timetable.level = nextLevel;
    }

    if (year !== undefined) timetable.year = year;
    if (isActive !== undefined) timetable.isActive = isActive;
    if (status !== undefined) timetable.status = trimText(status);
    timetable.updatedBy = req.user.id;
    await timetable.save();

    await populateTimetable(timetable);

    res.json({ timetable });
  } catch (err) {
    next(err);
  }
}

// Delete timetable
async function deleteTimetable(req, res, next) {
  try {
    await Timetable.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { createTimetable, getTimetables, getTimetable, updateTimetable, deleteTimetable };
