const Joi = require('joi');

const listFinanceCategoriesSchema = Joi.object({
  query: Joi.object({
    q: Joi.string().max(120).allow(''),
    type: Joi.string().valid('debit', 'credit', '').allow(''),
    active: Joi.string().valid('true', 'false', '').allow('')
  })
});

const upsertFinanceCategorySchema = Joi.object({
  body: Joi.object({
    name: Joi.string().min(1).max(120).required(),
    type: Joi.string().valid('debit', 'credit').required(),
    description: Joi.string().max(1000).allow(''),
    active: Joi.boolean()
  }).min(1)
});

const listFinanceExpensesSchema = Joi.object({
  query: Joi.object({
    q: Joi.string().max(120).allow(''),
    categoryId: Joi.string().allow(''),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional()
  })
});

const upsertFinanceExpenseSchema = Joi.object({
  body: Joi.object({
    title: Joi.string().min(1).max(160).required(),
    amount: Joi.number().positive().required(),
    categoryId: Joi.string().allow('', null),
    paymentMethod: Joi.string().valid('cash', 'bank', 'online', 'card', 'other').optional(),
    expenseDate: Joi.date().optional(),
    note: Joi.string().allow('').max(2000)
  }).min(1)
});

const listFinanceLiabilitiesSchema = Joi.object({
  query: Joi.object({
    q: Joi.string().max(120).allow(''),
    status: Joi.string().valid('open', 'closed', '').allow(''),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional()
  })
});

const createLiabilityIntakeSchema = Joi.object({
  body: Joi.object({
    title: Joi.string().min(1).max(160).required(),
    debtorName: Joi.string().min(1).max(120).required(),
    amount: Joi.number().positive().required(),
    categoryId: Joi.string().allow('', null),
    incurredDate: Joi.date().optional(),
    note: Joi.string().allow('').max(2000)
  }).min(1)
});

const repayLiabilitySchema = Joi.object({
  params: Joi.object({
    id: Joi.string().required()
  }),
  body: Joi.object({
    amount: Joi.number().positive().required(),
    paymentDate: Joi.date().optional(),
    paymentMethod: Joi.string().valid('cash', 'bank', 'online', 'card', 'other').optional(),
    note: Joi.string().allow('').max(2000),
    expenseCategoryId: Joi.string().allow('', null)
  }).min(1)
});

const financeReportSchema = Joi.object({
  query: Joi.object({
    type: Joi.string().valid('income', 'expense', 'liability', 'debt', 'balance-sheet', '').allow(''),
    categoryId: Joi.string().allow(''),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional()
  })
});

module.exports = {
  listFinanceCategoriesSchema,
  upsertFinanceCategorySchema,
  listFinanceExpensesSchema,
  upsertFinanceExpenseSchema,
  listFinanceLiabilitiesSchema,
  createLiabilityIntakeSchema,
  repayLiabilitySchema,
  financeReportSchema
};