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
    level: Joi.string().trim().max(50).optional(),
    sections: Joi.array().items(Joi.string().max(50)).optional(),
    tutionFee: Joi.number().min(0),
    active: Joi.boolean()
  })
});

const updateClassSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().min(1).max(50),
    level: Joi.string().trim().max(50).allow(null, ''),
    sections: Joi.array().items(Joi.string().max(50)),
    tutionFee: Joi.number().min(0),
    active: Joi.boolean()
  })
});

const updateLevelsSchema = Joi.object({
  body: Joi.object({
    levels: Joi.array().items(Joi.string().trim().min(1).max(50)).min(1).required()
  })
});

const updateRoomsSchema = Joi.object({
  body: Joi.object({
    rooms: Joi.array().items(Joi.string().trim().min(1).max(100)).min(1).required()
  })
});

module.exports = { listClassesSchema, createClassSchema, updateClassSchema, updateLevelsSchema, updateRoomsSchema };
