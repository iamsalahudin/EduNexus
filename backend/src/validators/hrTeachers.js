const Joi = require('joi');

const listTeachersSchema = Joi.object({
  query: Joi.object({
    q: Joi.string().max(100).allow(''),
    limit: Joi.number().integer().min(1).max(500)
  })
});

const createTeacherSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).max(200).required(),
    active: Joi.boolean(),
    profile: Joi.object({
      class: Joi.alternatives().try(Joi.string(), Joi.number()),
      section: Joi.string().allow('')
    }).unknown(true)
  })
});

const updateTeacherSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().min(2).max(100),
    email: Joi.string().email(),
    active: Joi.boolean(),
    profile: Joi.object({
      class: Joi.alternatives().try(Joi.string(), Joi.number()),
      section: Joi.string().allow('')
    }).unknown(true)
  })
});

module.exports = { listTeachersSchema, createTeacherSchema, updateTeacherSchema };
