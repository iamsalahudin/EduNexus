const mongoose = require('mongoose');

const FinanceLiabilityRepaymentSchema = new mongoose.Schema(
  {
    liability: { type: mongoose.Schema.Types.ObjectId, ref: 'FinanceLiability', required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    paymentDate: { type: Date, required: true, default: Date.now, index: true },
    paymentMethod: {
      type: String,
      enum: ['cash', 'bank', 'online', 'card', 'other'],
      default: 'cash'
    },
    note: { type: String, default: '', trim: true },
    linkedExpense: { type: mongoose.Schema.Types.ObjectId, ref: 'FinanceExpense', default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
  },
  { timestamps: true }
);

FinanceLiabilityRepaymentSchema.index({ liability: 1, paymentDate: -1 });

module.exports = mongoose.model('FinanceLiabilityRepayment', FinanceLiabilityRepaymentSchema);