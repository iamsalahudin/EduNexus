const Joi = require('joi');

const createTimetableSchema = Joi.object({
  body: Joi.object({
    class: Joi.string().required(),
    section: Joi.string(),
    year: Joi.number().required(),
    slots: Joi.array()
      .items(
        Joi.object({
          day: Joi.string().valid('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday').required(),
          startTime: Joi.string().required(),
          endTime: Joi.string().required(),
          subject: Joi.string(),
          teacher: Joi.string(),
          class: Joi.string(),
          section: Joi.string(),
          room: Joi.string()
        })
      )
      .min(1)
      .required()
  })
});

const updateTimetableSchema = Joi.object({
  body: Joi.object({
    slots: Joi.array().items(
      Joi.object({
        day: Joi.string().valid('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday').required(),
        startTime: Joi.string().required(),
        endTime: Joi.string().required(),
        subject: Joi.string(),
        teacher: Joi.string(),
        class: Joi.string(),
        section: Joi.string(),
        room: Joi.string()
      })
    ),
    isActive: Joi.boolean()
  })
});

const getTimetablesSchema = Joi.object({
  query: Joi.object({
    class: Joi.string(),
    section: Joi.string(),
    year: Joi.number(),
    isActive: Joi.string().valid('true', 'false')
  })
});

module.exports = { createTimetableSchema, updateTimetableSchema, getTimetablesSchema };
