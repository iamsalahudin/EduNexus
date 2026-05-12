const { Syllabus, SchoolClass, Subject } = require('../models');

function normalizeText(value) {
  return String(value || '').trim();
}

async function listSyllabus(req, res, next) {
  try {
    const { q, className, subjectName, status, term } = req.query;
    const filter = {};

    if (className) filter.className = normalizeText(className);
    if (subjectName) filter.subjectName = normalizeText(subjectName);
    if (status) filter.status = status;
    if (term) filter.term = term;

    const search = normalizeText(q);
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } },
        { className: { $regex: search, $options: 'i' } },
        { subjectName: { $regex: search, $options: 'i' } }
      ];
    }

    const syllabus = await Syllabus.find(filter).sort({ updatedAt: -1, createdAt: -1 }).lean();
    res.json({ syllabus });
  } catch (err) {
    next(err);
  }
}

async function createSyllabus(req, res, next) {
  try {
    const body = req.body || {};
    const className = normalizeText(body.className);
    const subjectName = normalizeText(body.subjectName);
    const title = normalizeText(body.title);

    if (!className || !subjectName || !title) {
      return res.status(400).json({ error: 'className, subjectName, and title are required' });
    }

    const classExists = await SchoolClass.findOne({ name: className }).select('_id').lean();
    if (!classExists) return res.status(400).json({ error: 'Class not found' });

    const subjectExists = await Subject.findOne({ className, name: subjectName }).select('_id').lean();
    if (!subjectExists) return res.status(400).json({ error: 'Subject not found for selected class' });

    const created = await Syllabus.create({
      className,
      subjectName,
      title,
      academicYear: normalizeText(body.academicYear),
      term: body.term || 'annual',
      chapters: Array.isArray(body.chapters) ? body.chapters.map(normalizeText).filter(Boolean) : [],
      status: body.status || 'draft',
      notes: normalizeText(body.notes),
      createdBy: req.user?.id,
      updatedBy: req.user?.id
    });

    res.status(201).json({ syllabus: created });
  } catch (err) {
    next(err);
  }
}

async function updateSyllabus(req, res, next) {
  try {
    const syllabus = await Syllabus.findById(req.params.id);
    if (!syllabus) return res.status(404).json({ error: 'Not found' });

    const updates = { ...(req.body || {}) };
    if (typeof updates.className !== 'undefined') updates.className = normalizeText(updates.className);
    if (typeof updates.subjectName !== 'undefined') updates.subjectName = normalizeText(updates.subjectName);
    if (typeof updates.title !== 'undefined') updates.title = normalizeText(updates.title);
    if (typeof updates.academicYear !== 'undefined') updates.academicYear = normalizeText(updates.academicYear);
    if (typeof updates.notes !== 'undefined') updates.notes = normalizeText(updates.notes);
    if (Array.isArray(updates.chapters)) updates.chapters = updates.chapters.map(normalizeText).filter(Boolean);
    if (typeof updates.status === 'undefined') delete updates.status;
    if (typeof updates.term === 'undefined') delete updates.term;

    if (updates.className || updates.subjectName) {
      const className = updates.className || syllabus.className;
      const subjectName = updates.subjectName || syllabus.subjectName;
      const classExists = await SchoolClass.findOne({ name: className }).select('_id').lean();
      if (!classExists) return res.status(400).json({ error: 'Class not found' });
      const subjectExists = await Subject.findOne({ className, name: subjectName }).select('_id').lean();
      if (!subjectExists) return res.status(400).json({ error: 'Subject not found for selected class' });
    }

    Object.assign(syllabus, updates, { updatedBy: req.user?.id });
    await syllabus.save();
    res.json({ syllabus });
  } catch (err) {
    next(err);
  }
}

async function deleteSyllabus(req, res, next) {
  try {
    const deleted = await Syllabus.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listSyllabus,
  createSyllabus,
  updateSyllabus,
  deleteSyllabus
};