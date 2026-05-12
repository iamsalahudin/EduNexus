const mongoose = require('mongoose');

const FeeVoucherBankSchema = new mongoose.Schema(
  {
    bankName: { type: String, trim: true, default: '' },
    account: { type: String, trim: true, default: '' }
  },
  { _id: false }
);

const FeeVoucherTemplateSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, trim: true, default: 'default' },
    schoolName: { type: String, trim: true, default: '' },
    schoolAddress: { type: String, trim: true, default: '' },
    banks: { type: [FeeVoucherBankSchema], default: [] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

FeeVoucherTemplateSchema.index({ key: 1 }, { unique: true });

module.exports = mongoose.model('FeeVoucherTemplate', FeeVoucherTemplateSchema);