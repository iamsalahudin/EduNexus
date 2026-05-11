const express = require('express');
const router = express.Router();

const { requireAuth, requireRole } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const inventoryController = require('../controllers/inventoryController');
const {
  listCategoriesSchema,
  categorySchema,
  listItemsSchema,
  itemSchema,
  listMovementsSchema,
  stockMovementSchema,
  listDistributionsSchema,
  distributionSchema
} = require('../validators/inventory');

router.use(requireAuth);
router.use(requireRole('Admin'));

router.get('/categories', validate(listCategoriesSchema), inventoryController.listCategories);
router.post('/categories', validate(categorySchema), inventoryController.createCategory);
router.patch('/categories/:id', validate(categorySchema), inventoryController.updateCategory);
router.delete('/categories/:id', inventoryController.deleteCategory);

router.get('/items', validate(listItemsSchema), inventoryController.listItems);
router.post('/items', validate(itemSchema), inventoryController.createItem);
router.patch('/items/:id', validate(itemSchema), inventoryController.updateItem);
router.delete('/items/:id', inventoryController.deleteItem);

router.get('/stock', validate(listMovementsSchema), inventoryController.listMovements);
router.post('/stock', validate(stockMovementSchema), inventoryController.createMovement);
router.patch('/stock/:id', validate(stockMovementSchema), inventoryController.updateMovement);
router.delete('/stock/:id', inventoryController.deleteMovement);

router.get('/distribution', validate(listDistributionsSchema), inventoryController.listDistributions);
router.post('/distribution', validate(distributionSchema), inventoryController.createDistribution);
router.patch('/distribution/:id', validate(distributionSchema), inventoryController.updateDistribution);
router.delete('/distribution/:id', inventoryController.deleteDistribution);

module.exports = router;
