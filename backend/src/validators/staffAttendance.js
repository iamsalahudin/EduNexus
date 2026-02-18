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
    userId: Joi.string(),
    date: Joi.date(),
    fromDate: Joi.date(),
    toDate: Joi.date()
  })
});

const updateStaffAttendanceSchema = Joi.object({
  body: Joi.object({
    status: staffAttendanceStatus,
    remarks: Joi.string().max(500).allow('')
  })
});

module.exports = { markStaffAttendanceSchema, getStaffAttendanceSchema, updateStaffAttendanceSchema };
