const Joi = require('joi');

const listDirectoryUsersSchema = Joi.object({
  query: Joi.object({
    role: Joi.string().valid('Admin', 'Principal', 'Finance', 'HR', 'Reception', 'Teacher', 'Student', 'Parent'),
    q: Joi.string().max(100).allow(''),
    active: Joi.string().valid('true', 'false').allow(''),
    excludeRoles: Joi.string().max(200).allow(''),
    sortBy: Joi.string().valid('createdAt', 'updatedAt', 'name', 'email', 'role'),
    sortOrder: Joi.string().valid('asc', 'desc'),
    limit: Joi.number().integer().min(1).max(500)
  })
});

module.exports = { listDirectoryUsersSchema };
