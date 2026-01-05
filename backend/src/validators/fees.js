const Joi = require('joi');

const createFeeSchema = Joi.object({
  studentId: Joi.string().required(),
  amount: Joi.number().positive().required(),
  dueDate: Joi.date().optional().allow(null),
  notes: Joi.string().optional().allow(''),
});

const recordPaymentSchema = Joi.object({
  amount: Joi.number().positive().required(),
  method: Joi.string().valid('cash','card','bank','online').required(),
  transactionId: Joi.string().optional().allow(''),
});

const updateFeeSchema = Joi.object({
  amount: Joi.number().positive().optional(),
  dueDate: Joi.date().optional().allow(null),
  notes: Joi.string().optional().allow(''),
  status: Joi.string().valid('pending','paid','overdue','cancelled').optional(),
});

module.exports = { createFeeSchema, recordPaymentSchema, updateFeeSchema };