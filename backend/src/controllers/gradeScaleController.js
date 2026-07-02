const { GradeScale } = require('../models');

function isAdminOrPrincipal(user) {
  return user?.role === 'Admin' || user?.role === 'Principal';
}

/**
 * GET /api/grade-scales
 * List all grade scales (school-wide and class-specific)
 */
async function listGradeScales(req, res, next) {
  try {
    const { className, active } = req.query;
    const filter = {};

    if (className) {
      filter.className = String(className).trim();
    }

    if (active !== undefined) {
      filter.active = active === 'true';
    }

    const scales = await GradeScale.find(filter)
      .sort({ className: 1 })
      .lean();

    res.json({ scales });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/grade-scales/:id
 * Get a specific grade scale
 */
async function getGradeScale(req, res, next) {
  try {
    const scale = await GradeScale.findById(req.params.id).lean();
    if (!scale) return res.status(404).json({ error: 'Grade scale not found' });
    res.json({ scale });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/grade-scales
 * Create a new grade scale
 * Body: {
 *   className: string (default 'SCHOOL' for school-wide),
 *   grades: [{ grade, minPercentage, maxPercentage, description, points }],
 *   passingPercentage: number,
 *   weights: { exam, attendance, homework, gr },
 *   allowExamLevelOverride: boolean
 * }
 */
async function createGradeScale(req, res, next) {
  try {
    if (!isAdminOrPrincipal(req.user)) {
      return res.status(403).json({ error: 'Only Admin/Principal can create grade scales' });
    }

    const {
      className = 'SCHOOL',
      grades,
      passingPercentage,
      weights,
      allowExamLevelOverride
    } = req.body;

    // Validate grades structure
    if (!Array.isArray(grades) || grades.length === 0) {
      return res.status(400).json({ error: 'At least one grade is required' });
    }

    // Validate grade percentage ranges don't overlap
    const sortedGrades = [...grades].sort((a, b) => a.minPercentage - b.minPercentage);
    for (let i = 0; i < sortedGrades.length - 1; i++) {
      if (sortedGrades[i].maxPercentage > sortedGrades[i + 1].minPercentage) {
        return res.status(400).json({ error: 'Grade ranges cannot overlap' });
      }
    }

    // Validate weights sum to 100 if provided
    if (weights) {
      const weightSum = (weights.exam || 0) + (weights.attendance || 0) + (weights.homework || 0) + (weights.gr || 0);
      if (weightSum > 0 && Math.abs(weightSum - 100) > 0.01) {
        return res.status(400).json({ error: 'Weights must sum to 100' });
      }
    }

    const payload = {
      className: String(className).trim() || 'SCHOOL',
      grades,
      passingPercentage: passingPercentage || 33,
      weights: weights || {
        exam: 40,
        attendance: 20,
        homework: 20,
        gr: 20
      },
      allowExamLevelOverride: allowExamLevelOverride !== false,
      active: true,
      createdBy: req.user.id,
      updatedBy: req.user.id
    };

    const scale = await GradeScale.create(payload);
    res.status(201).json({ scale });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: `Grade scale for ${err.keyValue?.className || 'this class'} already exists` });
    }
    next(err);
  }
}

/**
 * PATCH /api/grade-scales/:id
 * Update a grade scale
 */
async function updateGradeScale(req, res, next) {
  try {
    if (!isAdminOrPrincipal(req.user)) {
      return res.status(403).json({ error: 'Only Admin/Principal can update grade scales' });
    }

    const scale = await GradeScale.findById(req.params.id).lean();
    if (!scale) return res.status(404).json({ error: 'Grade scale not found' });

    const updates = { ...(req.body || {}) };

    // Validate grades if provided
    if (Array.isArray(updates.grades) && updates.grades.length === 0) {
      return res.status(400).json({ error: 'At least one grade is required' });
    }

    if (Array.isArray(updates.grades)) {
      const sortedGrades = [...updates.grades].sort((a, b) => a.minPercentage - b.minPercentage);
      for (let i = 0; i < sortedGrades.length - 1; i++) {
        if (sortedGrades[i].maxPercentage > sortedGrades[i + 1].minPercentage) {
          return res.status(400).json({ error: 'Grade ranges cannot overlap' });
        }
      }
    }

    // Validate weights if provided
    if (updates.weights) {
      const weightSum = (updates.weights.exam || 0) + (updates.weights.attendance || 0) + (updates.weights.homework || 0) + (updates.weights.gr || 0);
      if (weightSum > 0 && Math.abs(weightSum - 100) > 0.01) {
        return res.status(400).json({ error: 'Weights must sum to 100' });
      }
    }

    updates.updatedBy = req.user.id;

    const updated = await GradeScale.findByIdAndUpdate(req.params.id, updates, { new: true }).lean();
    res.json({ scale: updated });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/grade-scales/:id
 * Delete a grade scale (soft or hard delete based on business logic)
 */
async function deleteGradeScale(req, res, next) {
  try {
    if (!isAdminOrPrincipal(req.user)) {
      return res.status(403).json({ error: 'Only Admin/Principal can delete grade scales' });
    }

    const scale = await GradeScale.findById(req.params.id).lean();
    if (!scale) return res.status(404).json({ error: 'Grade scale not found' });

    // Soft delete: mark as inactive
    const updated = await GradeScale.findByIdAndUpdate(
      req.params.id,
      { active: false, updatedBy: req.user.id },
      { new: true }
    ).lean();

    res.json({ ok: true, scale: updated });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/grade-scales/resolve/for-class?className=10-A
 * Get effective grade scale for a class (class-specific or school-wide fallback)
 */
async function resolveGradeScaleForClass(req, res, next) {
  try {
    const { className } = req.query;
    if (!className) return res.status(400).json({ error: 'className required' });

    const classScale = await GradeScale.findOne({
      className: String(className).trim(),
      active: true
    }).lean();

    if (classScale) return res.json({ scale: classScale });

    // Fallback to school-wide
    const schoolScale = await GradeScale.findOne({
      className: 'SCHOOL',
      active: true
    }).lean();

    if (schoolScale) return res.json({ scale: schoolScale });

    res.status(404).json({ error: 'No active grade scale found' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listGradeScales,
  getGradeScale,
  createGradeScale,
  updateGradeScale,
  deleteGradeScale,
  resolveGradeScaleForClass
};
