const mongoose = require('mongoose');

const SubjectResultSchema = new mongoose.Schema({
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  marks: { type: Number },
  grade: { type: String },
  remarks: { type: String }
});

const ReportCardSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    term: { type: String, required: true },
    year: { type: Number, required: true },
    subjects: { type: [SubjectResultSchema], default: [] },
    totalMarks: { type: Number },
    percentage: { type: Number },
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
    archived: { type: Boolean, default: false, index: true },
    archivedAt: { type: Date },
    archivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date }
  },
  { timestamps: true }
);

ReportCardSchema.index({ student: 1, term: 1, year: 1 }, { unique: true });
ReportCardSchema.index({ status: 1, year: 1 });
ReportCardSchema.index({ archived: 1, year: 1, status: 1 });

module.exports = mongoose.model('ReportCard', ReportCardSchema);
