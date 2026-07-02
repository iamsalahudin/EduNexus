const mongoose = require('mongoose');

const FinanceLiabilitySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    debtorName: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    outstandingAmount: { type: Number, required: true, min: 0 },
    incurredDate: { type: Date, required: true, default: Date.now, index: true },
    status: { type: String, enum: ['open', 'closed'], default: 'open', index: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'FinanceCategory', default: null },
    categoryName: { type: String, default: '', trim: true },
    note: { type: String, default: '', trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
  },
  { timestamps: true }
);

FinanceLiabilitySchema.index({ incurredDate: -1, createdAt: -1 });

module.exports = mongoose.model('FinanceLiability', FinanceLiabilitySchema);