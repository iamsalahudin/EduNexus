const express = require('express');
const router = express.Router();

const { requireAuth, requireRole } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const notificationsController = require('../controllers/notificationsController');
const {
  createBroadcastSchema,
  listBroadcastSchema,
  updateBroadcastSchema,
  createRequestSchema,
  listRequestsSchema,
  replyRequestSchema,
  closeRequestSchema,
  dismissSchema,
  inboxSchema
} = require('../validators/notifications');

router.use(requireAuth);

// Any user inbox
router.get('/inbox', validate(inboxSchema), notificationsController.inbox);
router.post('/:id/read', notificationsController.markRead);
router.post('/:id/dismiss', validate(dismissSchema), notificationsController.dismiss);

// Requests (any user can create)
router.post('/requests', validate(createRequestSchema), notificationsController.createRequest);

// Requests management (Admin/Principal)
router.get('/requests', requireRole('Admin', 'Principal'), validate(listRequestsSchema), notificationsController.listRequests);
router.get('/requests/:id', notificationsController.getRequest);
router.post('/requests/:id/reply', requireRole('Admin', 'Principal'), validate(replyRequestSchema), notificationsController.replyRequest);
router.post('/requests/:id/close', requireRole('Admin', 'Principal'), validate(closeRequestSchema), notificationsController.closeRequest);

// Broadcast management (Admin + Principal, with controller-level System restrictions for Principal)
router.post('/broadcast', requireRole('Admin', 'Principal'), validate(createBroadcastSchema), notificationsController.createBroadcast);
router.get('/broadcast', requireRole('Admin', 'Principal'), validate(listBroadcastSchema), notificationsController.listBroadcast);
router.patch('/broadcast/:id', requireRole('Admin', 'Principal'), validate(updateBroadcastSchema), notificationsController.updateBroadcast);
router.delete('/broadcast/:id', requireRole('Admin', 'Principal'), notificationsController.deleteBroadcast);

module.exports = router;
