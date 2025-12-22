const Joi = require('joi');

const createHomeworkSchema = Joi.object({
  body: Joi.object({
    title: Joi.string().required(),
    description: Joi.string(),
    subject: Joi.string().required(),
    class: Joi.string().required(),
    section: Joi.string(),
    dueDate: Joi.date().required(),
    attachments: Joi.array().items(Joi.string()),
    totalMarks: Joi.number()
  })
});

const submitHomeworkSchema = Joi.object({
  body: Joi.object({
    files: Joi.array().items(Joi.string())
  })
});

const gradeSubmissionSchema = Joi.object({
  body: Joi.object({
    submissionStudentId: Joi.string().required(),
    marks: Joi.number().min(0),
    feedback: Joi.string().max(500)
  })
});

const updateHomeworkSchema = Joi.object({
  body: Joi.object({
    title: Joi.string(),
    description: Joi.string(),
    dueDate: Joi.date(),
    status: Joi.string().valid('draft', 'published', 'closed')
  })
});

const getHomeworksQuerySchema = Joi.object({
  query: Joi.object({
    class: Joi.string(),
    status: Joi.string().valid('draft', 'published', 'closed'),
    subject: Joi.string()
  })
});

module.exports = { createHomeworkSchema, submitHomeworkSchema, gradeSubmissionSchema, updateHomeworkSchema, getHomeworksQuerySchema };
