const mongoose = require('mongoose');

const FinanceCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, required: true, enum: ['debit', 'credit'], index: true },
    description: { type: String, default: '', trim: true },
    active: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
  },
  { timestamps: true }
);

FinanceCategorySchema.index({ type: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('FinanceCategory', FinanceCategorySchema);