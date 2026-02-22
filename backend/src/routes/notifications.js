const express = require('express');
const router = express.Router();

const { requireAuth, requireRole } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const notificationsController = require('../controllers/notificationsController');
const {
  createBroadcastSchema,
  listBroadcastSchema,
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

// Broadcast management (Admin)
router.post('/broadcast', requireRole('Admin'), validate(createBroadcastSchema), notificationsController.createBroadcast);
router.get('/broadcast', requireRole('Admin'), validate(listBroadcastSchema), notificationsController.listBroadcast);
router.delete('/broadcast/:id', requireRole('Admin'), notificationsController.deleteBroadcast);

module.exports = router;
