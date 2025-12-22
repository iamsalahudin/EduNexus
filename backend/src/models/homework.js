const mongoose = require('mongoose');

const SubmissionSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  submittedAt: { type: Date, default: Date.now },
  files: { type: [String], default: [] },
  marks: { type: Number },
  feedback: { type: String },
  isLate: { type: Boolean, default: false }
});

const HomeworkSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    class: { type: String, required: true, index: true },
    section: { type: String },
    dueDate: { type: Date, required: true },
    postedDate: { type: Date, default: Date.now },
    attachments: { type: [String], default: [] }, // file URLs or paths
    submissions: { type: [SubmissionSchema], default: [] },
    totalMarks: { type: Number, default: 0 },
    status: { type: String, enum: ['draft', 'published', 'closed'], default: 'draft' }
  },
  { timestamps: true }
);

TimetableSchema.index({ class: 1, dueDate: 1 });
HomeworkSchema.index({ teacher: 1, postedDate: 1 });
HomeworkSchema.index({ status: 1, dueDate: 1 });

module.exports = mongoose.model('Homework', HomeworkSchema);
