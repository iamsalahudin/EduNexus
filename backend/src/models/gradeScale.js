const mongoose = require('mongoose');

// Global grade scale: maps percentage ranges to letter grades
// Applied school-wide or per class-level
const GradeSchema = new mongoose.Schema(
  {
    grade: { type: String, required: true, trim: true }, // A+, A, B+, B, C, D, F, etc.
    minPercentage: { type: Number, required: true, min: 0, max: 100 },
    maxPercentage: { type: Number, required: true, min: 0, max: 100 },
    description: { type: String, trim: true, default: '' }, // e.g., "Excellent", "Very Good"
    points: { type: Number, min: 0 } // GPA points if applicable
  },
  { _id: false }
);

// Validation: min < max
GradeSchema.pre('validate', function(next) {
  if (this.minPercentage >= this.maxPercentage) {
    next(new Error('minPercentage must be less than maxPercentage'));
  } else {
    next();
  }
});

const GradeScaleSchema = new mongoose.Schema(
  {
    // School-wide (no className) or class-specific
    className: { type: String, trim: true, index: true, default: 'SCHOOL' },

    // List of grade bands, ordered by min percentage
    grades: [GradeSchema],

    // Overall passing percentage (across all subjects)
    passingPercentage: { type: Number, min: 0, max: 100, default: 33 },

    // Weighting config: can override per-class if needed
    weights: {
        exam: { type: Number, min: 0, max: 100, default: 40 },
        attendance: { type: Number, min: 0, max: 100, default: 20 },
        homework: { type: Number, min: 0, max: 100, default: 20 },
        gr: { type: Number, min: 0, max: 100, default: 20 }
    },

    // When false, use school-wide defaults; when true, override per-exam
    allowExamLevelOverride: { type: Boolean, default: true },

    active: { type: Boolean, default: true, index: true },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

// Index: school-wide and class-specific configs
GradeScaleSchema.index({ className: 1, active: 1 });

// Unique per className (school-wide or class-specific)
GradeScaleSchema.index({ className: 1 }, { unique: true });

module.exports = mongoose.model('GradeScale', GradeScaleSchema);
