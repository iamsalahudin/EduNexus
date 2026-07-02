const Joi = require('joi');

const objectId = Joi.string().length(24).hex();

const listTeachersSchema = Joi.object({
  query: Joi.object({
    q: Joi.string().max(100).allow(''),
    status: Joi.string().valid('Working', 'Resigned').allow(''),
    active: Joi.boolean(),
    recentHours: Joi.number().integer().min(1).max(720),
    page: Joi.number().integer().min(1),
    limit: Joi.number().integer().min(1).max(500),
    sortBy: Joi.string().valid('createdAt', 'updatedAt', 'employeeId', 'name', 'username', 'email', 'status'),
    sortOrder: Joi.string().valid('asc', 'desc')
  })
});

const getTeacherSchema = Joi.object({
  params: Joi.object({ id: objectId.required() })
});

const createTeacherSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    username: Joi.string().min(3).max(50).required(),
    email: Joi.string().email().required(),
    designation: Joi.string().min(2).max(120).required(),
    department: Joi.string().max(120).allow(''),
    subjects: Joi.alternatives().try(Joi.array().items(Joi.string().max(120)), Joi.string().allow('')),
    classesAssigned: Joi.alternatives().try(Joi.array().items(Joi.string().max(120)), Joi.string().allow('')),
    qualification: Joi.string().min(2).max(160).required(),
    certifications: Joi.alternatives().try(Joi.array().items(Joi.string().max(160)), Joi.string().allow('')),
    joiningDate: Joi.date().required(),
    experienceYears: Joi.number().min(0).max(60),
    salary: Joi.number().min(0),
    contactNumber: Joi.string().min(5).max(40).required(),
    address: Joi.string().min(5).max(500).required(),
    emergencyContactName: Joi.string().max(120).allow(''),
    emergencyContactPhone: Joi.string().max(40).allow(''),
    notes: Joi.string().allow('')
  })
});

const updateTeacherSchema = Joi.object({
  params: Joi.object({ id: objectId.required() }),
  body: Joi.object({
    name: Joi.string().min(2).max(100),
    username: Joi.string().min(3).max(50),
    email: Joi.string().email(),
    active: Joi.boolean(),
    designation: Joi.string().min(2).max(120),
    department: Joi.string().max(120).allow(''),
    subjects: Joi.alternatives().try(Joi.array().items(Joi.string().max(120)), Joi.string().allow('')),
    classesAssigned: Joi.alternatives().try(Joi.array().items(Joi.string().max(120)), Joi.string().allow('')),
    qualification: Joi.string().min(2).max(160),
    certifications: Joi.alternatives().try(Joi.array().items(Joi.string().max(160)), Joi.string().allow('')),
    joiningDate: Joi.date(),
    experienceYears: Joi.number().min(0).max(60),
    salary: Joi.number().min(0),
    contactNumber: Joi.string().min(5).max(40),
    address: Joi.string().min(5).max(500),
    emergencyContactName: Joi.string().max(120).allow(''),
    emergencyContactPhone: Joi.string().max(40).allow(''),
    status: Joi.string().valid('Working', 'Resigned'),
    notes: Joi.string().allow(''),
    removeDocuments: Joi.alternatives().try(
      Joi.array().items(Joi.string().uri()),
      Joi.string().allow('')
    )
  })
});

module.exports = {
  listTeachersSchema,
  getTeacherSchema,
  createTeacherSchema,
  updateTeacherSchema
};
