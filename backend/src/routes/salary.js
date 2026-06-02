const express = require('express')
const router = express.Router()
const salaryController = require('../controllers/salaryController')
const { requireAuth, requireRole } = require('../middlewares/auth')
const validate = require('../middlewares/validate')
const {
  upsertSalaryStaffSchema,
  generateMonthlySalarySchema,
  updateSalaryStatusSchema,
  advanceSalarySchema,
  salaryReportSchema,
  upsertSalaryStructureSchema
} = require('../validators/salary')

router.use(requireAuth)

router.get('/summary', requireRole('Admin', 'Principal', 'HR', 'Reception', 'Accountant', 'Teacher'), salaryController.getSalarySummary)
router.get('/structures', requireRole('Admin', 'Principal', 'HR'), salaryController.listSalaryStructures)
router.post('/structures', requireRole('Admin', 'Principal', 'HR'), validate(upsertSalaryStructureSchema), salaryController.upsertSalaryStructure)
router.patch('/structures/:id', requireRole('Admin', 'Principal', 'HR'), validate(upsertSalaryStructureSchema), salaryController.upsertSalaryStructure)
router.get('/staff', requireRole('Admin', 'Principal', 'HR', 'Accountant'), salaryController.listSalaryStaff)
router.get('/staff/:id', requireRole('Admin', 'Principal', 'HR', 'Accountant'), salaryController.getSalaryStaff)
router.post('/staff', requireRole('Admin', 'Principal', 'HR'), validate(upsertSalaryStaffSchema), salaryController.upsertSalaryStaff)
router.patch('/staff/:id', requireRole('Admin', 'Principal', 'HR'), validate(upsertSalaryStaffSchema), salaryController.upsertSalaryStaff)
router.delete('/staff/:id', requireRole('Admin', 'Principal', 'HR'), salaryController.deleteSalaryStaff)
router.get('/records', requireRole('Admin', 'Principal', 'HR', 'Reception', 'Accountant', 'Teacher'), validate(salaryReportSchema), salaryController.listSalaryRecords)
router.post('/generate-monthly', requireRole('Admin', 'Principal', 'HR'), validate(generateMonthlySalarySchema), salaryController.generateMonthlySalary)
router.patch('/slips/:id/status', requireRole('Admin', 'Principal', 'HR', 'Reception'), validate(updateSalaryStatusSchema), salaryController.updateSalaryStatus)
router.post('/slips/:id/advance', requireRole('Admin', 'Principal', 'HR'), validate(advanceSalarySchema), salaryController.addAdvancePayment)
router.get('/slips/:id/pdf', requireRole('Admin', 'Principal', 'HR', 'Teacher'), salaryController.getSalarySlipPdf)
router.get('/reports', requireRole('Admin', 'Principal', 'HR', 'Accountant', 'Reception'), validate(salaryReportSchema), salaryController.getSalaryReports)

module.exports = router