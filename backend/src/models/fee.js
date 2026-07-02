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
    source: { type: String, enum: ['manual', 'admission', 'monthly'], default: 'manual', index: true },
    cycleMonth: { type: String, trim: true, index: true },
    baseAmount: { type: Number, default: 0 },
    concessionPercent: { type: Number, default: 0 },
    amount: { type: Number, required: true },
    dueDate: { type: Date },
    status: { type: String, enum: ['pending', 'paid', 'overdue'], default: 'pending' },
    payments: { type: [PaymentSchema], default: [] },
    notes: { type: String }
  },
  { timestamps: true }
);

FeeSchema.index({ student: 1, cycleMonth: 1 }, { unique: true, partialFilterExpression: { cycleMonth: { $exists: true, $type: 'string' } } });

module.exports = mongoose.model('Fee', FeeSchema);
