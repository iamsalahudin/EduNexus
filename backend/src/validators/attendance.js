const Joi = require('joi');

const attendanceStatus = Joi.string().valid('present', 'absent', 'late', 'excused');

const markAttendanceSchema = Joi.object({
  body: Joi.object({
    date: Joi.date().required(),
    // Preferred: entries allows per-student status
    entries: Joi.array()
      .items(
        Joi.object({
          studentId: Joi.string().required(),
          status: attendanceStatus.required(),
          remarks: Joi.string().max(500).allow('')
        })
      )
      .min(1),
    // Backward compatible: one status for multiple students
    studentIds: Joi.array().items(Joi.string().required()).min(1),
    status: attendanceStatus
  })
    .xor('entries', 'studentIds')
    .with('studentIds', 'status')
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
    status: attendanceStatus,
    remarks: Joi.string().max(500)
  })
});

module.exports = { markAttendanceSchema, getAttendanceSchema, updateAttendanceSchema };
