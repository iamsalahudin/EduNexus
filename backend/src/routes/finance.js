const express = require('express');
const { requireAuth } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { readFinanceSettings, updateFinanceSettings } = require('../controllers/financeController');
const {
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
} = require('../controllers/financeLedgerController');
const {
	listFinanceCategoriesSchema,
	upsertFinanceCategorySchema,
	listFinanceExpensesSchema,
	upsertFinanceExpenseSchema,
	listFinanceLiabilitiesSchema,
	createLiabilityIntakeSchema,
	repayLiabilitySchema,
	financeReportSchema
} = require('../validators/finance');

const router = express.Router();

router.use(requireAuth);

router.get('/settings', readFinanceSettings);
router.put('/settings', requireRole('Admin', 'Principal', 'Finance'), updateFinanceSettings);

router.get('/categories', validate(listFinanceCategoriesSchema), listCategories);
router.post('/categories', requireRole('Admin', 'Principal', 'Finance'), validate(upsertFinanceCategorySchema), createCategory);
router.patch('/categories/:id', requireRole('Admin', 'Principal', 'Finance'), validate(upsertFinanceCategorySchema), updateCategory);
router.delete('/categories/:id', requireRole('Admin', 'Principal', 'Finance'), deleteCategory);

router.get('/expenses', validate(listFinanceExpensesSchema), listExpenses);
router.post('/expenses', requireRole('Admin', 'Principal', 'Finance'), validate(upsertFinanceExpenseSchema), createExpense);
router.patch('/expenses/:id', requireRole('Admin', 'Principal', 'Finance'), validate(upsertFinanceExpenseSchema), updateExpense);
router.delete('/expenses/:id', requireRole('Admin', 'Principal', 'Finance'), deleteExpense);

router.get('/liabilities', validate(listFinanceLiabilitiesSchema), listLiabilities);
router.post('/liabilities/intake', requireRole('Admin', 'Principal', 'Finance'), validate(createLiabilityIntakeSchema), createLiabilityIntake);
router.post('/liabilities/:id/repay', requireRole('Admin', 'Principal', 'Finance'), validate(repayLiabilitySchema), repayLiability);

router.get('/reports', validate(financeReportSchema), getReports);

module.exports = router;