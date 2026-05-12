const express = require('express')
const Joi = require('joi')
const { requireAuth, requireRole } = require('../middlewares/auth')
const validate = require('../middlewares/validate')
const departmentController = require('../controllers/departmentController')

const router = express.Router()

const departmentSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().trim().min(1).required(),
    description: Joi.string().allow('').optional(),
    active: Joi.boolean().optional()
  }).required()
})

router.use(requireAuth)
router.get('/', departmentController.listDepartments)
router.post('/', requireRole('Admin', 'Principal', 'HR'), validate(departmentSchema), departmentController.createDepartment)
router.patch('/:id', requireRole('Admin', 'Principal', 'HR'), validate(departmentSchema), departmentController.updateDepartment)
router.delete('/:id', requireRole('Admin', 'Principal', 'HR'), departmentController.deleteDepartment)

module.exports = router