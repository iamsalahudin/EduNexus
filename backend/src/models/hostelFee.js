const mongoose = require('mongoose');

const HostelFeeSchema = new mongoose.Schema(
  {
    resident: { type: mongoose.Schema.Types.ObjectId, ref: 'HostelResident', required: true, index: true },
    amount: { type: Number, min: 0, required: true },
    paidAmount: { type: Number, min: 0, default: 0 },
    month: { type: Number, min: 1, max: 12, required: true },
    year: { type: Number, min: 2000, required: true },
    dueDate: { type: Date, required: true },
    paidDate: { type: Date },
    status: { type: String, enum: ['pending', 'partial', 'paid'], default: 'pending', index: true },
    notes: { type: String, trim: true, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

HostelFeeSchema.index({ month: 1, year: 1, status: 1 });
HostelFeeSchema.index({ resident: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('HostelFee', HostelFeeSchema);
