const { SchoolClass } = require('../models');
const { ensureDefaultSubjectsForClass } = require('./subjectsController');

function normalizeSections(sections) {
  if (!Array.isArray(sections)) return sections;
  const cleaned = sections
    .map((s) => String(s || '').trim())
    .filter(Boolean);

  // de-duplicate (case-insensitive), keep first occurrence
  const seen = new Set();
  const out = [];
  for (const s of cleaned) {
    const key = s.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
  }
  return out;
}

async function listClasses(req, res, next) {
  try {
    const { q, active } = req.query;
    const filter = {};

    if (typeof active !== 'undefined') {
      filter.active = String(active) === 'true';
    }

    const s = String(q || '').trim();
    if (s) {
      filter.name = { $regex: s, $options: 'i' };
    }

    const classes = await SchoolClass.find(filter)
      .sort({ name: 1 })
      .lean();

    res.json({ classes });
  } catch (err) {
    next(err);
  }
}

async function createClass(req, res, next) {
  try {
    const { name, sections, active, level } = req.body;

    const payload = {
      name: String(name).trim(),
      active: typeof active === 'boolean' ? active : true,
      level: level ? String(level).trim() : undefined
    };

    // Default sections: Boys/Girls unless explicitly provided.
    // To create a class with no sections, pass sections: []
    if (Array.isArray(sections)) {
      payload.sections = normalizeSections(sections);
    } else {
      payload.sections = ['Boys', 'Girls'];
    }

    const exists = await SchoolClass.findOne({ name: payload.name }).select('_id');
    if (exists) return res.status(409).json({ error: 'Class already exists' });

    const created = await SchoolClass.create(payload);

    // Best-effort: create default subjects for this class
    try {
      await ensureDefaultSubjectsForClass(created.name);
    } catch (e) {
      // ignore
    }
    res.status(201).json({ schoolClass: created });
  } catch (err) {
    next(err);
  }
}

async function updateClass(req, res, next) {
  try {
    const updates = { ...(req.body || {}) };

    if (updates.name) updates.name = String(updates.name).trim();
    if (typeof updates.level !== 'undefined') updates.level = updates.level ? String(updates.level).trim() : undefined;
    if (Array.isArray(updates.sections)) updates.sections = normalizeSections(updates.sections);

    if (updates.name) {
      const clash = await SchoolClass.findOne({ name: updates.name, _id: { $ne: req.params.id } }).select('_id');
      if (clash) return res.status(409).json({ error: 'Class name already exists' });
    }

    const schoolClass = await SchoolClass.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!schoolClass) return res.status(404).json({ error: 'Not found' });
    res.json({ schoolClass });
  } catch (err) {
    next(err);
  }
}

async function deleteClass(req, res, next) {
  try {
    const deleted = await SchoolClass.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { listClasses, createClass, updateClass, deleteClass };
