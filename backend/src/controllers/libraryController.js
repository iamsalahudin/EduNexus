const mongoose = require('mongoose');
const { LibraryBook, LibraryIssue, Student } = require('../models');

function toObjectId(value) {
  try {
    return new mongoose.Types.ObjectId(value);
  } catch {
    return null;
  }
}

function normalizeIssue(issue) {
  const now = new Date();
  if (issue.status === 'issued' && issue.dueDate && new Date(issue.dueDate) < now) {
    issue.status = 'overdue';
  }
  return issue;
}

async function listBooks(req, res, next) {
  try {
    const { q, active } = req.query;
    const filter = {};
    if (typeof active !== 'undefined') filter.active = String(active) === 'true';
    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { author: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } }
      ];
    }

    const books = await LibraryBook.find(filter).sort({ title: 1 }).lean();
    res.json({ books });
  } catch (err) {
    next(err);
  }
}

async function createBook(req, res, next) {
  try {
    const { title, author, isbn, category, shelf, totalCopies, active } = req.body;
    const copies = Number(totalCopies || 1);
    const book = await LibraryBook.create({
      title,
      author,
      isbn,
      category,
      shelf,
      totalCopies: copies,
      availableCopies: copies,
      active,
      createdBy: req.user.id,
      updatedBy: req.user.id
    });
    res.status(201).json({ book });
  } catch (err) {
    if (err?.code === 11000) return res.status(409).json({ error: 'Book with this ISBN already exists' });
    next(err);
  }
}

async function updateBook(req, res, next) {
  try {
    const id = toObjectId(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid book id' });

    const existing = await LibraryBook.findById(id);
    if (!existing) return res.status(404).json({ error: 'Book not found' });

    const update = { ...req.body, updatedBy: req.user.id };
    if (typeof update.totalCopies !== 'undefined') {
      const nextTotal = Number(update.totalCopies);
      const borrowed = Math.max(0, Number(existing.totalCopies || 0) - Number(existing.availableCopies || 0));
      if (nextTotal < borrowed) {
        return res.status(400).json({ error: 'totalCopies cannot be less than currently issued copies' });
      }
      update.availableCopies = nextTotal - borrowed;
    }

    const book = await LibraryBook.findByIdAndUpdate(id, update, { new: true, runValidators: true });
    res.json({ book });
  } catch (err) {
    if (err?.code === 11000) return res.status(409).json({ error: 'Book with this ISBN already exists' });
    next(err);
  }
}

async function deleteBook(req, res, next) {
  try {
    const id = toObjectId(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid book id' });

    const activeIssues = await LibraryIssue.countDocuments({ book: id, status: { $in: ['issued', 'overdue'] } });
    if (activeIssues > 0) {
      return res.status(400).json({ error: 'Cannot delete a book that has active issues' });
    }

    await LibraryBook.findByIdAndDelete(id);
    await LibraryIssue.deleteMany({ book: id });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

async function listIssues(req, res, next) {
  try {
    const { status, studentId, bookId } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (studentId) filter.student = studentId;
    if (bookId) filter.book = bookId;

    let issues = await LibraryIssue.find(filter)
      .sort({ createdAt: -1 })
      .populate('book', 'title author category')
      .populate('student', 'name studentId class section')
      .lean();

    issues = issues.map(normalizeIssue);
    res.json({ issues });
  } catch (err) {
    next(err);
  }
}

async function issueBook(req, res, next) {
  try {
    const { bookId, studentId, issueDate, dueDate, notes } = req.body;
    const book = await LibraryBook.findById(bookId);
    if (!book) return res.status(404).json({ error: 'Book not found' });
    if (!book.active) return res.status(400).json({ error: 'Book is inactive' });
    if ((book.availableCopies || 0) < 1) return res.status(400).json({ error: 'No available copies left' });

    const student = await Student.findById(studentId).select('_id');
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const issue = await LibraryIssue.create({
      book: book._id,
      student: student._id,
      issueDate: issueDate ? new Date(issueDate) : new Date(),
      dueDate: new Date(dueDate),
      status: 'issued',
      notes,
      issuedBy: req.user.id
    });

    book.availableCopies = Math.max(0, Number(book.availableCopies || 0) - 1);
    await book.save();

    const populated = await LibraryIssue.findById(issue._id)
      .populate('book', 'title author category')
      .populate('student', 'name studentId class section');

    res.status(201).json({ issue: populated });
  } catch (err) {
    next(err);
  }
}

async function returnBook(req, res, next) {
  try {
    const id = toObjectId(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid issue id' });

    const issue = await LibraryIssue.findById(id);
    if (!issue) return res.status(404).json({ error: 'Issue not found' });
    if (issue.status === 'returned') return res.status(400).json({ error: 'Book already returned' });

    issue.returnDate = req.body.returnDate ? new Date(req.body.returnDate) : new Date();
    issue.fineAmount = Number(req.body.fineAmount || 0);
    issue.notes = req.body.notes || issue.notes;
    issue.status = 'returned';
    issue.receivedBy = req.user.id;
    await issue.save();

    const book = await LibraryBook.findById(issue.book);
    if (book) {
      book.availableCopies = Math.min(Number(book.totalCopies || 0), Number(book.availableCopies || 0) + 1);
      await book.save();
    }

    const populated = await LibraryIssue.findById(id)
      .populate('book', 'title author category')
      .populate('student', 'name studentId class section');

    res.json({ issue: populated });
  } catch (err) {
    next(err);
  }
}

async function listFines(req, res, next) {
  try {
    const issues = await LibraryIssue.find({ fineAmount: { $gt: 0 } })
      .sort({ updatedAt: -1 })
      .populate('book', 'title')
      .populate('student', 'name studentId class section')
      .lean();

    const fines = issues.map((issue) => ({
      ...issue,
      pendingFine: Math.max(0, Number(issue.fineAmount || 0) - Number(issue.finePaidAmount || 0))
    }));

    const totals = fines.reduce(
      (acc, row) => {
        acc.fineAmount += Number(row.fineAmount || 0);
        acc.finePaid += Number(row.finePaidAmount || 0);
        acc.pending += Number(row.pendingFine || 0);
        return acc;
      },
      { fineAmount: 0, finePaid: 0, pending: 0 }
    );

    res.json({ fines, totals });
  } catch (err) {
    next(err);
  }
}

async function payFine(req, res, next) {
  try {
    const id = toObjectId(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid issue id' });

    const issue = await LibraryIssue.findById(id);
    if (!issue) return res.status(404).json({ error: 'Issue not found' });

    const amount = Number(req.body.amount || 0);
    const nextPaid = Number(issue.finePaidAmount || 0) + amount;
    if (nextPaid > Number(issue.fineAmount || 0)) {
      return res.status(400).json({ error: 'Payment exceeds pending fine' });
    }

    issue.finePaidAmount = nextPaid;
    await issue.save();

    res.json({ issue });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listBooks,
  createBook,
  updateBook,
  deleteBook,
  listIssues,
  issueBook,
  returnBook,
  listFines,
  payFine
};
