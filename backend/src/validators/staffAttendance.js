const Joi = require('joi');

const staffAttendanceStatus = Joi.string().valid('present', 'absent', 'late', 'leave');

const markStaffAttendanceSchema = Joi.object({
  body: Joi.object({
    date: Joi.date().required(),
    status: staffAttendanceStatus.required(),
    remarks: Joi.string().max(500).allow(''),
    userId: Joi.string()
  })
});

const getStaffAttendanceSchema = Joi.object({
  query: Joi.object({
    role: Joi.string(),
    userId: Joi.string(),
    date: Joi.date(),
    fromDate: Joi.date(),
    toDate: Joi.date(),
    period: Joi.string().valid('month', 'year', 'custom'),
    month: Joi.number().integer().min(1).max(12),
    year: Joi.number().integer().min(2000).max(2100)
  })
});

const updateStaffAttendanceSchema = Joi.object({
  body: Joi.object({
    status: staffAttendanceStatus,
    remarks: Joi.string().max(500).allow('')
  })
});

module.exports = { markStaffAttendanceSchema, getStaffAttendanceSchema, updateStaffAttendanceSchema };
