const mongoose = require('mongoose');

const FinanceSettingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: 'default', trim: true },
    fiscalYear: { type: String, trim: true, default: '' },
    currency: { type: String, trim: true, default: 'PKR' },
    defaultIncomeCategory: { type: String, trim: true, default: 'Tuition Fees' },
    defaultExpenseCategory: { type: String, trim: true, default: 'Operational Expenses' },
    defaultLiabilityCategory: { type: String, trim: true, default: 'Outstanding Dues' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('FinanceSetting', FinanceSettingSchema);