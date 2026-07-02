const mongoose = require('mongoose')

const AttendanceAssignmentSchema = new mongoose.Schema(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    className: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    section: {
      type: String,
      default: '',
      trim: true,
      index: true,
    },
  },
  { timestamps: true }
)

AttendanceAssignmentSchema.index({ className: 1, section: 1 }, { unique: true })
AttendanceAssignmentSchema.index({ teacher: 1, className: 1, section: 1 }, { unique: true })

module.exports = mongoose.model('AttendanceAssignment', AttendanceAssignmentSchema)