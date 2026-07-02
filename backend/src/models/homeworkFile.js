const mongoose = require('mongoose');

const HomeworkFileSchema = new mongoose.Schema(
  {
    homework: { type: mongoose.Schema.Types.ObjectId, ref: 'Homework', required: true, index: true },

    // Who uploaded the file (teacher or student user)
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    // For submission files, link to a student record (optional for teacher attachments)
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', index: true },

    kind: { type: String, enum: ['teacher-attachment', 'student-submission'], required: true, index: true },

    filename: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    data: { type: Buffer, required: true },

    meta: { type: mongoose.Schema.Types.Mixed }
  },
  { timestamps: true }
);

HomeworkFileSchema.index({ homework: 1, kind: 1, createdAt: -1 });

module.exports = mongoose.model('HomeworkFile', HomeworkFileSchema);
