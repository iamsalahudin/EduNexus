const Joi = require('joi');

const listSubjectsSchema = Joi.object({
  query: Joi.object({
    className: Joi.string().max(100),
    active: Joi.boolean()
  })
});

const createSubjectSchema = Joi.object({
  body: Joi.object({
    className: Joi.string().min(1).max(50).required(),
    name: Joi.string().min(1).max(100).required(),
    active: Joi.boolean()
  })
});

const updateSubjectSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().min(1).max(100),
    active: Joi.boolean()
  })
});

const reorderSubjectsSchema = Joi.object({
  body: Joi.object({
    className: Joi.string().min(1).max(50).required(),
    orderedIds: Joi.array().items(Joi.string().min(1)).min(1).required()
  })
});

const applyDefaultSubjectsSchema = Joi.object({
  body: Joi.object({
    className: Joi.string().min(1).max(50)
  })
});

module.exports = {
  listSubjectsSchema,
  createSubjectSchema,
  updateSubjectSchema,
  reorderSubjectsSchema,
  applyDefaultSubjectsSchema
};
