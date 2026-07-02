const mongoose = require('mongoose');

const TransportRequestSchema = new mongoose.Schema(
  {
    route: { type: mongoose.Schema.Types.ObjectId, ref: 'TransportRoute', required: true, index: true },
    requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    forUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    subjectRole: { type: String, enum: ['Student', 'Teacher'], required: true, index: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'cancelled'], default: 'pending', index: true },
    reason: { type: String, trim: true, maxlength: 1000 },
    reviewNote: { type: String, trim: true, maxlength: 1000 },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date }
  },
  { timestamps: true }
);

TransportRequestSchema.index({ requester: 1, createdAt: -1 });
TransportRequestSchema.index({ forUser: 1, status: 1, createdAt: -1 });
TransportRequestSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('TransportRequest', TransportRequestSchema);
