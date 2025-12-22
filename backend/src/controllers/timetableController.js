const { Timetable, Subject } = require('../models');

// Create timetable
async function createTimetable(req, res, next) {
  try {
    const { class: cls, section, year, slots } = req.body;
    if (!cls || !year || !slots) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const existingTimetable = await Timetable.findOne({ class: cls, section, year });
    if (existingTimetable) {
      return res.status(409).json({ error: 'Timetable already exists for this class/year' });
    }

    const timetable = await Timetable.create({
      class: cls,
      section,
      year,
      slots,
      createdBy: req.user.id
    });

    await timetable.populate('slots.subject', 'name code');
    await timetable.populate('slots.teacher', 'name email');

    res.status(201).json({ timetable });
  } catch (err) {
    next(err);
  }
}

// Get timetables
async function getTimetables(req, res, next) {
  try {
    const { class: cls, section, year, isActive } = req.query;
    const filter = {};

    if (cls) filter.class = cls;
    if (section) filter.section = section;
    if (year) filter.year = parseInt(year, 10);
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const timetables = await Timetable.find(filter)
      .populate('slots.subject', 'name code')
      .populate('slots.teacher', 'name email')
      .populate('createdBy', 'name email')
      .sort({ year: -1 });

    res.json({ timetables });
  } catch (err) {
    next(err);
  }
}

// Get single timetable
async function getTimetable(req, res, next) {
  try {
    const timetable = await Timetable.findById(req.params.id)
      .populate('slots.subject', 'name code')
      .populate('slots.teacher', 'name email')
      .populate('createdBy', 'name email');

    if (!timetable) return res.status(404).json({ error: 'Not found' });
    res.json({ timetable });
  } catch (err) {
    next(err);
  }
}

// Update timetable
async function updateTimetable(req, res, next) {
  try {
    const { slots, isActive } = req.body;
    const timetable = await Timetable.findByIdAndUpdate(
      req.params.id,
      { slots, isActive },
      { new: true }
    )
      .populate('slots.subject', 'name code')
      .populate('slots.teacher', 'name email');

    if (!timetable) return res.status(404).json({ error: 'Not found' });
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
