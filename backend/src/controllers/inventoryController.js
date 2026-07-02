const {
  InventoryCategory,
  InventoryItem,
  InventoryStockMovement,
  InventoryDistribution
} = require('../models');

function normalizeText(value) {
  return String(value || '').trim();
}

function toBooleanFilter(value) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return null;
}

function getMovementDelta(movementType, quantity) {
  const amount = Number(quantity || 0);
  return movementType === 'out' ? -amount : amount;
}

async function ensureCategoryExists(categoryId) {
  const category = await InventoryCategory.findById(categoryId).select('_id').lean();
  if (!category) {
    const error = new Error('Category not found');
    error.statusCode = 400;
    throw error;
  }
}

async function ensureItemExists(itemId) {
  const item = await InventoryItem.findById(itemId);
  if (!item) {
    const error = new Error('Item not found');
    error.statusCode = 400;
    throw error;
  }
  return item;
}

async function applyQuantityChange(item, delta) {
  const nextQuantity = Number(item.quantity || 0) + Number(delta || 0);
  if (nextQuantity < 0) {
    const error = new Error('Insufficient stock for this operation');
    error.statusCode = 400;
    throw error;
  }
  item.quantity = nextQuantity;
  await item.save();
}

async function listCategories(req, res, next) {
  try {
    const { q, active } = req.query;
    const filter = {};
    const activeFilter = toBooleanFilter(active);
    if (activeFilter !== null) filter.active = activeFilter;

    const search = normalizeText(q);
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const categories = await InventoryCategory.find(filter).sort({ name: 1 }).lean();
    res.json({ categories });
  } catch (err) {
    next(err);
  }
}

async function createCategory(req, res, next) {
  try {
    const body = req.body || {};
    const name = normalizeText(body.name);
    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }

    const created = await InventoryCategory.create({
      name,
      description: normalizeText(body.description),
      active: typeof body.active === 'boolean' ? body.active : true,
      createdBy: req.user?.id,
      updatedBy: req.user?.id
    });

    res.status(201).json({ category: created });
  } catch (err) {
    next(err);
  }
}

async function updateCategory(req, res, next) {
  try {
    const category = await InventoryCategory.findById(req.params.id);
    if (!category) return res.status(404).json({ error: 'Not found' });

    const updates = req.body || {};
    if (typeof updates.name !== 'undefined') category.name = normalizeText(updates.name);
    if (typeof updates.description !== 'undefined') category.description = normalizeText(updates.description);
    if (typeof updates.active !== 'undefined') category.active = Boolean(updates.active);
    category.updatedBy = req.user?.id;

    await category.save();
    res.json({ category });
  } catch (err) {
    next(err);
  }
}

