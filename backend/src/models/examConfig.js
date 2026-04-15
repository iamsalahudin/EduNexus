const mongoose = require('mongoose');

const ExamConfigSchema = new mongoose.Schema(
  {
    className: { type: String, required: true, unique: true, trim: true, index: true },

    academicYear: {
      preset: {
        type: String,
        enum: ['jan-dec', 'apr-mar', 'sep-aug', 'custom'],
        default: 'jan-dec'
      },
      startMonth: { type: Number, min: 1, max: 12, default: 1 },
      endMonth: { type: Number, min: 1, max: 12, default: 12 }
    },

    examTypes: {
      monthly: {
        enabled: { type: Boolean, default: true },
        months: { type: [Number], default: [1,2,3,4,5,6,7,8,9,10,11,12] }
      },
      mid: { enabled: { type: Boolean, default: true } },
      final: { enabled: { type: Boolean, default: true } }
    },

    structure: {
      subjectWiseMarks: { type: Boolean, default: true },
      theoryPracticalSplit: { type: Boolean, default: false },
      defaultMaxMarks: { type: Number, min: 1, default: 100 },
      defaultPassingMarks: { type: Number, min: 0, default: 33 },
      overallPassPercentage: { type: Number, min: 0, max: 100, default: 33 },
      gradingSystem: { type: String, enum: ['marks', 'grades', 'hybrid'], default: 'marks' },
      weightage: {
        monthly: { type: Number, min: 0, max: 100, default: 20 },
        mid: { type: Number, min: 0, max: 100, default: 30 },
        final: { type: Number, min: 0, max: 100, default: 50 }
      }
    },

    visibility: {
      studentVisibility: { type: String, enum: ['beforeApproval', 'afterApproval'], default: 'afterApproval' },
      parentVisible: { type: Boolean, default: true },
      showSubjectMarks: { type: Boolean, default: true }
    },

    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

ExamConfigSchema.index({ className: 1 }, { unique: true });

module.exports = mongoose.model('ExamConfig', ExamConfigSchema);
