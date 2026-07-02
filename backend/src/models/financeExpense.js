const mongoose = require('mongoose');

const FinanceExpenseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'FinanceCategory', default: null, index: true },
    categoryName: { type: String, default: '', trim: true },
    paymentMethod: {
      type: String,
      enum: ['cash', 'bank', 'online', 'card', 'other'],
      default: 'cash'
    },
    expenseDate: { type: Date, required: true, default: Date.now, index: true },
    note: { type: String, default: '', trim: true },
    source: { type: String, default: 'manual', trim: true },
    sourceRef: { type: mongoose.Schema.Types.ObjectId, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
  },
  { timestamps: true }
);

FinanceExpenseSchema.index({ expenseDate: -1, createdAt: -1 });

module.exports = mongoose.model('FinanceExpense', FinanceExpenseSchema);