async function deleteCategory(req, res, next) {
  try {
    const hasItems = await InventoryItem.exists({ category: req.params.id });
    if (hasItems) {
      return res.status(400).json({ error: 'Cannot delete category with linked items' });
    }

    const deleted = await InventoryCategory.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

async function listItems(req, res, next) {
  try {
    const { q, categoryId, status } = req.query;
    const filter = {};
    if (categoryId) filter.category = categoryId;
    if (status) filter.status = status;

    const search = normalizeText(q);
    if (search) {
      filter.$or = [
        { sku: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    const items = await InventoryItem.find(filter)
      .populate('category', 'name active')
      .sort({ name: 1, updatedAt: -1 })
      .lean();

    res.json({ items });
  } catch (err) {
    next(err);
  }
}

async function createItem(req, res, next) {
  try {
    const body = req.body || {};
    const name = normalizeText(body.name);
    const categoryId = normalizeText(body.categoryId);
    if (!name || !categoryId) {
      return res.status(400).json({ error: 'name and categoryId are required' });
    }

    await ensureCategoryExists(categoryId);

    const created = await InventoryItem.create({
      sku: normalizeText(body.sku),
      name,
      category: categoryId,
      unit: normalizeText(body.unit) || 'piece',
      quantity: Number(body.quantity || 0),
      minQuantity: Number(body.minQuantity || 0),
      location: normalizeText(body.location),
      status: body.status || 'active',
      notes: normalizeText(body.notes),
      createdBy: req.user?.id,
      updatedBy: req.user?.id
    });

    const item = await InventoryItem.findById(created._id).populate('category', 'name active').lean();
    res.status(201).json({ item });
  } catch (err) {
    next(err);
  }
}

async function updateItem(req, res, next) {
  try {
    const item = await InventoryItem.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });

    const updates = req.body || {};
    if (typeof updates.categoryId !== 'undefined') {
      const categoryId = normalizeText(updates.categoryId);
      if (categoryId) {
        await ensureCategoryExists(categoryId);
        item.category = categoryId;
      }
    }
    if (typeof updates.sku !== 'undefined') item.sku = normalizeText(updates.sku);
    if (typeof updates.name !== 'undefined') item.name = normalizeText(updates.name);
    if (typeof updates.unit !== 'undefined') item.unit = normalizeText(updates.unit) || 'piece';
    if (typeof updates.quantity !== 'undefined') item.quantity = Number(updates.quantity || 0);
    if (typeof updates.minQuantity !== 'undefined') item.minQuantity = Number(updates.minQuantity || 0);
    if (typeof updates.location !== 'undefined') item.location = normalizeText(updates.location);
    if (typeof updates.status !== 'undefined') item.status = updates.status;
    if (typeof updates.notes !== 'undefined') item.notes = normalizeText(updates.notes);
    item.updatedBy = req.user?.id;

    await item.save();
    const updated = await InventoryItem.findById(item._id).populate('category', 'name active').lean();
    res.json({ item: updated });
  } catch (err) {
    next(err);
  }
}

async function deleteItem(req, res, next) {
  try {
    const itemId = req.params.id;
    const linkedMovements = await InventoryStockMovement.exists({ item: itemId });
    const linkedDistributions = await InventoryDistribution.exists({ item: itemId });
    if (linkedMovements || linkedDistributions) {
      return res.status(400).json({ error: 'Cannot delete item with stock history or distributions' });
    }

    const deleted = await InventoryItem.findByIdAndDelete(itemId);
    if (!deleted) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

async function listMovements(req, res, next) {
  try {
    const { q, itemId, movementType } = req.query;
    const filter = {};
    if (itemId) filter.item = itemId;
    if (movementType) filter.movementType = movementType;

    const search = normalizeText(q);
    if (search) {
      filter.$or = [
        { reference: { $regex: search, $options: 'i' } },
        { note: { $regex: search, $options: 'i' } }
      ];
    }

    const movements = await InventoryStockMovement.find(filter)
      .populate({ path: 'item', select: 'name sku quantity unit', populate: { path: 'category', select: 'name' } })
      .sort({ movementDate: -1, updatedAt: -1 })
      .lean();

    res.json({ movements });
  } catch (err) {
    next(err);
  }
}

async function createMovement(req, res, next) {
  try {
    const body = req.body || {};
    const item = await ensureItemExists(body.itemId);
    const quantity = Number(body.quantity || 0);
    const movementType = body.movementType;
    const delta = getMovementDelta(movementType, quantity);

    await applyQuantityChange(item, delta);

    const created = await InventoryStockMovement.create({
      item: item._id,
      movementType,
      quantity,
      reference: normalizeText(body.reference),
      note: normalizeText(body.note),
      movementDate: body.movementDate || Date.now(),
      createdBy: req.user?.id,
      updatedBy: req.user?.id
    });

    const movement = await InventoryStockMovement.findById(created._id)
      .populate({ path: 'item', select: 'name sku quantity unit', populate: { path: 'category', select: 'name' } })
      .lean();

    res.status(201).json({ movement });
  } catch (err) {
    next(err);
  }
}

async function updateMovement(req, res, next) {
  try {
    const movement = await InventoryStockMovement.findById(req.params.id);
    if (!movement) return res.status(404).json({ error: 'Not found' });

    const previousItem = await ensureItemExists(movement.item);
    await applyQuantityChange(previousItem, -getMovementDelta(movement.movementType, movement.quantity));

    const body = req.body || {};
    const nextItemId = normalizeText(body.itemId) || String(movement.item);
    const nextItem = await ensureItemExists(nextItemId);
    const nextMovementType = body.movementType || movement.movementType;
    const nextQuantity = Number(typeof body.quantity !== 'undefined' ? body.quantity : movement.quantity);
    const nextDelta = getMovementDelta(nextMovementType, nextQuantity);

    await applyQuantityChange(nextItem, nextDelta);

    movement.item = nextItem._id;
    movement.movementType = nextMovementType;
    movement.quantity = nextQuantity;
    if (typeof body.reference !== 'undefined') movement.reference = normalizeText(body.reference);
    if (typeof body.note !== 'undefined') movement.note = normalizeText(body.note);
    if (typeof body.movementDate !== 'undefined') movement.movementDate = body.movementDate || Date.now();
    movement.updatedBy = req.user?.id;

    await movement.save();
    const updated = await InventoryStockMovement.findById(movement._id)
      .populate({ path: 'item', select: 'name sku quantity unit', populate: { path: 'category', select: 'name' } })
      .lean();

    res.json({ movement: updated });
  } catch (err) {
    next(err);
  }
}

async function deleteMovement(req, res, next) {
  try {
    const movement = await InventoryStockMovement.findById(req.params.id);
    if (!movement) return res.status(404).json({ error: 'Not found' });

    const item = await ensureItemExists(movement.item);
    await applyQuantityChange(item, -getMovementDelta(movement.movementType, movement.quantity));
    await movement.deleteOne();
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

async function listDistributions(req, res, next) {
  try {
    const { q, itemId, recipientType, status } = req.query;
    const filter = {};
    if (itemId) filter.item = itemId;
    if (recipientType) filter.recipientType = recipientType;
    if (status) filter.status = status;

    const search = normalizeText(q);
    if (search) {
      filter.$or = [
        { recipientName: { $regex: search, $options: 'i' } },
        { note: { $regex: search, $options: 'i' } }
      ];
    }

    const distributions = await InventoryDistribution.find(filter)
      .populate({ path: 'item', select: 'name sku quantity unit', populate: { path: 'category', select: 'name' } })
      .sort({ distributedAt: -1, updatedAt: -1 })
      .lean();

    res.json({ distributions });
  } catch (err) {
    next(err);
  }
}

async function createDistribution(req, res, next) {
  try {
    const body = req.body || {};
    const item = await ensureItemExists(body.itemId);
    const quantity = Number(body.quantity || 0);

    await applyQuantityChange(item, -quantity);

    const created = await InventoryDistribution.create({
      item: item._id,
      recipientName: normalizeText(body.recipientName),
      recipientType: body.recipientType || 'other',
      quantity,
      status: body.status || 'issued',
      distributedAt: body.distributedAt || Date.now(),
      note: normalizeText(body.note),
      createdBy: req.user?.id,
      updatedBy: req.user?.id
    });

    const distribution = await InventoryDistribution.findById(created._id)
      .populate({ path: 'item', select: 'name sku quantity unit', populate: { path: 'category', select: 'name' } })
      .lean();

    res.status(201).json({ distribution });
  } catch (err) {
    next(err);
  }
}

async function updateDistribution(req, res, next) {
  try {
    const distribution = await InventoryDistribution.findById(req.params.id);
    if (!distribution) return res.status(404).json({ error: 'Not found' });

    const previousItem = await ensureItemExists(distribution.item);
    await applyQuantityChange(previousItem, distribution.quantity);

    const body = req.body || {};
    const nextItemId = normalizeText(body.itemId) || String(distribution.item);
    const nextItem = await ensureItemExists(nextItemId);
    const nextQuantity = Number(typeof body.quantity !== 'undefined' ? body.quantity : distribution.quantity);

    await applyQuantityChange(nextItem, -nextQuantity);

    distribution.item = nextItem._id;
    if (typeof body.recipientName !== 'undefined') distribution.recipientName = normalizeText(body.recipientName);
    if (typeof body.recipientType !== 'undefined') distribution.recipientType = body.recipientType;
    distribution.quantity = nextQuantity;
    if (typeof body.status !== 'undefined') distribution.status = body.status;
    if (typeof body.distributedAt !== 'undefined') distribution.distributedAt = body.distributedAt || Date.now();
    if (typeof body.note !== 'undefined') distribution.note = normalizeText(body.note);
    distribution.updatedBy = req.user?.id;

    await distribution.save();
    const updated = await InventoryDistribution.findById(distribution._id)
      .populate({ path: 'item', select: 'name sku quantity unit', populate: { path: 'category', select: 'name' } })
      .lean();

    res.json({ distribution: updated });
  } catch (err) {
    next(err);
  }
}

async function deleteDistribution(req, res, next) {
  try {
    const distribution = await InventoryDistribution.findById(req.params.id);
    if (!distribution) return res.status(404).json({ error: 'Not found' });

    const item = await ensureItemExists(distribution.item);
    await applyQuantityChange(item, distribution.quantity);
    await distribution.deleteOne();
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  listItems,
  createItem,
  updateItem,
  deleteItem,
  listMovements,
  createMovement,
  updateMovement,
  deleteMovement,
  listDistributions,
  createDistribution,
  updateDistribution,
  deleteDistribution
};
