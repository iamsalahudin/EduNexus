const mongoose = require('mongoose');

const AttendanceLeaveRequestSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fromDate: { type: Date, required: true },
    toDate: { type: Date, required: true },
    type: { type: String, enum: ['full-day', 'half-day'], default: 'full-day' },
    reason: { type: String, trim: true, maxlength: 1000, default: '' },
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'cancelled'], default: 'pending' },
    approver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approverRemarks: { type: String, maxlength: 1000, default: '' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('AttendanceLeaveRequest', AttendanceLeaveRequestSchema);
