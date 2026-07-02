const express = require('express');
const { requireAuth } = require('../middlewares/auth');
const {
  listGradeScales,
  getGradeScale,
  createGradeScale,
  updateGradeScale,
  deleteGradeScale,
  resolveGradeScaleForClass
} = require('../controllers/gradeScaleController');

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// List grade scales
router.get('/', listGradeScales);

// Get a specific grade scale
router.get('/:id', getGradeScale);

// Resolve effective grade scale for a class
router.get('/resolve/for-class', resolveGradeScaleForClass);

// Create a new grade scale (admin/principal)
router.post('/', createGradeScale);

// Update a grade scale (admin/principal)
router.patch('/:id', updateGradeScale);

// Delete a grade scale (admin/principal)
router.delete('/:id', deleteGradeScale);

module.exports = router;
