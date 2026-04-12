const mongoose = require('mongoose');

const StudentCertificateSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['transfer', 'slc'],
      required: true,
      index: true
    },
    certificateNumber: { type: String, required: true, unique: true, index: true },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true
    },
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    issueDate: { type: Date, required: true },
    studentSnapshot: {
      userName: { type: String },
      studentId: { type: String },
      registrationNumber: { type: String },
      class: { type: String },
      section: { type: String }
    },
    data: {
      reason: { type: String },
      remarks: { type: String },
      conduct: { type: String },
      leavingDate: { type: Date }
    },
    pdf: {
      fileName: { type: String, required: true },
      relativePath: { type: String, required: true },
      mimeType: { type: String, default: 'application/pdf' },
      fileSizeBytes: { type: Number, default: 0 }
    },
    status: {
      type: String,
      enum: ['active', 'revoked'],
      default: 'active'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('StudentCertificate', StudentCertificateSchema);
