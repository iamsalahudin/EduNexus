const Joi = require('joi');

const objectId = Joi.string().pattern(/^[a-fA-F0-9]{24}$/);

const listRoutesSchema = Joi.object({
  query: Joi.object({
    q: Joi.string().trim().allow('', null),
    active: Joi.boolean(),
    page: Joi.number().integer().min(1),
    limit: Joi.number().integer().min(1).max(100)
  })
});

const createRouteSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().trim().required(),
    code: Joi.string().trim().allow('', null),
    pickupPoint: Joi.string().trim().required(),
    dropoffPoint: Joi.string().trim().required(),
    fee: Joi.number().min(0).required(),
    vehicleNumber: Joi.string().trim().allow('', null),
    driverName: Joi.string().trim().allow('', null),
    driverPhone: Joi.string().trim().allow('', null),
    active: Joi.boolean()
  }).required()
});

const updateRouteSchema = Joi.object({
  params: Joi.object({
    routeId: objectId.required()
  }),
  body: Joi.object({
    name: Joi.string().trim(),
    code: Joi.string().trim().allow('', null),
    pickupPoint: Joi.string().trim(),
    dropoffPoint: Joi.string().trim(),
    fee: Joi.number().min(0),
    vehicleNumber: Joi.string().trim().allow('', null),
    driverName: Joi.string().trim().allow('', null),
    driverPhone: Joi.string().trim().allow('', null),
    active: Joi.boolean()
  }).min(1).required()
});

const routeIdParamSchema = Joi.object({
  params: Joi.object({
    routeId: objectId.required()
  }).required()
});

const listEnrollmentsSchema = Joi.object({
  query: Joi.object({
    status: Joi.string().valid('enrolled', 'inactive').allow('', null),
    subjectRole: Joi.string().valid('Student', 'Teacher').allow('', null),
    routeId: objectId.allow('', null),
    page: Joi.number().integer().min(1),
    limit: Joi.number().integer().min(1).max(100)
  })
});

const createEnrollmentSchema = Joi.object({
  body: Joi.object({
    routeId: objectId.required(),
    subjectRole: Joi.string().valid('Student', 'Teacher').required(),
    studentId: objectId.allow(null, ''),
    teacherId: objectId.allow(null, ''),
    teacherUserId: objectId.allow(null, ''),
    notes: Joi.string().trim().allow('', null)
  }).required()
});

const updateEnrollmentSchema = Joi.object({
  params: Joi.object({
    enrollmentId: objectId.required()
  }),
  body: Joi.object({
    routeId: objectId,
    status: Joi.string().valid('enrolled', 'inactive'),
    notes: Joi.string().trim().allow('', null)
  }).min(1).required()
});

const enrollmentIdParamSchema = Joi.object({
  params: Joi.object({
    enrollmentId: objectId.required()
  }).required()
});

const createRequestSchema = Joi.object({
  body: Joi.object({
    routeId: objectId.required(),
    studentId: objectId.allow('', null),
    reason: Joi.string().trim().allow('', null)
  }).required()
});

const listRequestsSchema = Joi.object({
  query: Joi.object({
    status: Joi.string().valid('pending', 'approved', 'rejected', 'cancelled').allow('', null),
    page: Joi.number().integer().min(1),
    limit: Joi.number().integer().min(1).max(100)
  })
});

const updateRequestStatusSchema = Joi.object({
  params: Joi.object({
    requestId: objectId.required()
  }),
  body: Joi.object({
    status: Joi.string().valid('approved', 'rejected', 'cancelled').required(),
    reviewNote: Joi.string().trim().allow('', null)
  }).required()
});

const listPaymentsSchema = Joi.object({
  query: Joi.object({
    status: Joi.string().valid('paid', 'pending', 'partial', 'overdue').allow('', null),
    subjectRole: Joi.string().valid('Student', 'Teacher').allow('', null),
    routeId: objectId.allow('', null),
    year: Joi.number().integer().min(2000).max(2200),
    month: Joi.number().integer().min(1).max(12),
    page: Joi.number().integer().min(1),
    limit: Joi.number().integer().min(1).max(100)
  })
});

const createPaymentSchema = Joi.object({
  body: Joi.object({
    enrollmentId: objectId.required(),
    periodMonth: Joi.number().integer().min(1).max(12).required(),
    periodYear: Joi.number().integer().min(2000).max(2200).required(),
    amountDue: Joi.number().min(0).required(),
    amountPaid: Joi.number().min(0).default(0),
    status: Joi.string().valid('paid', 'pending', 'partial', 'overdue').required(),
    dueDate: Joi.date().iso().allow(null),
    paidOn: Joi.date().iso().allow(null),
    remarks: Joi.string().trim().allow('', null)
  }).required()
});

const updatePaymentSchema = Joi.object({
  params: Joi.object({
    paymentId: objectId.required()
  }),
  body: Joi.object({
    amountDue: Joi.number().min(0),
    amountPaid: Joi.number().min(0),
    status: Joi.string().valid('paid', 'pending', 'partial', 'overdue'),
    dueDate: Joi.date().iso().allow(null),
    paidOn: Joi.date().iso().allow(null),
    remarks: Joi.string().trim().allow('', null)
  }).min(1).required()
});

const paymentIdParamSchema = Joi.object({
  params: Joi.object({
    paymentId: objectId.required()
  }).required()
});

const reportFiltersSchema = Joi.object({
  query: Joi.object({
    year: Joi.number().integer().min(2000).max(2200),
    month: Joi.number().integer().min(1).max(12),
    routeId: objectId.allow('', null)
  })
});

module.exports = {
  listRoutesSchema,
  createRouteSchema,
  updateRouteSchema,
  routeIdParamSchema,
  listEnrollmentsSchema,
  createEnrollmentSchema,
  updateEnrollmentSchema,
  enrollmentIdParamSchema,
  createRequestSchema,
  listRequestsSchema,
  updateRequestStatusSchema,
  listPaymentsSchema,
  createPaymentSchema,
  updatePaymentSchema,
  paymentIdParamSchema,
  reportFiltersSchema
};
