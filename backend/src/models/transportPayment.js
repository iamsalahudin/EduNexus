const mongoose = require('mongoose');

const TransportPaymentSchema = new mongoose.Schema(
  {
    enrollment: { type: mongoose.Schema.Types.ObjectId, ref: 'TransportEnrollment', required: true, index: true },
    route: { type: mongoose.Schema.Types.ObjectId, ref: 'TransportRoute', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    subjectRole: { type: String, enum: ['Student', 'Teacher'], required: true, index: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
    periodMonth: { type: Number, required: true, min: 1, max: 12 },
    periodYear: { type: Number, required: true, min: 2000, max: 2200 },
    amountDue: { type: Number, required: true, min: 0 },
    amountPaid: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ['paid', 'pending', 'partial', 'overdue'], default: 'pending', index: true },
    dueDate: { type: Date },
    paidOn: { type: Date },
    remarks: { type: String, trim: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

TransportPaymentSchema.index({ user: 1, periodYear: -1, periodMonth: -1 });
TransportPaymentSchema.index({ status: 1, periodYear: -1, periodMonth: -1 });
TransportPaymentSchema.index({ route: 1, periodYear: -1, periodMonth: -1 });
TransportPaymentSchema.index({ enrollment: 1, periodYear: -1, periodMonth: -1 }, { unique: true });

module.exports = mongoose.model('TransportPayment', TransportPaymentSchema);
