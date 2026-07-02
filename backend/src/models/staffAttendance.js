const mongoose = require('mongoose');

const StaffAttendanceSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: Date, required: true, index: true },
    status: { type: String, enum: ['present', 'absent', 'late', 'leave'], required: true },
    remarks: { type: String },
    markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

StaffAttendanceSchema.index({ user: 1, date: 1 }, { unique: true });
StaffAttendanceSchema.index({ date: 1 });
StaffAttendanceSchema.index({ status: 1, date: 1 });

module.exports = mongoose.model('StaffAttendance', StaffAttendanceSchema);
