const express = require('express');
const router = express.Router();

const { requireAuth, requireRole } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const controller = require('../controllers/libraryController');
const {
  listBooksSchema,
  createBookSchema,
  updateBookSchema,
  listIssuesSchema,
  issueBookSchema,
  returnBookSchema,
  payFineSchema
} = require('../validators/library');

router.use(requireAuth);

router.get('/books', validate(listBooksSchema), controller.listBooks);
router.post('/books', requireRole('Admin', 'Principal'), validate(createBookSchema), controller.createBook);
router.patch('/books/:id', requireRole('Admin', 'Principal'), validate(updateBookSchema), controller.updateBook);
router.delete('/books/:id', requireRole('Admin', 'Principal'), controller.deleteBook);

router.get('/issues', validate(listIssuesSchema), controller.listIssues);
router.post('/issues', requireRole('Admin', 'Principal'), validate(issueBookSchema), controller.issueBook);
router.patch('/issues/:id/return', requireRole('Admin', 'Principal'), validate(returnBookSchema), controller.returnBook);

router.get('/fines', controller.listFines);
router.patch('/fines/:id/pay', requireRole('Admin', 'Principal'), validate(payFineSchema), controller.payFine);

module.exports = router;
