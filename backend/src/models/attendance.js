const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    date: { type: Date, required: true, index: true },
    status: { type: String, enum: ['present', 'absent', 'late', 'excused'], required: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    class: { type: String },
    section: { type: String },
    remarks: { type: String }
  },
  { timestamps: true }
);

AttendanceSchema.index({ student: 1, date: 1 }, { unique: true });
AttendanceSchema.index({ class: 1, date: 1 });
AttendanceSchema.index({ teacher: 1, date: 1 });
AttendanceSchema.index({ date: 1 });

module.exports = mongoose.model('Attendance', AttendanceSchema);
