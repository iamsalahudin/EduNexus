const Joi = require('joi');

const markAttendanceSchema = Joi.object({
  body: Joi.object({
    studentIds: Joi.array().items(Joi.string().required()).min(1).required(),
    date: Joi.date().required(),
    status: Joi.string().valid('present', 'absent', 'late', 'excused').required()
  })
});

const getAttendanceSchema = Joi.object({
  query: Joi.object({
    studentId: Joi.string(),
    classId: Joi.string(),
    date: Joi.date(),
    fromDate: Joi.date(),
    toDate: Joi.date()
  })
});

const updateAttendanceSchema = Joi.object({
  body: Joi.object({
    status: Joi.string().valid('present', 'absent', 'late', 'excused'),
    remarks: Joi.string().max(500)
  })
});

module.exports = { markAttendanceSchema, getAttendanceSchema, updateAttendanceSchema };
