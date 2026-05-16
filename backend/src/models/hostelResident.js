const mongoose = require('mongoose');

const HostelResidentSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    hostel: { type: mongoose.Schema.Types.ObjectId, ref: 'Hostel', required: true, index: true },
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'HostelRoom', required: true, index: true },
    joinDate: { type: Date, default: Date.now },
    leaveDate: { type: Date },
    status: { type: String, enum: ['active', 'left'], default: 'active', index: true },
    notes: { type: String, trim: true, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

HostelResidentSchema.index({ student: 1, status: 1 });

module.exports = mongoose.model('HostelResident', HostelResidentSchema);
