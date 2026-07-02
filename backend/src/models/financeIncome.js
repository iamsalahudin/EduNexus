const mongoose = require('mongoose');

const FinanceIncomeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'FinanceCategory', default: null, index: true },
    categoryName: { type: String, default: '', trim: true },
    incomeType: {
      type: String,
      enum: ['fee', 'fine', 'liability-intake', 'other'],
      default: 'other',
      index: true
    },
    incomeDate: { type: Date, required: true, default: Date.now, index: true },
    note: { type: String, default: '', trim: true },
    sourceRef: { type: mongoose.Schema.Types.ObjectId, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
  },
  { timestamps: true }
);

FinanceIncomeSchema.index({ incomeDate: -1, createdAt: -1 });

module.exports = mongoose.model('FinanceIncome', FinanceIncomeSchema);