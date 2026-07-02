const {
  FinanceCategory,
  FinanceExpense,
  FinanceIncome,
  FinanceLiability,
  FinanceLiabilityRepayment
} = require('../models');

function normalizeText(value) {
  return String(value || '').trim();
}

function toNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function dateRangeFilter(startDate, endDate, fieldName) {
  const filter = {};
  if (startDate) filter.$gte = new Date(startDate);
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    filter.$lte = end;
  }
  if (!Object.keys(filter).length) return {};
  return { [fieldName]: filter };
}

async function resolveCategory(categoryId) {
  const id = normalizeText(categoryId);
  if (!id) return null;
  const category = await FinanceCategory.findById(id).lean();
  if (!category) {
    const error = new Error('Finance category not found');
    error.statusCode = 400;
    throw error;
  }
  return category;
}

async function ensureDefaultCategories() {
  const defaults = [
    { name: 'Tuition Fees', type: 'credit', description: 'Standard tuition income' },
    { name: 'Liability Intake', type: 'credit', description: 'Debt and liability intake income' },
    { name: 'Operational Expenses', type: 'debit', description: 'Regular school operations expense' },
    { name: 'Transport Expenses', type: 'debit', description: 'Transport and fuel related expense' },
    { name: 'Liability Repayment', type: 'debit', description: 'Debt and liability repayment expense' }
  ];

  await Promise.all(defaults.map(async (row) => {
    await FinanceCategory.updateOne(
      { name: row.name, type: row.type },
      {
        $setOnInsert: {
          name: row.name,
          type: row.type,
          description: row.description,
          active: true,
          createdBy: null,
          updatedBy: null
        }
      },
      { upsert: true }
    );
  }));
}

async function listCategories(req, res, next) {
  try {
    await ensureDefaultCategories();
    const { q, type, active } = req.query;
    const filter = {};
    if (normalizeText(type)) filter.type = type;
    if (active === 'true') filter.active = true;
    if (active === 'false') filter.active = false;

    const text = normalizeText(q);
    if (text) {
      filter.$or = [
        { name: { $regex: text, $options: 'i' } },
        { description: { $regex: text, $options: 'i' } }
      ];
    }

    const categories = await FinanceCategory.find(filter).sort({ type: 1, name: 1 }).lean();
    const categoryIds = categories.map((row) => row._id);

    const [expenseCounts, incomeCounts, liabilityCounts] = await Promise.all([
      FinanceExpense.aggregate([
        { $match: { category: { $in: categoryIds } } },
        { $group: { _id: '$category', count: { $sum: 1 } } }
      ]),
      FinanceIncome.aggregate([
        { $match: { category: { $in: categoryIds } } },
        { $group: { _id: '$category', count: { $sum: 1 } } }
      ]),
      FinanceLiability.aggregate([
        { $match: { category: { $in: categoryIds } } },
        { $group: { _id: '$category', count: { $sum: 1 } } }
      ])
    ]);

    const expenseMap = new Map(expenseCounts.map((row) => [String(row._id), row.count]));
    const incomeMap = new Map(incomeCounts.map((row) => [String(row._id), row.count]));
    const liabilityMap = new Map(liabilityCounts.map((row) => [String(row._id), row.count]));

    res.json({
      categories: categories.map((row) => {
        const id = String(row._id);
        const incomeLinked = incomeMap.get(id) || 0;
        const expenseLinked = expenseMap.get(id) || 0;
        const liabilityLinked = liabilityMap.get(id) || 0;
        return {
          id,
          name: row.name,
          type: row.type,
          description: row.description || '',
          active: Boolean(row.active),
          linkedCount: incomeLinked + expenseLinked + liabilityLinked,
          linkedBreakdown: {
            income: incomeLinked,
            expense: expenseLinked,
            liability: liabilityLinked
          },
          createdAt: row.createdAt,
          updatedAt: row.updatedAt
        };
      })
    });
  } catch (err) {
    next(err);
  }
}

