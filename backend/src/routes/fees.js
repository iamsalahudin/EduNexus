const express = require('express');
const router = express.Router();
const feeController = require('../controllers/feeController');
const { requireAuth, requireRole } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { createFeeSchema, recordPaymentSchema, updateFeeSchema } = require('../validators/fees');

// Create fee (Admin, Finance)
router.post('/', requireAuth, requireRole('Admin', 'Finance'), validate(createFeeSchema), feeController.createFee);
// Get fees (role-aware)
router.get('/', requireAuth, feeController.getFees);
// Record payment (Parent, Reception, Admin, Finance)
router.post('/:id/pay', requireAuth, requireRole('Parent', 'Reception', 'Admin', 'Finance'), validate(recordPaymentSchema), feeController.recordPayment);
// Update fee
router.patch('/:id', requireAuth, requireRole('Admin', 'Finance'), validate(updateFeeSchema), feeController.updateFee);
// Delete fee
router.delete('/:id', requireAuth, requireRole('Admin'), feeController.deleteFee);

module.exports = router;