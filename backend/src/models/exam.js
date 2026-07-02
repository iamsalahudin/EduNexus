const mongoose = require('mongoose');

const ExamSubjectSchema = new mongoose.Schema(
  {
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
    date: { type: Date },
    startTime: { type: String, trim: true },
    durationMinutes: { type: Number, min: 1 },
    maxMarks: { type: Number, min: 1 },
    passingMarks: { type: Number, min: 0 },
    theoryMax: { type: Number, min: 0 },
    practicalMax: { type: Number, min: 0 }
  },
  { _id: false }
);

const ExamSchema = new mongoose.Schema(
  {
    className: { type: String, required: true, trim: true, index: true },
    type: { type: String, enum: ['monthly', 'mid', 'final', 'custom'], required: true, index: true },
    name: { type: String, required: true, trim: true },

    academicYear: {
      startMonth: { type: Number, min: 1, max: 12, default: 1 },
      endMonth: { type: Number, min: 1, max: 12, default: 12 },
      yearLabel: { type: String, trim: true }
    },

    month: { type: Number, min: 1, max: 12 },
    year: { type: Number, min: 1970, max: 3000, required: true, index: true },

    instructions: { type: String, trim: true, default: '' },

    subjects: { type: [ExamSubjectSchema], default: [] },

    marksEntry: {
      locked: { type: Boolean, default: false },
      uploadOpensAt: { type: Date },
      uploadClosesAt: { type: Date }
    },

    status: {
      type: String,
      enum: ['draft', 'open', 'locked', 'submitted', 'approved', 'published'],
      default: 'draft',
      index: true
    },

    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    submittedAt: { type: Date },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    publishedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    publishedAt: { type: Date },

    isArchived: { type: Boolean, default: false, index: true },
    archivedAt: { type: Date },
    archivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // Result computation weights: exam%, attendance%, homework%, gr%
    // Must sum to 100. Lock after publishedAt change.
    resultWeights: {
      exam: { type: Number, min: 0, max: 100, default: 40 },
      attendance: { type: Number, min: 0, max: 100, default: 20 },
      homework: { type: Number, min: 0, max: 100, default: 20 },
      gr: { type: Number, min: 0, max: 100, default: 20 }
    },

    // General Report (GR): max marks for performance scoring (editable per exam)
    // Becomes immutable after result publish
    grMaxMarks: { type: Number, min: 1, default: 100 },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

ExamSchema.index({ className: 1, type: 1, year: 1, month: 1 });
// Prevent duplicate drafts for the same exam key (className + type + year + month-for-monthly).
// This guards against double-clicks / concurrent requests creating multiple drafts.
ExamSchema.index(
  { className: 1, type: 1, year: 1, month: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'draft', isArchived: false }
  }
);

// Validate that result weights sum to 100 when exam is published
ExamSchema.pre('save', function(next) {
  if (this.publishedAt) {
    const weightSum = (this.resultWeights.exam || 0) +
                      (this.resultWeights.attendance || 0) +
                      (this.resultWeights.homework || 0) +
                      (this.resultWeights.gr || 0);
    
    if (Math.abs(weightSum - 100) > 0.01) {
      return next(new Error(`Result weights must sum to 100. Current sum: ${weightSum}`));
    }
  }
  next();
});

module.exports = mongoose.model('Exam', ExamSchema);
