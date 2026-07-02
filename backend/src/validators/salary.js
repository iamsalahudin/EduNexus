const Joi = require('joi')

const upsertSalaryStaffSchema = Joi.object({
  body: Joi.object({
    teacherId: Joi.string().optional().allow(''),
    userId: Joi.string().optional().allow(''),
    name: Joi.string().trim().min(1).optional(),
    employeeId: Joi.string().trim().min(1).optional(),
    designation: Joi.string().trim().min(1).optional(),
    department: Joi.string().trim().allow('').optional(),
    staffType: Joi.string().valid('teacher', 'staff').optional(),
    monthlySalary: Joi.number().min(0).optional(),
    salaryStructureId: Joi.string().allow('').optional(),
    salaryOnly: Joi.boolean().optional(),
    advanceBalance: Joi.number().min(0).optional(),
    status: Joi.string().valid('active', 'inactive').optional(),
    bankName: Joi.string().allow('').optional(),
    bankAccount: Joi.string().allow('').optional(),
    notes: Joi.string().allow('').optional()
  }).required()
})

const generateMonthlySalarySchema = Joi.object({
  body: Joi.object({
    periodMonth: Joi.string().pattern(/^\d{4}-\d{2}$/).optional(),
    staffIds: Joi.array().items(Joi.string()).optional()
  }).required()
})

const updateSalaryStatusSchema = Joi.object({
  body: Joi.object({
    status: Joi.string().valid('pending', 'partial', 'paid').required()
  }).required()
})

const advanceSalarySchema = Joi.object({
  body: Joi.object({
    amount: Joi.number().min(0).required(),
    method: Joi.string().allow('').optional(),
    note: Joi.string().allow('').optional()
  }).required()
})

const salaryReportSchema = Joi.object({
  query: Joi.object({
    periodMonth: Joi.string().pattern(/^\d{4}-\d{2}$/).optional(),
    status: Joi.string().valid('pending', 'partial', 'paid').optional(),
    staffId: Joi.string().optional().allow(''),
    q: Joi.string().optional().allow('')
  }).required()
})

const upsertSalaryStructureSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().trim().min(1).required(),
    staffType: Joi.string().valid('teacher', 'staff', 'all').optional(),
    baseSalary: Joi.number().min(0).optional(),
    allowancesTotal: Joi.number().min(0).optional(),
    deductionsTotal: Joi.number().min(0).optional(),
    active: Joi.boolean().optional(),
    notes: Joi.string().allow('').optional()
  }).required()
})

module.exports = {
  upsertSalaryStaffSchema,
  generateMonthlySalarySchema,
  updateSalaryStatusSchema,
  advanceSalarySchema,
  salaryReportSchema,
  upsertSalaryStructureSchema
}