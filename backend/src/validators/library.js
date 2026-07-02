const Joi = require('joi');

const listBooksSchema = Joi.object({
  query: Joi.object({
    q: Joi.string().allow('').optional(),
    active: Joi.boolean().optional()
  })
});

const createBookSchema = Joi.object({
  body: Joi.object({
    title: Joi.string().trim().min(1).max(200).required(),
    author: Joi.string().allow('').max(120).default(''),
    isbn: Joi.string().allow('').max(60).default(''),
    category: Joi.string().allow('').max(80).default(''),
    shelf: Joi.string().allow('').max(80).default(''),
    totalCopies: Joi.number().integer().min(1).default(1),
    active: Joi.boolean().default(true)
  })
});

const updateBookSchema = Joi.object({
  body: Joi.object({
    title: Joi.string().trim().min(1).max(200).optional(),
    author: Joi.string().allow('').max(120).optional(),
    isbn: Joi.string().allow('').max(60).optional(),
    category: Joi.string().allow('').max(80).optional(),
    shelf: Joi.string().allow('').max(80).optional(),
    totalCopies: Joi.number().integer().min(1).optional(),
    active: Joi.boolean().optional()
  }).min(1)
});

const listIssuesSchema = Joi.object({
  query: Joi.object({
    status: Joi.string().valid('issued', 'returned', 'overdue').optional(),
    studentId: Joi.string().optional(),
    bookId: Joi.string().optional()
  })
});

const issueBookSchema = Joi.object({
  body: Joi.object({
    bookId: Joi.string().required(),
    studentId: Joi.string().required(),
    issueDate: Joi.date().iso().optional(),
    dueDate: Joi.date().iso().required(),
    notes: Joi.string().allow('').max(500).default('')
  })
});

const returnBookSchema = Joi.object({
  body: Joi.object({
    returnDate: Joi.date().iso().optional(),
    fineAmount: Joi.number().min(0).default(0),
    notes: Joi.string().allow('').max(500).default('')
  })
});

const payFineSchema = Joi.object({
  body: Joi.object({
    amount: Joi.number().min(0.01).required()
  })
});

module.exports = {
  listBooksSchema,
  createBookSchema,
  updateBookSchema,
  listIssuesSchema,
  issueBookSchema,
  returnBookSchema,
  payFineSchema
};
