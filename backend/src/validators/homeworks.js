const Joi = require('joi');

const createHomeworkSchema = Joi.object({
  body: Joi.object({
    title: Joi.string().required(),
    description: Joi.string(),
    subject: Joi.string().required(),
    class: Joi.string().required(),
    section: Joi.string().required(),
    dueDate: Joi.date().required(),
    gradingMode: Joi.string().valid('none', 'marks').default('none'),
    maxMarks: Joi.number().min(0)
  })
});

const updateDraftSchema = Joi.object({
  body: Joi.object({
    contentText: Joi.string().allow('').max(10000)
  })
});

const receiveSubmissionSchema = Joi.object({
  body: Joi.object({
    submissionStudentId: Joi.string().required()
  })
});

const returnSubmissionSchema = Joi.object({
  body: Joi.object({
    submissionStudentId: Joi.string().required(),
    marks: Joi.number().min(0),
    feedback: Joi.string().allow('').max(5000)
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
    section: Joi.string(),
    status: Joi.string().valid('draft', 'published', 'closed'),
    subject: Joi.string(),
    sortBy: Joi.string().valid('dueDate', 'teacher', 'subject', 'postedDate'),
    order: Joi.string().valid('asc', 'desc')
  })
});

const homeworkAuditQuerySchema = Joi.object({
  query: Joi.object({
    class: Joi.string(),
    section: Joi.string(),
    teacherId: Joi.string(),
    subject: Joi.string(),
    fromDate: Joi.date(),
    toDate: Joi.date()
  })
});

module.exports = {
  createHomeworkSchema,
  updateHomeworkSchema,
  getHomeworksQuerySchema,
  homeworkAuditQuerySchema,
  updateDraftSchema,
  receiveSubmissionSchema,
  returnSubmissionSchema
};
