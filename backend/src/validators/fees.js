const Joi = require('joi');

const createFeeSchema = Joi.object({
  body: Joi.object({
    studentId: Joi.string().required(),
    amount: Joi.number().positive().required(),
    dueDate: Joi.date().optional().allow(null),
    notes: Joi.string().optional().allow(''),
  })
});

const generateMonthlyFeesSchema = Joi.object({
  body: Joi.object({
    year: Joi.number().integer().min(2000).max(2100).optional(),
    month: Joi.number().integer().min(1).max(12).optional(),
    class: Joi.string().optional().allow(''),
    section: Joi.string().optional().allow('')
  }).optional(),
  query: Joi.object({
    year: Joi.number().integer().min(2000).max(2100).optional(),
    month: Joi.number().integer().min(1).max(12).optional(),
    class: Joi.string().optional().allow(''),
    section: Joi.string().optional().allow('')
  }).optional()
});

const recordPaymentSchema = Joi.object({
  params: Joi.object({
    id: Joi.string().required(),
  }),
  body: Joi.object({
    amount: Joi.number().positive().required(),
    method: Joi.string().valid('cash','card','bank','online').required(),
    transactionId: Joi.string().optional().allow(''),
  })
});

const updateFeeSchema = Joi.object({
  params: Joi.object({
    id: Joi.string().required(),
  }),
  body: Joi.object({
    amount: Joi.number().positive().optional(),
    dueDate: Joi.date().optional().allow(null),
    notes: Joi.string().optional().allow(''),
    status: Joi.string().valid('pending','paid','overdue','cancelled').optional(),
  })
});

const updateFeeStatusSchema = Joi.object({
  params: Joi.object({
    id: Joi.string().required(),
  }),
  body: Joi.object({
    status: Joi.string().valid('paid', 'pending', 'unpaid').required()
  })
});

const feeVoucherTemplateSchema = Joi.object({
  body: Joi.object({
    schoolName: Joi.string().min(1).max(200).required(),
    schoolAddress: Joi.string().min(1).max(300).required(),
    banks: Joi.array()
      .items(
        Joi.object({
          bankName: Joi.string().min(1).max(200).required(),
          account: Joi.string().min(1).max(200).required()
        })
      )
      .min(1)
      .required()
  })
});

module.exports = { createFeeSchema, generateMonthlyFeesSchema, recordPaymentSchema, updateFeeSchema, updateFeeStatusSchema, feeVoucherTemplateSchema };