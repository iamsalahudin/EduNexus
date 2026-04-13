const Joi = require('joi');

const registerSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    username: Joi.string().min(3).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).max(128).required(),
    role: Joi.string().valid('Admin','Principal','Finance','HR','Reception','Teacher','Student','Parent')
  })
});

const loginSchema = Joi.object({
  body: Joi.object({
    username: Joi.string().min(3).max(50).required(),
    password: Joi.string().required()
  })
});

const refreshSchema = Joi.object({
  body: Joi.object({
    refreshToken: Joi.string().optional()
  })
});

const logoutSchema = refreshSchema;

const changePasswordSchema = Joi.object({
  body: Joi.object({
    oldPassword: Joi.string().required(),
    newPassword: Joi.string().min(6).max(128).required()
  })
});

module.exports = { registerSchema, loginSchema, refreshSchema, logoutSchema, changePasswordSchema };
