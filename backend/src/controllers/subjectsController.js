const mongoose = require('mongoose');
const { Subject, SchoolClass } = require('../models');

const DEFAULT_SUBJECTS = [
  'English',
  'Urdu',
  'Mathematics',
  'Science',
  'Islamiyat',
  'Computer',
  'Pakistan Studies'
];

function normalizeKey(value) {
  return String(value || '').trim().toLowerCase();
}

async function ensureDefaultSubjectsForClass(className) {
  const name = String(className || '').trim();
  if (!name) return { created: 0, skipped: 0 };

  const classKey = normalizeKey(name);

  const ops = DEFAULT_SUBJECTS.map((subjectName, idx) => {
    const nameKey = normalizeKey(subjectName);
    const code = `${classKey}:${nameKey}`;
    return {
      updateOne: {
        filter: { classKey, nameKey },
        update: {
          $setOnInsert: {
            className: name,
            classKey,
            name: subjectName,
            nameKey,
            code,
            active: true,
            order: idx
          }
        },
        upsert: true
      }
    };
  });

  const result = await Subject.bulkWrite(ops, { ordered: false });
  const created = result?.upsertedCount || 0;
  return { created, skipped: DEFAULT_SUBJECTS.length - created };
}

async function listSubjects(req, res, next) {
  try {
    const { className, active } = req.query;
    const filter = {};

    if (typeof active !== 'undefined') {
      filter.active = String(active) === 'true';
    }

    if (className) {
      filter.classKey = normalizeKey(className);
    }

    const subjects = await Subject.find(filter)
      .select('className name active order')
      .sort({ classKey: 1, order: 1, nameKey: 1 })
      .lean();

    res.json({ subjects, defaults: DEFAULT_SUBJECTS });
  } catch (err) {
    next(err);
  }
}

async function createSubject(req, res, next) {
  try {
    const { className, name, active } = req.body;
    const cls = String(className || '').trim();
    const subjectName = String(name || '').trim();
    if (!cls || !subjectName) return res.status(400).json({ error: 'className and name are required' });

    // class must exist
    const classExists = await SchoolClass.findOne({ name: cls }).select('_id').lean();
    if (!classExists) return res.status(400).json({ error: 'Class not found' });

    const classKey = normalizeKey(cls);
    const nameKey = normalizeKey(subjectName);

    const dup = await Subject.findOne({ classKey, nameKey }).select('_id').lean();
    if (dup) return res.status(409).json({ error: 'Subject already exists for this class' });

    const last = await Subject.find({ classKey }).sort({ order: -1 }).limit(1).select('order').lean();
    const nextOrder = (last[0]?.order ?? -1) + 1;

    const created = await Subject.create({
      className: cls,
      name: subjectName,
      active: typeof active === 'boolean' ? active : true,
      order: nextOrder
    });

    res.status(201).json({ subject: created });
  } catch (err) {
    next(err);
  }
}

async function updateSubject(req, res, next) {
  try {
    const updates = { ...(req.body || {}) };
    if (typeof updates.name !== 'undefined') updates.name = String(updates.name || '').trim();

    const subject = await Subject.findById(req.params.id);
    if (!subject) return res.status(404).json({ error: 'Not found' });

    // If renaming, enforce uniqueness within class
    if (typeof updates.name === 'string' && updates.name) {
      const nameKey = normalizeKey(updates.name);
      const clash = await Subject.findOne({ classKey: subject.classKey, nameKey, _id: { $ne: subject._id } }).select('_id').lean();
      if (clash) return res.status(409).json({ error: 'Subject name already exists for this class' });
      subject.name = updates.name;
    }

    if (typeof updates.active === 'boolean') subject.active = updates.active;

    await subject.save();
    res.json({ subject });
  } catch (err) {
    next(err);
  }
}

async function deleteSubject(req, res, next) {
  try {
    const deleted = await Subject.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

async function reorderSubjects(req, res, next) {
  try {
    const { className, orderedIds } = req.body;
    const cls = String(className || '').trim();
    if (!cls) return res.status(400).json({ error: 'className is required' });
    if (!Array.isArray(orderedIds)) return res.status(400).json({ error: 'orderedIds must be an array' });

    const classKey = normalizeKey(cls);

    const ids = orderedIds.map((id) => new mongoose.Types.ObjectId(String(id)));
    const subjects = await Subject.find({ classKey, _id: { $in: ids } }).select('_id').lean();

    if (subjects.length !== ids.length) {
      return res.status(400).json({ error: 'orderedIds contains invalid ids for this class' });
    }

    const bulk = ids.map((id, idx) => ({
      updateOne: {
        filter: { _id: id },
        update: { $set: { order: idx } }
      }
    }));

    if (bulk.length > 0) await Subject.bulkWrite(bulk);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

async function applyDefaultSubjects(req, res, next) {
  try {
    const { className } = req.body || {};
    const target = className ? [String(className).trim()] : null;

    const classes = target
      ? await SchoolClass.find({ name: { $in: target } }).select('name').lean()
      : await SchoolClass.find({}).select('name').lean();

    let created = 0;
    let skipped = 0;
    for (const c of classes) {
      const r = await ensureDefaultSubjectsForClass(c.name);
      created += r.created;
      skipped += r.skipped;
    }

    res.json({ ok: true, created, skipped, defaults: DEFAULT_SUBJECTS });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  DEFAULT_SUBJECTS,
  ensureDefaultSubjectsForClass,
  listSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
  reorderSubjects,
  applyDefaultSubjects
};
