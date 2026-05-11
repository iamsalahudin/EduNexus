const express = require('express');
const router = express.Router();
const feeController = require('../controllers/feeController');
const { requireAuth, requireRole } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
<<<<<<< HEAD
const { createFeeSchema, generateMonthlyFeesSchema, recordPaymentSchema, updateFeeSchema, updateFeeStatusSchema, feeVoucherTemplateSchema } = require('../validators/fees');
=======
const { createFeeSchema, generateMonthlyFeesSchema, recordPaymentSchema, updateFeeSchema, updateFeeStatusSchema } = require('../validators/fees');
>>>>>>> 840ff67df38f58f0f98a7d641b0485545e8e9854

// Create fee (Admin, Finance)
router.post('/', requireAuth, requireRole('Admin', 'Finance'), validate(createFeeSchema), feeController.createFee);
router.post('/generate-monthly', requireAuth, requireRole('Admin', 'Principal', 'Finance'), validate(generateMonthlyFeesSchema), feeController.generateMonthlyFees);
<<<<<<< HEAD
router.get('/voucher-template', requireAuth, requireRole('Admin', 'Principal', 'Finance', 'Reception'), feeController.getFeeVoucherTemplate);
router.put('/voucher-template', requireAuth, requireRole('Admin', 'Principal', 'Finance'), validate(feeVoucherTemplateSchema), feeController.saveFeeVoucherTemplate);
=======
>>>>>>> 840ff67df38f58f0f98a7d641b0485545e8e9854
// Get fees (role-aware)
router.get('/', requireAuth, requireRole('Admin', 'Principal', 'Finance', 'Reception', 'Parent', 'Student'), feeController.getFees);
router.get('/summary', requireAuth, requireRole('Admin', 'Principal', 'Finance', 'Reception', 'Parent', 'Student'), feeController.getFeeSummary);
router.get('/records', requireAuth, requireRole('Admin', 'Principal', 'Finance', 'Reception', 'Parent', 'Student'), feeController.getFeeRecords);
router.get('/defaulters', requireAuth, requireRole('Admin', 'Principal', 'Finance', 'Reception'), feeController.getFeeDefaulters);
router.get('/details/:studentId', requireAuth, requireRole('Admin', 'Principal', 'Finance', 'Reception', 'Parent', 'Student'), feeController.getFeeDetails);
// Record payment (Parent, Reception, Admin, Principal, Finance)
router.post('/:id/pay', requireAuth, requireRole('Parent', 'Reception', 'Admin', 'Principal', 'Finance'), validate(recordPaymentSchema), feeController.recordPayment);
router.patch('/:id/status', requireAuth, requireRole('Reception', 'Admin', 'Principal', 'Finance'), validate(updateFeeStatusSchema), feeController.updateFeeStatus);
// Update fee
router.patch('/:id', requireAuth, requireRole('Admin', 'Principal', 'Finance'), validate(updateFeeSchema), feeController.updateFee);
// Delete fee
router.delete('/:id', requireAuth, requireRole('Admin'), feeController.deleteFee);

module.exports = router;