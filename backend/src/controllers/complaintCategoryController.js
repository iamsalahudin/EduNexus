const { ComplaintCategory } = require('../models');

async function listCategories(req, res, next) {
  try {
    const categories = await ComplaintCategory.find({ active: true })
      .sort({ name: 1 })
      .select('_id name description icon active');
    res.json({ categories });
  } catch (err) {
    next(err);
  }
}

async function createCategory(req, res, next) {
  try {
    const { name, description, icon } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const existing = await ComplaintCategory.findOne({ name: { $regex: `^${name.trim()}$`, $options: 'i' } });
    if (existing) {
      return res.status(400).json({ error: 'Category with this name already exists' });
    }

    const category = new ComplaintCategory({
      name: name.trim(),
      description: description ? description.trim() : '',
      icon: icon || '',
      createdBy: req.user?.id,
    });

    await category.save();
    res.status(201).json({ category });
  } catch (err) {
    next(err);
  }
}

async function updateCategory(req, res, next) {
  try {
    const { id } = req.params;
    const { name, description, icon, active } = req.body;

    const category = await ComplaintCategory.findById(id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    if (name && name.trim() && name.trim() !== category.name) {
      const existing = await ComplaintCategory.findOne({ 
        _id: { $ne: id }, 
        name: { $regex: `^${name.trim()}$`, $options: 'i' } 
      });
      if (existing) {
        return res.status(400).json({ error: 'Another category with this name already exists' });
      }
      category.name = name.trim();
    }

    if (description !== undefined) {
      category.description = description ? description.trim() : '';
    }

    if (icon !== undefined) {
      category.icon = icon || '';
    }

    if (active !== undefined) {
      category.active = Boolean(active);
    }

    await category.save();
    res.json({ category });
  } catch (err) {
    next(err);
  }
}

async function deleteCategory(req, res, next) {
  try {
    const { id } = req.params;

    const category = await ComplaintCategory.findByIdAndDelete(id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ message: 'Category deleted successfully', category });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
