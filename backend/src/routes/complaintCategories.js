const express = require('express');
const { requireAuth, requireRole } = require('../middlewares/auth');
const { listCategories, createCategory, updateCategory, deleteCategory } = require('../controllers/complaintCategoryController');

const router = express.Router();

// Require auth for all complaint category routes
router.use(requireAuth);

// Get all active complaint categories (accessible to all authenticated users)
router.get('/', listCategories);

// Create a new complaint category (Admin/Principal only)
router.post('/', requireRole('Admin', 'Principal'), createCategory);

// Update a complaint category (Admin/Principal only)
router.patch('/:id', requireRole('Admin', 'Principal'), updateCategory);

// Delete a complaint category (Admin/Principal only)
router.delete('/:id', requireRole('Admin', 'Principal'), deleteCategory);

module.exports = router;
