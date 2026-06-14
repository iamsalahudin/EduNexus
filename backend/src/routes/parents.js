const express = require('express');

const { requireAuth, requireRole } = require('../middlewares/auth');
const { createUploadMiddleware } = require('../middlewares/upload');
const validate = require('../middlewares/validate');
const controller = require('../controllers/parentsController');
const {
  listParentSchema,
  getParentSchema,
  createParentSchema,
  updateParentSchema
} = require('../validators/parents');

const router = express.Router();

const upload = createUploadMiddleware({
  maxFileSizeMB: 10,
  maxFiles: 10
});

router.use(requireAuth);

router.get('/summary', requireRole('Admin', 'Principal', 'HR', 'Reception'), controller.getParentsSummary);
router.get('/', requireRole('Admin', 'Principal', 'HR', 'Reception'), validate(listParentSchema), controller.listParents);
router.get('/:id', requireRole('Admin', 'Principal', 'HR', 'Reception'), validate(getParentSchema), controller.getParentById);
router.post('/', requireRole('Admin', 'Principal'), upload.array('documents', 10), validate(createParentSchema), controller.createParent);
router.patch('/:id', requireRole('Admin', 'Principal'), upload.array('documents', 10), validate(updateParentSchema), controller.updateParent);
router.delete('/:id', requireRole('Admin', 'Principal'), validate(getParentSchema), controller.deleteParent);

module.exports = router;