async function createCategory(req, res, next) {
  try {
    const body = req.body || {};
    const row = await FinanceCategory.create({
      name: normalizeText(body.name),
      type: body.type,
      description: normalizeText(body.description),
      active: body.active !== undefined ? Boolean(body.active) : true,
      createdBy: req.user?.id,
      updatedBy: req.user?.id
    });

    res.status(201).json({ category: row });
  } catch (err) {
    if (err?.code === 11000) return res.status(409).json({ error: 'Category already exists for this type' });
    next(err);
  }
}

async function updateCategory(req, res, next) {
  try {
    const row = await FinanceCategory.findById(req.params.id);
    if (!row) return res.status(404).json({ error: 'Category not found' });

    const body = req.body || {};
    if (body.name !== undefined) row.name = normalizeText(body.name);
    if (body.type !== undefined) row.type = body.type;
    if (body.description !== undefined) row.description = normalizeText(body.description);
    if (body.active !== undefined) row.active = Boolean(body.active);
    row.updatedBy = req.user?.id || null;

    await row.save();
    res.json({ category: row });
  } catch (err) {
    if (err?.code === 11000) return res.status(409).json({ error: 'Category already exists for this type' });
    next(err);
  }
}

async function deleteCategory(req, res, next) {
  try {
    const id = req.params.id;
    const linkedCount = await Promise.all([
      FinanceExpense.countDocuments({ category: id }),
      FinanceIncome.countDocuments({ category: id }),
      FinanceLiability.countDocuments({ category: id })
    ]).then((rows) => rows.reduce((sum, item) => sum + item, 0));

    if (linkedCount > 0) {
      return res.status(409).json({ error: 'Cannot delete category with linked entries' });
    }

    const deleted = await FinanceCategory.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: 'Category not found' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

async function listExpenses(req, res, next) {
  try {
    const { q, categoryId, startDate, endDate } = req.query;
    const filter = {
      ...dateRangeFilter(startDate, endDate, 'expenseDate')
    };
    if (normalizeText(categoryId)) filter.category = categoryId;

    const text = normalizeText(q);
    if (text) {
      filter.$or = [
        { title: { $regex: text, $options: 'i' } },
        { note: { $regex: text, $options: 'i' } },
        { categoryName: { $regex: text, $options: 'i' } }
      ];
    }

    const rows = await FinanceExpense.find(filter)
      .populate('category', 'name type')
      .sort({ expenseDate: -1, createdAt: -1 })
      .lean();

    const totalAmount = rows.reduce((sum, row) => sum + toNumber(row.amount), 0);

    res.json({
      expenses: rows.map((row) => ({
        id: String(row._id),
        title: row.title,
        amount: toNumber(row.amount),
        categoryId: row.category?._id ? String(row.category._id) : null,
        categoryName: row.category?.name || row.categoryName || '',
        paymentMethod: row.paymentMethod || 'cash',
        expenseDate: row.expenseDate,
        note: row.note || '',
        source: row.source || 'manual',
        createdAt: row.createdAt
      })),
      totals: {
        count: rows.length,
        amount: totalAmount
      }
    });
  } catch (err) {
    next(err);
  }
}

async function createExpense(req, res, next) {
  try {
    const body = req.body || {};
    const category = await resolveCategory(body.categoryId);

    const row = await FinanceExpense.create({
      title: normalizeText(body.title),
      amount: toNumber(body.amount),
      category: category?._id || null,
      categoryName: category?.name || '',
      paymentMethod: body.paymentMethod || 'cash',
      expenseDate: body.expenseDate ? new Date(body.expenseDate) : new Date(),
      note: normalizeText(body.note),
      source: 'manual',
      createdBy: req.user?.id,
      updatedBy: req.user?.id
    });

    res.status(201).json({ expense: row });
  } catch (err) {
    next(err);
  }
}

async function updateExpense(req, res, next) {
  try {
    const row = await FinanceExpense.findById(req.params.id);
    if (!row) return res.status(404).json({ error: 'Expense not found' });

    const body = req.body || {};
    if (body.title !== undefined) row.title = normalizeText(body.title);
    if (body.amount !== undefined) row.amount = toNumber(body.amount);
    if (body.categoryId !== undefined) {
      const category = await resolveCategory(body.categoryId);
      row.category = category?._id || null;
      row.categoryName = category?.name || '';
    }
    if (body.paymentMethod !== undefined) row.paymentMethod = body.paymentMethod;
    if (body.expenseDate !== undefined) row.expenseDate = new Date(body.expenseDate);
    if (body.note !== undefined) row.note = normalizeText(body.note);
    row.updatedBy = req.user?.id || null;

    await row.save();
    res.json({ expense: row });
  } catch (err) {
    next(err);
  }
}

async function deleteExpense(req, res, next) {
  try {
    const deleted = await FinanceExpense.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Expense not found' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

async function listLiabilities(req, res, next) {
  try {
    const { q, status, startDate, endDate } = req.query;
    const filter = {
      ...dateRangeFilter(startDate, endDate, 'incurredDate')
    };
    if (normalizeText(status)) filter.status = status;

    const text = normalizeText(q);
    if (text) {
      filter.$or = [
        { title: { $regex: text, $options: 'i' } },
        { debtorName: { $regex: text, $options: 'i' } },
        { note: { $regex: text, $options: 'i' } }
      ];
    }

    const rows = await FinanceLiability.find(filter).sort({ incurredDate: -1, createdAt: -1 }).lean();
    const ids = rows.map((row) => row._id);
    const repayments = await FinanceLiabilityRepayment.find({ liability: { $in: ids } }).sort({ paymentDate: -1 }).lean();

    const repaymentMap = new Map();
    repayments.forEach((row) => {
      const key = String(row.liability);
      if (!repaymentMap.has(key)) repaymentMap.set(key, []);
      repaymentMap.get(key).push({
        id: String(row._id),
        amount: toNumber(row.amount),
        paymentDate: row.paymentDate,
        paymentMethod: row.paymentMethod || 'cash',
        note: row.note || ''
      });
    });

    res.json({
      liabilities: rows.map((row) => {
        const repaymentRows = repaymentMap.get(String(row._id)) || [];
        return {
          id: String(row._id),
          title: row.title,
          debtorName: row.debtorName,
          amount: toNumber(row.amount),
          outstandingAmount: toNumber(row.outstandingAmount),
          status: row.status,
          incurredDate: row.incurredDate,
          categoryId: row.category ? String(row.category) : null,
          categoryName: row.categoryName || '',
          note: row.note || '',
          repayments: repaymentRows
        };
      }),
      totals: {
        count: rows.length,
        amount: rows.reduce((sum, row) => sum + toNumber(row.amount), 0),
        outstanding: rows.reduce((sum, row) => sum + toNumber(row.outstandingAmount), 0)
      }
    });
  } catch (err) {
    next(err);
  }
}

async function createLiabilityIntake(req, res, next) {
  try {
    const body = req.body || {};
    const category = await resolveCategory(body.categoryId);
    const amount = toNumber(body.amount);

    const liability = await FinanceLiability.create({
      title: normalizeText(body.title),
      debtorName: normalizeText(body.debtorName),
      amount,
      outstandingAmount: amount,
      incurredDate: body.incurredDate ? new Date(body.incurredDate) : new Date(),
      status: 'open',
      category: category?._id || null,
      categoryName: category?.name || '',
      note: normalizeText(body.note),
      createdBy: req.user?.id,
      updatedBy: req.user?.id
    });

    const income = await FinanceIncome.create({
      title: `Liability Intake - ${liability.title}`,
      amount,
      category: category?._id || null,
      categoryName: category?.name || '',
      incomeType: 'liability-intake',
      incomeDate: body.incurredDate ? new Date(body.incurredDate) : new Date(),
      note: normalizeText(body.note),
      sourceRef: liability._id,
      createdBy: req.user?.id
    });

    res.status(201).json({ liability, income });
  } catch (err) {
    next(err);
  }
}

async function repayLiability(req, res, next) {
  try {
    const liability = await FinanceLiability.findById(req.params.id);
    if (!liability) return res.status(404).json({ error: 'Liability not found' });

    const body = req.body || {};
    const amount = toNumber(body.amount);
    if (amount <= 0) return res.status(400).json({ error: 'Invalid repayment amount' });
    if (amount > toNumber(liability.outstandingAmount)) {
      return res.status(400).json({ error: 'Repayment cannot exceed outstanding amount' });
    }

    const expenseCategory = await resolveCategory(body.expenseCategoryId);
    const paymentDate = body.paymentDate ? new Date(body.paymentDate) : new Date();

    const expense = await FinanceExpense.create({
      title: `Liability Repayment - ${liability.title}`,
      amount,
      category: expenseCategory?._id || null,
      categoryName: expenseCategory?.name || 'Liability Repayment',
      paymentMethod: body.paymentMethod || 'cash',
      expenseDate: paymentDate,
      note: normalizeText(body.note),
      source: 'liability-repayment',
      sourceRef: liability._id,
      createdBy: req.user?.id,
      updatedBy: req.user?.id
    });

    const repayment = await FinanceLiabilityRepayment.create({
      liability: liability._id,
      amount,
      paymentDate,
      paymentMethod: body.paymentMethod || 'cash',
      note: normalizeText(body.note),
      linkedExpense: expense._id,
      createdBy: req.user?.id
    });

    liability.outstandingAmount = Math.max(0, toNumber(liability.outstandingAmount) - amount);
    liability.status = liability.outstandingAmount <= 0 ? 'closed' : 'open';
    liability.updatedBy = req.user?.id || null;
    await liability.save();

    res.status(201).json({
      liability,
      repayment,
      expense
    });
  } catch (err) {
    next(err);
  }
}

async function getReports(req, res, next) {
  try {
    const { type, categoryId, startDate, endDate } = req.query;
    const selectedType = normalizeText(type) || 'balance-sheet';

    const categoryFilter = normalizeText(categoryId) ? { category: categoryId } : {};
    const incomeFilter = {
      ...categoryFilter,
      ...dateRangeFilter(startDate, endDate, 'incomeDate')
    };
    const expenseFilter = {
      ...categoryFilter,
      ...dateRangeFilter(startDate, endDate, 'expenseDate')
    };
    const liabilityFilter = {
      ...dateRangeFilter(startDate, endDate, 'incurredDate')
    };

    const [incomes, expenses, liabilities] = await Promise.all([
      FinanceIncome.find(incomeFilter).sort({ incomeDate: -1 }).lean(),
      FinanceExpense.find(expenseFilter).sort({ expenseDate: -1 }).lean(),
      FinanceLiability.find(liabilityFilter).sort({ incurredDate: -1 }).lean()
    ]);

    const totals = {
      income: incomes.reduce((sum, row) => sum + toNumber(row.amount), 0),
      expense: expenses.reduce((sum, row) => sum + toNumber(row.amount), 0),
      liabilities: liabilities.reduce((sum, row) => sum + toNumber(row.outstandingAmount), 0)
    };
    totals.balance = totals.income - totals.expense;

    let rows = [];
    if (selectedType === 'income') {
      rows = incomes.map((row) => ({
        id: String(row._id),
        date: row.incomeDate,
        title: row.title,
        categoryName: row.categoryName || '',
        amount: toNumber(row.amount),
        type: row.incomeType
      }));
    } else if (selectedType === 'expense') {
      rows = expenses.map((row) => ({
        id: String(row._id),
        date: row.expenseDate,
        title: row.title,
        categoryName: row.categoryName || '',
        amount: toNumber(row.amount),
        type: row.source || 'manual'
      }));
    } else {
      rows = liabilities.map((row) => ({
        id: String(row._id),
        date: row.incurredDate,
        title: row.title,
        categoryName: row.categoryName || '',
        amount: toNumber(row.amount),
        outstandingAmount: toNumber(row.outstandingAmount),
        type: row.status
      }));
    }

    res.json({
      type: selectedType,
      rows,
      totals
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  listExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  listLiabilities,
  createLiabilityIntake,
  repayLiability,
  getReports
};