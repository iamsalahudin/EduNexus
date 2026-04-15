const mongoose = require('mongoose');

const TransportEnrollmentSchema = new mongoose.Schema(
  {
    route: { type: mongoose.Schema.Types.ObjectId, ref: 'TransportRoute', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    subjectRole: { type: String, enum: ['Student', 'Teacher'], required: true, index: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
    status: { type: String, enum: ['enrolled', 'inactive'], default: 'enrolled', index: true },
    notes: { type: String, trim: true },
    enrolledOn: { type: Date, default: Date.now },
    deactivatedOn: { type: Date },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

TransportEnrollmentSchema.index({ user: 1, status: 1 });
TransportEnrollmentSchema.index({ student: 1, status: 1 });
TransportEnrollmentSchema.index({ teacher: 1, status: 1 });
TransportEnrollmentSchema.index({ route: 1, status: 1 });

module.exports = mongoose.model('TransportEnrollment', TransportEnrollmentSchema);
