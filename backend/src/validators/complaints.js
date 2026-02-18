const Joi = require('joi');

const submitComplaintSchema = Joi.object({
  subject: Joi.string().required(),
  message: Joi.string().required(),
  relatedToStudent: Joi.string().optional().allow(null,''),
});

const addCommentSchema = Joi.object({ text: Joi.string().required() });

const assignComplaintSchema = Joi.object({ userId: Joi.string().required() });

const changeStatusSchema = Joi.object({ status: Joi.string().valid('open','in_progress','resolved','closed').required() });

module.exports = { submitComplaintSchema, addCommentSchema, assignComplaintSchema, changeStatusSchema };