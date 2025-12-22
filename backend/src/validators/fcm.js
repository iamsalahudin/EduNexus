const Joi = require('joi');

const registerTokenSchema = Joi.object({
  token: Joi.string().required(),
  deviceInfo: Joi.string().optional().allow('')
});

module.exports = { registerTokenSchema };
