const Joi = require('joi');

const addParentSchema = Joi.object({
  body: Joi.object({
    parentId: Joi.string().required()
  })
});

const bulkImportSchema = Joi.object({
  body: Joi.object({
    students: Joi.array()
      .items(
        Joi.object({
          studentId: Joi.string().required(),
          firstName: Joi.string().required(),
          lastName: Joi.string(),
          username: Joi.string().pattern(/^[a-zA-Z0-9._-]+$/).min(3).max(30),
          email: Joi.string().email().required(),
          class: Joi.string().required(),
          section: Joi.string(),
          dob: Joi.date(),
          parentEmail: Joi.string().email(),
          parentName: Joi.string()
        })
      )
      .min(1)
      .required()
  })
});

const listStudentsSchema = Joi.object({
  query: Joi.object({
    classId: Joi.string(),
    section: Joi.string(),
    status: Joi.string().valid('incampus', 'alumni'),
    active: Joi.boolean(),
    recentHours: Joi.number().integer().min(1).max(24 * 365),
    q: Joi.string().max(100),
    page: Joi.number().integer().min(1),
    sortBy: Joi.string().valid('updatedAt', 'createdAt', 'name', 'studentId', 'registrationNumber', 'class', 'status'),
    sortOrder: Joi.string().valid('asc', 'desc'),
    limit: Joi.number().integer().min(1).max(500)
  })
});

const createStudentSchema = Joi.object({
  body: Joi.object({
    studentId: Joi.string().min(1).max(50).required(),
    registrationNumber: Joi.string().min(1).max(100).required(),
    rollNumber: Joi.string().max(100).allow(''),
    firstName: Joi.string().min(1).max(100).required(),
    lastName: Joi.string().max(100).allow(''),
    username: Joi.string().pattern(/^[a-zA-Z0-9._-]+$/).min(3).max(30),
    email: Joi.string().email().required(),
    class: Joi.alternatives().try(Joi.string(), Joi.number()).required(),
    section: Joi.string().max(50).allow(''),
    dob: Joi.date(),
    parents: Joi.array().items(Joi.string()),
    contact: Joi.string().max(100).required(),
    address: Joi.string().max(200).allow(''),
    enrollDate: Joi.date(),
    status: Joi.string().valid('incampus', 'alumni')
  })
});

const updateStudentSchema = Joi.object({
  body: Joi.object({
    userName: Joi.string().min(1).max(100),
    userEmail: Joi.string().email(),
    userActive: Joi.boolean(),
    firstName: Joi.string().min(1).max(100),
    lastName: Joi.string().max(100).allow(''),
    class: Joi.alternatives().try(Joi.string(), Joi.number()),
    section: Joi.string().max(50).allow(''),
    dob: Joi.date(),
    parents: Joi.array().items(Joi.string()),
    registrationNumber: Joi.string().min(1).max(100),
    rollNumber: Joi.string().max(100).allow(''),
    contact: Joi.string().max(100),
    address: Joi.string().max(200).allow(''),
    enrollDate: Joi.date(),
    status: Joi.string().valid('incampus', 'alumni')
  })
});

const admitStudentSchema = Joi.object({
  body: Joi.object({
    student: Joi.object({
      studentId: Joi.string().min(1).max(50).required(),
      registrationNumber: Joi.string().min(1).max(100).required(),
      rollNumber: Joi.string().max(100).allow(''),
      firstName: Joi.string().min(1).max(100).required(),
      lastName: Joi.string().max(100).allow(''),
      class: Joi.alternatives().try(Joi.string(), Joi.number()).required(),
      section: Joi.string().max(50).allow(''),
      dob: Joi.date(),
      contact: Joi.string().max(100).required(),
      address: Joi.string().max(200).allow(''),
      enrollDate: Joi.date(),
      status: Joi.string().valid('incampus', 'alumni')
    }).required(),
    parent: Joi.object({
      mode: Joi.string().valid('existing', 'new').required(),
      parentId: Joi.when('mode', { is: 'existing', then: Joi.string().required(), otherwise: Joi.forbidden() }),
      name: Joi.when('mode', { is: 'new', then: Joi.string().min(2).max(100).required(), otherwise: Joi.forbidden() }),
      email: Joi.when('mode', { is: 'new', then: Joi.string().email().required(), otherwise: Joi.forbidden() }),
      phone: Joi.when('mode', { is: 'new', then: Joi.string().min(3).max(100).required(), otherwise: Joi.string().allow('') }),
      tempPassword: Joi.string().min(6).max(200)
    }).required(),
    createStudentLogin: Joi.object({
      enabled: Joi.boolean().required(),
      name: Joi.string().min(2).max(100),
      email: Joi.string().email(),
      tempPassword: Joi.string().min(6).max(200)
    })
  })
});

module.exports = {
  addParentSchema,
  bulkImportSchema,
  listStudentsSchema,
  createStudentSchema,
  updateStudentSchema,
  admitStudentSchema
};
