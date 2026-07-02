const mongoose = require('mongoose');

const LibraryIssueSchema = new mongoose.Schema(
  {
    book: { type: mongoose.Schema.Types.ObjectId, ref: 'LibraryBook', required: true, index: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    issueDate: { type: Date, required: true, default: Date.now },
    dueDate: { type: Date, required: true },
    returnDate: { type: Date },
    status: {
      type: String,
      enum: ['issued', 'returned', 'overdue'],
      default: 'issued',
      index: true
    },
    fineAmount: { type: Number, min: 0, default: 0 },
    finePaidAmount: { type: Number, min: 0, default: 0 },
    notes: { type: String, trim: true, default: '' },
    issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

LibraryIssueSchema.index({ status: 1, dueDate: 1 });
LibraryIssueSchema.index({ student: 1, createdAt: -1 });

module.exports = mongoose.model('LibraryIssue', LibraryIssueSchema);
