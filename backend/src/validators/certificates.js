const Joi = require('joi');

const createCertificateSchema = Joi.object({
  body: Joi.object({
    type: Joi.string().valid('transfer', 'slc').required(),
    studentId: Joi.string().required(),
    issueDate: Joi.date(),
    reason: Joi.string().max(500).allow(''),
    remarks: Joi.string().max(1000).allow(''),
    conduct: Joi.string().valid('Excellent', 'Very Good', 'Good', 'Satisfactory').allow(''),
    leavingDate: Joi.date()
  })
});

const listStudentCertificatesSchema = Joi.object({
  params: Joi.object({
    studentId: Joi.string().required()
  }),
  query: Joi.object({
    type: Joi.string().valid('transfer', 'slc'),
    limit: Joi.number().integer().min(1).max(100)
  })
});

const listRecentCertificatesSchema = Joi.object({
  query: Joi.object({
    type: Joi.string().valid('transfer', 'slc'),
    limit: Joi.number().integer().min(1).max(100)
  })
});

const certificateByIdSchema = Joi.object({
  params: Joi.object({
    certificateId: Joi.string().required()
  })
});

module.exports = {
  createCertificateSchema,
  listStudentCertificatesSchema,
  listRecentCertificatesSchema,
  certificateByIdSchema
};
