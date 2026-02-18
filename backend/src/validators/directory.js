const Joi = require('joi');

const listDirectoryUsersSchema = Joi.object({
  query: Joi.object({
    role: Joi.string().valid('Admin', 'Principal', 'Finance', 'HR', 'Reception', 'Teacher', 'Student', 'Parent'),
    q: Joi.string().max(100).allow(''),
    limit: Joi.number().integer().min(1).max(200)
  })
});

module.exports = { listDirectoryUsersSchema };
