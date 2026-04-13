const Joi = require('joi');

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const objectId = Joi.string().pattern(/^[a-f\d]{24}$/i);

const slotSchema = Joi.object({
  day: Joi.string().valid(...DAYS).required(),
  startTime: Joi.string().pattern(TIME_PATTERN).required(),
  endTime: Joi.string().pattern(TIME_PATTERN).required(),
  subject: objectId,
  teacher: objectId,
  class: Joi.string().required(),
  section: Joi.string().allow(''),
  room: Joi.string().allow('', null)
});

const createTimetableSchema = Joi.object({
  body: Joi.object({
    level: Joi.string().trim().min(1).max(50).required(),
    class: Joi.forbidden(),
    section: Joi.forbidden(),
    year: Joi.number().required(),
    status: Joi.string().valid('active', 'pending', 'archived'),
    slots: Joi.array().items(slotSchema).min(1).required()
  })
});

const updateTimetableSchema = Joi.object({
  body: Joi.object({
    level: Joi.string().trim().min(1).max(50),
    class: Joi.forbidden(),
    section: Joi.forbidden(),
    year: Joi.number(),
    status: Joi.string().valid('active', 'pending', 'archived'),
    slots: Joi.array().items(slotSchema),
    isActive: Joi.boolean()
  })
});

const getTimetablesSchema = Joi.object({
  query: Joi.object({
    class: Joi.string(),
    section: Joi.string(),
    level: Joi.string().trim().min(1).max(50),
    teacher: objectId,
    childId: objectId,
    view: Joi.string().valid('explorer', 'teacher-personal', 'student-class', 'parent-child'),
    status: Joi.string().valid('active', 'pending', 'archived'),
    year: Joi.number(),
    isActive: Joi.string().valid('true', 'false')
  })
});

module.exports = { createTimetableSchema, updateTimetableSchema, getTimetablesSchema };
