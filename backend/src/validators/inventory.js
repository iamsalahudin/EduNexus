const Joi = require('joi');

const listCategoriesSchema = Joi.object({
  query: Joi.object({
    q: Joi.string().max(100).allow(''),
    active: Joi.string().valid('true', 'false', '').allow('')
  })
});

const categorySchema = Joi.object({
  body: Joi.object({
    name: Joi.string().min(1).max(100).required(),
    description: Joi.string().max(1000).allow(''),
    active: Joi.boolean()
  }).min(1)
});

const listItemsSchema = Joi.object({
  query: Joi.object({
    q: Joi.string().max(100).allow(''),
    categoryId: Joi.string().allow(''),
    status: Joi.string().valid('active', 'inactive', 'damaged', '').allow('')
  })
});

const itemSchema = Joi.object({
  body: Joi.object({
    sku: Joi.string().max(50).allow(''),
    name: Joi.string().min(1).max(120).required(),
    categoryId: Joi.string().required(),
    unit: Joi.string().max(50).allow(''),
    quantity: Joi.number().min(0),
    minQuantity: Joi.number().min(0),
    location: Joi.string().max(200).allow(''),
    status: Joi.string().valid('active', 'inactive', 'damaged'),
    notes: Joi.string().max(5000).allow('')
  }).min(1)
});

const listMovementsSchema = Joi.object({
  query: Joi.object({
    q: Joi.string().max(100).allow(''),
    itemId: Joi.string().allow(''),
    movementType: Joi.string().valid('in', 'out', '').allow('')
  })
});

const stockMovementSchema = Joi.object({
  body: Joi.object({
    itemId: Joi.string().required(),
    movementType: Joi.string().valid('in', 'out').required(),
    quantity: Joi.number().integer().min(1).required(),
    reference: Joi.string().max(150).allow(''),
    note: Joi.string().max(5000).allow(''),
    movementDate: Joi.date().iso().allow(null)
  }).min(1)
});

const listDistributionsSchema = Joi.object({
  query: Joi.object({
    q: Joi.string().max(100).allow(''),
    itemId: Joi.string().allow(''),
    recipientType: Joi.string().valid('class', 'student', 'staff', 'department', 'other', '').allow(''),
    status: Joi.string().valid('issued', 'returned', 'lost', '').allow('')
  })
});

const distributionSchema = Joi.object({
  body: Joi.object({
    itemId: Joi.string().required(),
    recipientName: Joi.string().min(1).max(150).required(),
    recipientType: Joi.string().valid('class', 'student', 'staff', 'department', 'other'),
    quantity: Joi.number().integer().min(1).required(),
    status: Joi.string().valid('issued', 'returned', 'lost'),
    distributedAt: Joi.date().iso().allow(null),
    note: Joi.string().max(5000).allow('')
  }).min(1)
});

module.exports = {
  listCategoriesSchema,
  categorySchema,
  listItemsSchema,
  itemSchema,
  listMovementsSchema,
  stockMovementSchema,
  listDistributionsSchema,
  distributionSchema
};
