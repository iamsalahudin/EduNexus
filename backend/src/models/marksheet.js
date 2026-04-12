const mongoose = require('mongoose');

// Per-student row in a marksheet: holds marks per subject and GR mark
const StudentMarkRowSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    subjectMarks: [
      {
        subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
        marks: { type: Number, min: 0 },
        theoryMarks: { type: Number, min: 0 },
        practicalMarks: { type: Number, min: 0 }
      }
    ],
    // General Report: performance marks (editable by admin/principal/class-teacher)
    grPerformanceMarks: { type: Number, min: 0, default: 0 },
    // Teacher comments on this student's overall performance
    teacherComments: { type: String, trim: true, default: '' },
    updatedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const MarksheetSchema = new mongoose.Schema(
  {
    // Unique key: exam + class + section
    exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true, index: true },
    className: { type: String, required: true, index: true },
    section: { type: String, required: true, index: true },

    // One marksheet per (exam, class, section)
    // Compound unique index enforced below

    // Snapshot of subject list at marksheet creation time
    subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }],

    // Default max marks per subject (from ExamConfig or override)
    subjectMaxMarks: {
      type: Map,
      of: Number,
      default: new Map()
    },

    // Student rows: automatically populated at creation
    studentRows: [StudentMarkRowSchema],

    // Marksheet status workflow
    status: {
      type: String,
      enum: ['draft', 'in-progress', 'locked', 'published'],
      default: 'draft',
      index: true
    },

    // Lock metadata: Admin/Principal prevents teacher updates when locked
    locked: { type: Boolean, default: false, index: true },
    lockedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    lockedAt: { type: Date },

    // Publish metadata: publish creates ReportCard records
    published: { type: Boolean, default: false, index: true },
    publishedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    publishedAt: { type: Date },

    // Audit trail
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

// Unique index: one marksheet per (exam, class, section)
MarksheetSchema.index({ exam: 1, className: 1, section: 1 }, { unique: true });

// Indexes for queries
MarksheetSchema.index({ exam: 1, status: 1 });
MarksheetSchema.index({ className: 1, section: 1 });
MarksheetSchema.index({ locked: 1, published: 1 });

module.exports = mongoose.model('Marksheet', MarksheetSchema);
