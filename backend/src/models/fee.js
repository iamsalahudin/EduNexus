const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  method: { type: String },
  transactionId: { type: String },
  paidAt: { type: Date }
});

const FeeSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    amount: { type: Number, required: true },
    dueDate: { type: Date },
    status: { type: String, enum: ['pending', 'paid', 'overdue'], default: 'pending' },
    payments: { type: [PaymentSchema], default: [] },
    notes: { type: String }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Fee', FeeSchema);
