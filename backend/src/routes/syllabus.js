const express = require('express');
const router = express.Router();

const { requireAuth, requireRole } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const syllabusController = require('../controllers/syllabusController');
const { listSyllabusSchema, syllabusSchema } = require('../validators/syllabus');

router.use(requireAuth);

router.get('/', requireRole('Admin', 'Principal'), validate(listSyllabusSchema), syllabusController.listSyllabus);
router.post('/', requireRole('Admin', 'Principal'), validate(syllabusSchema), syllabusController.createSyllabus);
router.patch('/:id', requireRole('Admin', 'Principal'), validate(syllabusSchema), syllabusController.updateSyllabus);
router.delete('/:id', requireRole('Admin', 'Principal'), syllabusController.deleteSyllabus);

module.exports = router;