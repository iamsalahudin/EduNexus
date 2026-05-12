const Joi = require('joi');

const listSyllabusSchema = Joi.object({
  query: Joi.object({
    q: Joi.string().max(100).allow(''),
    className: Joi.string().max(50).allow(''),
    subjectName: Joi.string().max(100).allow(''),
    status: Joi.string().valid('draft', 'active', 'completed').allow(''),
    term: Joi.string().valid('annual', 'term-1', 'term-2', 'term-3', 'custom').allow('')
  })
});

const syllabusSchema = Joi.object({
  body: Joi.object({
    className: Joi.string().min(1).max(50).required(),
    subjectName: Joi.string().min(1).max(100).required(),
    title: Joi.string().min(1).max(200).required(),
    academicYear: Joi.string().max(50).allow(''),
    term: Joi.string().valid('annual', 'term-1', 'term-2', 'term-3', 'custom'),
    chapters: Joi.array().items(Joi.string().min(1).max(200)),
    status: Joi.string().valid('draft', 'active', 'completed'),
    notes: Joi.string().max(5000).allow('')
  }).min(1)
});

module.exports = { listSyllabusSchema, syllabusSchema };