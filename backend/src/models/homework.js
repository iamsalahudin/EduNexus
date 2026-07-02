const mongoose = require('mongoose');

const FileRefSchema = new mongoose.Schema(
  {
    fileId: { type: mongoose.Schema.Types.ObjectId, ref: 'HomeworkFile', required: true },
    name: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    url: { type: String, required: true }
  },
  { _id: false }
);

const SubmissionSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    studentUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    status: {
      type: String,
      enum: ['draft', 'submitted', 'received', 'returned'],
      default: 'draft',
      index: true
    },

    contentText: { type: String, default: '' },
    files: { type: [FileRefSchema], default: [] },

    submittedAt: { type: Date },
    cancelledAt: { type: Date },
    receivedAt: { type: Date },
    returnedAt: { type: Date },

    marks: { type: Number },
    feedback: { type: String },
    isLate: { type: Boolean, default: false }
  },
  { timestamps: true }
);

const HomeworkSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    subjectName: { type: String },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    teacherName: { type: String },
    class: { type: String, required: true, index: true },
    section: { type: String, required: true, index: true },
    dueDate: { type: Date, required: true },
    postedDate: { type: Date, default: Date.now },
    gradingMode: { type: String, enum: ['none', 'marks'], default: 'none', index: true },
    maxMarks: { type: Number },

    attachments: { type: [FileRefSchema], default: [] },
    submissions: { type: [SubmissionSchema], default: [] },
    lastEditedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    lastEditedAt: { type: Date },
    editHistory: {
      type: [
        {
          editedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
          editorRole: { type: String },
          action: { type: String, default: 'update' },
          note: { type: String, default: '' },
          editedAt: { type: Date, default: Date.now }
        }
      ],
      default: []
    },
    // Backward compatibility: older UI used totalMarks
    totalMarks: { type: Number, default: 0 },
    status: { type: String, enum: ['draft', 'published', 'closed'], default: 'draft' }
  },
  { timestamps: true }
);

HomeworkSchema.index({ class: 1, dueDate: 1 });
HomeworkSchema.index({ class: 1, section: 1, dueDate: 1 });
HomeworkSchema.index({ teacher: 1, postedDate: 1 });
HomeworkSchema.index({ status: 1, dueDate: 1 });
HomeworkSchema.index({ subject: 1, class: 1, section: 1, dueDate: 1 });

module.exports = mongoose.model('Homework', HomeworkSchema);
