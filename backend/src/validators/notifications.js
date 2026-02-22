const Joi = require('joi');

const category = Joi.string().valid('critical', 'normal', 'pending', 'reminder', 'info', 'success', 'warning');

const createBroadcastSchema = Joi.object({
  body: Joi.object({
    scope: Joi.string().valid('global', 'role', 'targeted').required(),
    category: category.default('normal'),
    title: Joi.string().min(1).max(120).required(),
    body: Joi.string().allow('').max(5000).default(''),

    expiresAt: Joi.date().iso().optional(),

    // scope=role
    roles: Joi.array().items(Joi.string()).default([]),

    // scope=targeted
    targetType: Joi.string().valid('student', 'section', 'class', 'level', 'user').optional(),
    level: Joi.string().valid('pre-primary', 'primary', 'middle').optional(),
    class: Joi.string().optional(),
    section: Joi.string().optional(),
    studentId: Joi.string().optional(), // Student._id
    userId: Joi.string().optional(), // User._id
    recipientRoles: Joi.array().items(Joi.string().valid('Student', 'Parent')).default(['Student'])
  })
});

const listBroadcastSchema = Joi.object({
  query: Joi.object({
    scope: Joi.string().valid('global', 'role', 'targeted').optional(),
    category: category.optional(),
    limit: Joi.number().min(1).max(200).default(50)
  })
});

const createRequestSchema = Joi.object({
  body: Joi.object({
    title: Joi.string().min(1).max(120).required(),
    message: Joi.string().min(1).max(5000).required(),
    category: category.default('pending')
  })
});

const listRequestsSchema = Joi.object({
  query: Joi.object({
    status: Joi.string().valid('pending', 'replied', 'closed').optional(),
    category: category.optional(),
    limit: Joi.number().min(1).max(200).default(50)
  })
});

const replyRequestSchema = Joi.object({
  body: Joi.object({
    message: Joi.string().min(1).max(5000).required()
  })
});

const closeRequestSchema = Joi.object({
  body: Joi.object({}).default({})
});

const dismissSchema = Joi.object({
  body: Joi.object({}).default({})
});

const inboxSchema = Joi.object({
  query: Joi.object({
    limit: Joi.number().min(1).max(200).default(50)
  })
});

module.exports = {
  createBroadcastSchema,
  listBroadcastSchema,
  createRequestSchema,
  listRequestsSchema,
  replyRequestSchema,
  closeRequestSchema,
  dismissSchema,
  inboxSchema
};
