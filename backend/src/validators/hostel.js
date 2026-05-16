const Joi = require('joi');

const listHostelsSchema = Joi.object({
  query: Joi.object({
    q: Joi.string().allow('').optional(),
    active: Joi.boolean().optional()
  })
});

const createHostelSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().trim().min(1).max(120).required(),
    wardenName: Joi.string().allow('').max(120).default(''),
    gender: Joi.string().valid('boys', 'girls', 'mixed').default('mixed'),
    address: Joi.string().allow('').max(300).default(''),
    active: Joi.boolean().default(true)
  })
});

const updateHostelSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().trim().min(1).max(120).optional(),
    wardenName: Joi.string().allow('').max(120).optional(),
    gender: Joi.string().valid('boys', 'girls', 'mixed').optional(),
    address: Joi.string().allow('').max(300).optional(),
    active: Joi.boolean().optional()
  }).min(1)
});

const listRoomsSchema = Joi.object({
  query: Joi.object({
    hostelId: Joi.string().optional(),
    active: Joi.boolean().optional()
  })
});

const createRoomSchema = Joi.object({
  body: Joi.object({
    hostelId: Joi.string().required(),
    roomNumber: Joi.string().trim().min(1).max(60).required(),
    capacity: Joi.number().integer().min(1).default(1),
    floor: Joi.string().allow('').max(60).default(''),
    active: Joi.boolean().default(true)
  })
});

const updateRoomSchema = Joi.object({
  body: Joi.object({
    hostelId: Joi.string().optional(),
    roomNumber: Joi.string().trim().min(1).max(60).optional(),
    capacity: Joi.number().integer().min(1).optional(),
    floor: Joi.string().allow('').max(60).optional(),
    active: Joi.boolean().optional()
  }).min(1)
});

const listResidentsSchema = Joi.object({
  query: Joi.object({
    hostelId: Joi.string().optional(),
    roomId: Joi.string().optional(),
    status: Joi.string().valid('active', 'left').optional()
  })
});

const createResidentSchema = Joi.object({
  body: Joi.object({
    studentId: Joi.string().required(),
    hostelId: Joi.string().required(),
    roomId: Joi.string().required(),
    joinDate: Joi.date().iso().optional(),
    notes: Joi.string().allow('').max(500).default('')
  })
});

const updateResidentSchema = Joi.object({
  body: Joi.object({
    hostelId: Joi.string().optional(),
    roomId: Joi.string().optional(),
    joinDate: Joi.date().iso().optional(),
    leaveDate: Joi.date().iso().allow(null).optional(),
    status: Joi.string().valid('active', 'left').optional(),
    notes: Joi.string().allow('').max(500).optional()
  }).min(1)
});

const listFeesSchema = Joi.object({
  query: Joi.object({
    status: Joi.string().valid('pending', 'partial', 'paid').optional(),
    residentId: Joi.string().optional(),
    month: Joi.number().integer().min(1).max(12).optional(),
    year: Joi.number().integer().min(2000).optional()
  })
});

const createFeeSchema = Joi.object({
  body: Joi.object({
    residentId: Joi.string().required(),
    amount: Joi.number().min(0).required(),
    month: Joi.number().integer().min(1).max(12).required(),
    year: Joi.number().integer().min(2000).required(),
    dueDate: Joi.date().iso().required(),
    notes: Joi.string().allow('').max(500).default('')
  })
});

const payFeeSchema = Joi.object({
  body: Joi.object({
    amount: Joi.number().min(0.01).required(),
    paidDate: Joi.date().iso().optional()
  })
});

module.exports = {
  listHostelsSchema,
  createHostelSchema,
  updateHostelSchema,
  listRoomsSchema,
  createRoomSchema,
  updateRoomSchema,
  listResidentsSchema,
  createResidentSchema,
  updateResidentSchema,
  listFeesSchema,
  createFeeSchema,
  payFeeSchema
};
