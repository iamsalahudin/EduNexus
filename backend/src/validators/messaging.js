const Joi = require('joi');

const sendMessageSchema = Joi.object({
  recipientId: Joi.string().required(),
  text: Joi.string().required(),
  attachments: Joi.array().items(Joi.string()).optional()
});

module.exports = { sendMessageSchema };
