const Joi = require('joi');

const createDailyDiarySchema = Joi.object({
  body: Joi.object({
    date: Joi.date().required(),
    class: Joi.string().trim().required(),
    section: Joi.string().trim().required(),
    subject: Joi.string().required(),
    teacherId: Joi.string().optional(),
    title: Joi.string().trim().min(1).required(),
    content: Joi.string().allow('').optional(),
    status: Joi.string().valid('draft', 'published').optional(),
    auditNote: Joi.string().allow('').optional()
  }).required()
});

const updateDailyDiarySchema = Joi.object({
  body: Joi.object({
    date: Joi.date().optional(),
    class: Joi.string().trim().optional(),
    section: Joi.string().trim().optional(),
    subject: Joi.string().optional(),
    title: Joi.string().trim().min(1).optional(),
    content: Joi.string().allow('').optional(),
    status: Joi.string().valid('draft', 'published').optional(),
    auditNote: Joi.string().allow('').optional()
  }).required()
});

const listDailyDiaryQuerySchema = Joi.object({
  query: Joi.object({
    date: Joi.date().optional(),
    fromDate: Joi.date().optional(),
    toDate: Joi.date().optional(),
    class: Joi.string().optional(),
    section: Joi.string().optional(),
    subject: Joi.string().optional(),
    teacherId: Joi.string().optional(),
    childId: Joi.string().optional(),
    status: Joi.string().valid('draft', 'published').optional(),
    q: Joi.string().allow('').optional()
  }).required()
});

module.exports = {
  createDailyDiarySchema,
  updateDailyDiarySchema,
  listDailyDiaryQuerySchema
};
