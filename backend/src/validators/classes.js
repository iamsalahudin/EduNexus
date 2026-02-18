const Joi = require('joi');

const listClassesSchema = Joi.object({
  query: Joi.object({
    q: Joi.string().max(100).allow(''),
    active: Joi.boolean()
  })
});

const createClassSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().min(1).max(50).required(),
    sections: Joi.array().items(Joi.string().max(50)).optional(),
    active: Joi.boolean()
  })
});

const updateClassSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().min(1).max(50),
    sections: Joi.array().items(Joi.string().max(50)),
    active: Joi.boolean()
  })
});

module.exports = { listClassesSchema, createClassSchema, updateClassSchema };
