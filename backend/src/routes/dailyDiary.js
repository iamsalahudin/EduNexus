const express = require('express');
const router = express.Router();
const dailyDiaryController = require('../controllers/dailyDiaryController');
const { requireAuth, requireRole } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const {
  createDailyDiarySchema,
  updateDailyDiarySchema,
  listDailyDiaryQuerySchema
} = require('../validators/dailyDiary');

router.use(requireAuth);

router.get('/', requireRole('Admin', 'Principal', 'Teacher', 'Student', 'Parent', 'Reception'), validate(listDailyDiaryQuerySchema), dailyDiaryController.listDailyDiaries);
router.get('/:id', requireRole('Admin', 'Principal', 'Teacher', 'Student', 'Parent', 'Reception'), dailyDiaryController.getDailyDiary);

router.post('/', requireRole('Admin', 'Principal', 'Teacher', 'Reception'), validate(createDailyDiarySchema), dailyDiaryController.createDailyDiary);
router.patch('/:id', requireRole('Admin', 'Principal', 'Teacher', 'Reception'), validate(updateDailyDiarySchema), dailyDiaryController.updateDailyDiary);
router.delete('/:id', requireRole('Admin', 'Principal'), dailyDiaryController.deleteDailyDiary);

module.exports = router;
