const mongoose = require('mongoose');

const SyllabusSchema = new mongoose.Schema(
  {
    className: { type: String, required: true, trim: true, index: true },
    subjectName: { type: String, required: true, trim: true, index: true },
    title: { type: String, required: true, trim: true },
    academicYear: { type: String, trim: true, default: '' },
    term: {
      type: String,
      enum: ['annual', 'monthly', 'term-1', 'term-2', 'term-3', 'custom'],
      default: 'annual',
      index: true
    },
    chapters: { type: [String], default: [] },
    status: { type: String, enum: ['draft', 'active', 'completed'], default: 'draft', index: true },
    notes: { type: String, trim: true, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

SyllabusSchema.index({ className: 1, subjectName: 1, title: 1 });

module.exports = mongoose.model('Syllabus', SyllabusSchema);