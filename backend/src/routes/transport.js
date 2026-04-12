const express = require('express');
const router = express.Router();

const { requireAuth, requireRole } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const transportController = require('../controllers/transportController');
const {
  listRoutesSchema,
  createRouteSchema,
  updateRouteSchema,
  routeIdParamSchema,
  listEnrollmentsSchema,
  createEnrollmentSchema,
  updateEnrollmentSchema,
  enrollmentIdParamSchema,
  createRequestSchema,
  listRequestsSchema,
  updateRequestStatusSchema,
  listPaymentsSchema,
  createPaymentSchema,
  updatePaymentSchema,
  paymentIdParamSchema,
  reportFiltersSchema
} = require('../validators/transport');

router.use(requireAuth);

// Routes catalog
router.get('/routes', validate(listRoutesSchema), transportController.listRoutes);
router.get('/parent/children', requireRole('Parent'), transportController.listParentChildren);
router.post('/routes', requireRole('Admin', 'Principal'), validate(createRouteSchema), transportController.createRoute);
router.patch('/routes/:routeId', requireRole('Admin', 'Principal'), validate(updateRouteSchema), transportController.updateRoute);
router.delete('/routes/:routeId', requireRole('Admin', 'Principal'), validate(routeIdParamSchema), transportController.deleteRoute);

// Enrollments
router.get('/enrollments', validate(listEnrollmentsSchema), transportController.listEnrollments);
router.post('/enrollments', requireRole('Admin', 'Principal', 'Reception'), validate(createEnrollmentSchema), transportController.createEnrollment);
router.patch('/enrollments/:enrollmentId', requireRole('Admin', 'Principal', 'Reception'), validate(updateEnrollmentSchema), transportController.updateEnrollment);
router.delete('/enrollments/:enrollmentId', requireRole('Admin', 'Principal', 'Reception'), validate(enrollmentIdParamSchema), transportController.deleteEnrollment);

// Requests
router.get('/requests', validate(listRequestsSchema), transportController.listRequests);
router.post('/requests', requireRole('Student', 'Teacher', 'Parent'), validate(createRequestSchema), transportController.createRequest);
router.patch('/requests/:requestId/status', requireRole('Admin', 'Principal', 'Reception', 'Student', 'Teacher', 'Parent'), validate(updateRequestStatusSchema), transportController.updateRequestStatus);

// Payments
router.get('/payments', validate(listPaymentsSchema), transportController.listPayments);
router.post('/payments', requireRole('Admin', 'Principal', 'Reception'), validate(createPaymentSchema), transportController.createPayment);
router.patch('/payments/:paymentId', requireRole('Admin', 'Principal', 'Reception'), validate(updatePaymentSchema), transportController.updatePayment);
router.delete('/payments/:paymentId', requireRole('Admin', 'Principal', 'Reception'), validate(paymentIdParamSchema), transportController.deletePayment);

// Reports and exports
router.get('/reports/payment-summary', requireRole('Admin', 'Principal'), validate(reportFiltersSchema), transportController.paymentSummaryReport);
router.get('/reports/defaulters', requireRole('Admin', 'Principal'), validate(reportFiltersSchema), transportController.defaultersReport);
router.get('/reports/route-counts', requireRole('Admin', 'Principal'), validate(reportFiltersSchema), transportController.routeCountsReport);
router.get('/reports/revenue-trend', requireRole('Admin', 'Principal'), validate(reportFiltersSchema), transportController.revenueTrendReport);
router.get('/reports/payments/export.csv', requireRole('Admin', 'Principal'), validate(reportFiltersSchema), transportController.exportPaymentsCsv);

module.exports = router;
