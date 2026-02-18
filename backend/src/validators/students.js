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
    q: Joi.string().max(100),
    limit: Joi.number().integer().min(1).max(500)
  })
});

const createStudentSchema = Joi.object({
  body: Joi.object({
    studentId: Joi.string().min(1).max(50).required(),
    firstName: Joi.string().min(1).max(100).required(),
    lastName: Joi.string().max(100).allow(''),
    class: Joi.alternatives().try(Joi.string(), Joi.number()).required(),
    section: Joi.string().max(50).allow(''),
    dob: Joi.date(),
    parents: Joi.array().items(Joi.string()),
    contact: Joi.string().max(100).allow(''),
    address: Joi.string().max(200).allow(''),
    enrollDate: Joi.date(),
    status: Joi.string().valid('active', 'inactive', 'alumni')
  })
});

const updateStudentSchema = Joi.object({
  body: Joi.object({
    firstName: Joi.string().min(1).max(100),
    lastName: Joi.string().max(100).allow(''),
    class: Joi.alternatives().try(Joi.string(), Joi.number()),
    section: Joi.string().max(50).allow(''),
    dob: Joi.date(),
    parents: Joi.array().items(Joi.string()),
    contact: Joi.string().max(100).allow(''),
    address: Joi.string().max(200).allow(''),
    enrollDate: Joi.date(),
    status: Joi.string().valid('active', 'inactive', 'alumni')
  })
});

const admitStudentSchema = Joi.object({
  body: Joi.object({
    student: Joi.object({
      studentId: Joi.string().min(1).max(50).required(),
      firstName: Joi.string().min(1).max(100).required(),
      lastName: Joi.string().max(100).allow(''),
      class: Joi.alternatives().try(Joi.string(), Joi.number()).required(),
      section: Joi.string().max(50).allow(''),
      dob: Joi.date(),
      contact: Joi.string().max(100).allow(''),
      address: Joi.string().max(200).allow(''),
      enrollDate: Joi.date(),
      status: Joi.string().valid('active', 'inactive', 'alumni')
    }).required(),
    parent: Joi.object({
      mode: Joi.string().valid('existing', 'new').required(),
      parentId: Joi.when('mode', { is: 'existing', then: Joi.string().required(), otherwise: Joi.forbidden() }),
      name: Joi.when('mode', { is: 'new', then: Joi.string().min(2).max(100).required(), otherwise: Joi.forbidden() }),
      email: Joi.when('mode', { is: 'new', then: Joi.string().email().required(), otherwise: Joi.forbidden() }),
      phone: Joi.string().allow(''),
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
