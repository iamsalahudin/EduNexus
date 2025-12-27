const Joi = require('joi');

const createReportCardSchema = Joi.object({
  body: Joi.object({
    studentId: Joi.string().required(),
    term: Joi.string().required(),
    year: Joi.number().required(),
    subjects: Joi.array()
      .items(
        Joi.object({
          subject: Joi.string().required(),
          marks: Joi.number().min(0).max(100).required(),
          remarks: Joi.string().max(500)
        })
      )
      .min(1)
      .required()
  })
});

const getReportCardsSchema = Joi.object({
  query: Joi.object({
    studentId: Joi.string(),
    term: Joi.string(),
    year: Joi.number(),
    status: Joi.string().valid('draft', 'published')
  })
});

const rejectReportCardSchema = Joi.object({
  body: Joi.object({
    remarks: Joi.string().max(500)
  })
});

module.exports = { createReportCardSchema, getReportCardsSchema, rejectReportCardSchema };
