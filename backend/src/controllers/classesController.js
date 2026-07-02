const { SchoolClass, LevelSetting, RoomSetting } = require('../models');
const { ensureDefaultSubjectsForClass } = require('./subjectsController');
const { ensureDefaultExamConfigForClass } = require('../services/examDefaults');

const DEFAULT_LEVELS = ['pre-primary', 'primary', 'middle', 'high'];
const DEFAULT_ROOMS = Array.from({ length: 12 }, (_, index) => `Room ${index + 1}`);

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

function normalizeLevels(levels) {
  if (!Array.isArray(levels)) return [];
  const seen = new Set();
  const out = [];
  for (const level of levels) {
    const normalized = String(level || '').trim().toLowerCase();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    out.push(normalized);
  }
  return out;
}

function normalizeRooms(rooms) {
  if (!Array.isArray(rooms)) return [];
  const seen = new Set();
  const out = [];
  for (const room of rooms) {
    const normalized = String(room || '').trim();
    const key = normalized.toLowerCase();
    if (!normalized || seen.has(key)) continue;
    seen.add(key);
    out.push(normalized);
  }
  return out;
}

async function getOrCreateLevelSettings() {
  let settings = await LevelSetting.findOne({ key: 'default' });
  if (!settings) {
    settings = await LevelSetting.create({ key: 'default', levels: DEFAULT_LEVELS });
  }
  if (!Array.isArray(settings.levels) || settings.levels.length === 0) {
    settings.levels = DEFAULT_LEVELS;
    await settings.save();
  }
  return settings;
}

async function getOrCreateRoomSettings() {
  let settings = await RoomSetting.findOne({ key: 'default' });
  if (!settings) {
    settings = await RoomSetting.create({ key: 'default', rooms: DEFAULT_ROOMS });
  }

  if (!Array.isArray(settings.rooms) || settings.rooms.length === 0) {
    settings.rooms = DEFAULT_ROOMS;
    await settings.save();
  }

  return settings;
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
    const { name, sections, active, level, tutionFee, admissionFee, registrationFee, stationeryFee, annualFee } = req.body;

    const payload = {
      name: String(name).trim(),
      active: typeof active === 'boolean' ? active : true,
      level: level ? String(level).trim() : undefined,
      tutionFee: tutionFee !== undefined && tutionFee !== '' ? Number(tutionFee) : 0,
      admissionFee: admissionFee !== undefined && admissionFee !== '' ? Number(admissionFee) : 0,
      registrationFee: registrationFee !== undefined && registrationFee !== '' ? Number(registrationFee) : 0,
      stationeryFee: stationeryFee !== undefined && stationeryFee !== '' ? Number(stationeryFee) : 0,
      annualFee: annualFee !== undefined && annualFee !== '' ? Number(annualFee) : 0
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

    // Best-effort: create default exam structure for this class
    try {
      await ensureDefaultExamConfigForClass(created.name, req.user?.id);
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
    if (typeof updates.tutionFee !== 'undefined') updates.tutionFee = updates.tutionFee !== '' ? Number(updates.tutionFee) : 0;
    if (typeof updates.admissionFee !== 'undefined') updates.admissionFee = updates.admissionFee !== '' ? Number(updates.admissionFee) : 0;
    if (typeof updates.registrationFee !== 'undefined') updates.registrationFee = updates.registrationFee !== '' ? Number(updates.registrationFee) : 0;
    if (typeof updates.stationeryFee !== 'undefined') updates.stationeryFee = updates.stationeryFee !== '' ? Number(updates.stationeryFee) : 0;
    if (typeof updates.annualFee !== 'undefined') updates.annualFee = updates.annualFee !== '' ? Number(updates.annualFee) : 0;
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

async function listLevels(req, res, next) {
  try {
    const settings = await getOrCreateLevelSettings();
    res.json({ levels: settings.levels || DEFAULT_LEVELS });
  } catch (err) {
    next(err);
  }
}

async function updateLevels(req, res, next) {
  try {
    const incoming = normalizeLevels(req.body?.levels);
    if (incoming.length === 0) {
      return res.status(400).json({ error: 'At least one level is required' });
    }

    const settings = await getOrCreateLevelSettings();
    settings.levels = incoming;
    await settings.save();

    res.json({ levels: settings.levels });
  } catch (err) {
    next(err);
  }
}

async function listRooms(req, res, next) {
  try {
    const settings = await getOrCreateRoomSettings();
    res.json({ rooms: settings.rooms || DEFAULT_ROOMS });
  } catch (err) {
    next(err);
  }
}

async function updateRooms(req, res, next) {
  try {
    const incoming = normalizeRooms(req.body?.rooms);
    if (incoming.length === 0) {
      return res.status(400).json({ error: 'At least one room is required' });
    }

    const settings = await getOrCreateRoomSettings();
    settings.rooms = incoming;
    await settings.save();

    res.json({ rooms: settings.rooms });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listClasses,
  createClass,
  updateClass,
  deleteClass,
  listLevels,
  updateLevels,
  listRooms,
  updateRooms
};
