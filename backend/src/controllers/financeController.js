const { FinanceSetting } = require('../models');

function isFinanceAdmin(user) {
  return user?.role === 'Admin' || user?.role === 'Principal' || user?.role === 'Finance';
}

function getDefaultFiscalYear() {
  const today = new Date();
  const year = today.getFullYear();
  const fiscalStart = today.getMonth() >= 6 ? year : year - 1;
  return `${fiscalStart}-${fiscalStart + 1}`;
}

async function readFinanceSettings(req, res, next) {
  try {
    let settings = await FinanceSetting.findOne({ key: 'default' }).lean();

    if (!settings) {
      settings = {
        key: 'default',
        fiscalYear: getDefaultFiscalYear(),
        currency: 'PKR',
        defaultIncomeCategory: 'Tuition Fees',
        defaultExpenseCategory: 'Operational Expenses',
        defaultLiabilityCategory: 'Outstanding Dues'
      };
    }

    res.json({ settings });
  } catch (err) {
    next(err);
  }
}

async function updateFinanceSettings(req, res, next) {
  try {
    if (!isFinanceAdmin(req.user)) {
      return res.status(403).json({ error: 'Only Admin, Principal, or Finance users can update finance settings' });
    }

    const payload = {
      key: 'default',
      fiscalYear: String(req.body?.fiscalYear || '').trim() || getDefaultFiscalYear(),
      currency: String(req.body?.currency || '').trim() || 'PKR',
      defaultIncomeCategory: String(req.body?.defaultIncomeCategory || '').trim() || 'Tuition Fees',
      defaultExpenseCategory: String(req.body?.defaultExpenseCategory || '').trim() || 'Operational Expenses',
      defaultLiabilityCategory: String(req.body?.defaultLiabilityCategory || '').trim() || 'Outstanding Dues',
      updatedBy: req.user?.id || null
    };

    const settings = await FinanceSetting.findOneAndUpdate(
      { key: 'default' },
      { $set: payload },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();

    res.json({ settings });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  readFinanceSettings,
  updateFinanceSettings
};