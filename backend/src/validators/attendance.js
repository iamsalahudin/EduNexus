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
    childId: Joi.string(),
    classId: Joi.string(),
    date: Joi.date(),
    fromDate: Joi.date(),
    toDate: Joi.date(),
    period: Joi.string().valid('month', 'year', 'custom'),
    month: Joi.number().integer().min(1).max(12),
    year: Joi.number().integer().min(2000).max(2100)
  })
});

const updateAttendanceSchema = Joi.object({
  body: Joi.object({
    status: attendanceStatus,
    remarks: Joi.string().max(500)
  })
});

const attendanceAssignmentSchema = Joi.object({
  body: Joi.object({
    teacherId: Joi.string().required(),
    className: Joi.string().required(),
    section: Joi.string().allow('').default('')
  })
});

const createLeaveRequestSchema = Joi.object({
  body: Joi.object({
    fromDate: Joi.date().required(),
    toDate: Joi.date().optional(),
    type: Joi.string().valid('full-day', 'half-day').default('full-day'),
    reason: Joi.string().max(1000).allow('').required(),
    childId: Joi.string().optional()
  })
});

const editLeaveRequestSchema = Joi.object({
  body: Joi.object({
    fromDate: Joi.date(),
    toDate: Joi.date(),
    type: Joi.string().valid('full-day', 'half-day'),
    reason: Joi.string().max(1000).allow(''),
    status: Joi.string().valid('pending', 'approved', 'rejected', 'cancelled'),
    approverRemarks: Joi.string().max(1000).allow('')
  })
});

const getLeaveRequestsSchema = Joi.object({
  query: Joi.object({
    studentId: Joi.string(),
    status: Joi.string().valid('pending', 'approved', 'rejected', 'cancelled')
  })
});

module.exports = { markAttendanceSchema, getAttendanceSchema, updateAttendanceSchema, attendanceAssignmentSchema, createLeaveRequestSchema, editLeaveRequestSchema, getLeaveRequestsSchema };
