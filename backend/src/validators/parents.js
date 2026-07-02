const Joi = require('joi');

const objectId = Joi.string().length(24).hex();

const listParentSchema = Joi.object({
  query: Joi.object({
    q: Joi.string().max(100).allow(''),
    recentHours: Joi.number().integer().min(1).max(24 * 365),
    active: Joi.boolean(),
    page: Joi.number().integer().min(1),
    limit: Joi.number().integer().min(1).max(500),
    sortBy: Joi.string().valid('createdAt', 'updatedAt', 'name', 'email', 'phone'),
    sortOrder: Joi.string().valid('asc', 'desc')
  })
});

const getParentSchema = Joi.object({
  params: Joi.object({ id: objectId.required() })
});

const createParentSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().min(3).max(40).required(),
    cnic: Joi.string().max(40).allow(''),
    dob: Joi.date(),
    occupation: Joi.string().max(120).allow(''),
    salary: Joi.number().min(0),
    relation: Joi.string().max(80).allow(''),
    address: Joi.string().max(500).allow(''),
    username: Joi.string().min(3).max(50)
  })
});

const updateParentSchema = Joi.object({
  params: Joi.object({ id: objectId.required() }),
  body: Joi.object({
    name: Joi.string().min(2).max(100),
    email: Joi.string().email(),
    phone: Joi.string().min(3).max(40),
    cnic: Joi.string().max(40).allow(''),
    dob: Joi.date(),
    occupation: Joi.string().max(120).allow(''),
    salary: Joi.number().min(0),
    relation: Joi.string().max(80).allow(''),
    address: Joi.string().max(500).allow(''),
    username: Joi.string().min(3).max(50)
  })
});

module.exports = {
  listParentSchema,
  getParentSchema,
  createParentSchema,
  updateParentSchema
};