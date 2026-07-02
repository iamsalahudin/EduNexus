const { Department } = require('../models')

async function listDepartments(req, res, next) {
  try {
    const includeInactive = String(req.query?.includeInactive || '').toLowerCase() === 'true'
    const filter = includeInactive ? {} : { active: true }
    const departments = await Department.find(filter)
      .sort({ name: 1 })
      .select('_id name description active createdAt updatedAt')
    return res.json({ departments })
  } catch (err) {
    next(err)
  }
}

async function createDepartment(req, res, next) {
  try {
    const name = String(req.body?.name || '').trim()
    const description = String(req.body?.description || '').trim()
    const active = req.body?.active !== undefined ? Boolean(req.body.active) : true

    if (!name) return res.status(400).json({ error: 'Department name is required' })

    const existing = await Department.findOne({ name: { $regex: `^${name}$`, $options: 'i' } })
    if (existing) return res.status(409).json({ error: 'Department already exists' })

    const department = await Department.create({
      name,
      description,
      active,
      createdBy: req.user?.id || null
    })

    return res.status(201).json({ department })
  } catch (err) {
    next(err)
  }
}

async function updateDepartment(req, res, next) {
  try {
    const department = await Department.findById(req.params.id)
    if (!department) return res.status(404).json({ error: 'Department not found' })

    if (req.body?.name !== undefined) {
      const name = String(req.body.name || '').trim()
      if (!name) return res.status(400).json({ error: 'Department name is required' })
      if (name.toLowerCase() !== department.name.toLowerCase()) {
        const existing = await Department.findOne({ _id: { $ne: department._id }, name: { $regex: `^${name}$`, $options: 'i' } })
        if (existing) return res.status(409).json({ error: 'Department already exists' })
      }
      department.name = name
    }

    if (req.body?.description !== undefined) {
      department.description = String(req.body.description || '').trim()
    }

    if (req.body?.active !== undefined) {
      department.active = Boolean(req.body.active)
    }

    await department.save()
    return res.json({ department })
  } catch (err) {
    next(err)
  }
}

async function deleteDepartment(req, res, next) {
  try {
    const deleted = await Department.findByIdAndDelete(req.params.id)
    if (!deleted) return res.status(404).json({ error: 'Department not found' })
    return res.json({ ok: true })
  } catch (err) {
    next(err)
  }
}

module.exports = {
  listDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment
}