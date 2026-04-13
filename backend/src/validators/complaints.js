const Joi = require('joi');

const submitComplaintSchema = Joi.object({
  body: Joi.object({
    title: Joi.string().trim().max(160),
    subject: Joi.string().trim().max(160),
    description: Joi.string().trim().max(2000),
    message: Joi.string().trim().max(2000),
    category: Joi.string().valid('general', 'academic', 'discipline', 'behavior', 'transport', 'fees', 'other').default('general'),
    priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium'),
    type: Joi.string().trim().allow('', null),
    relatedToStudent: Joi.string().optional().allow(null, '')
  })
    .or('title', 'subject')
    .or('description', 'message')
    .required()
});

const addCommentSchema = Joi.object({
  body: Joi.object({
    text: Joi.string().trim().max(2000),
    message: Joi.string().trim().max(2000)
  })
    .or('text', 'message')
    .required()
});

const assignComplaintSchema = Joi.object({
  body: Joi.object({
    userId: Joi.string().required()
  }).required()
});

const changeStatusSchema = Joi.object({
  body: Joi.object({
    status: Joi.string().valid('open', 'assigned', 'in_progress', 'resolved', 'closed').required()
  }).required()
});

module.exports = { submitComplaintSchema, addCommentSchema, assignComplaintSchema, changeStatusSchema };