const mongoose = require('mongoose');

const inventoryCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    active: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
  },
  { timestamps: true }
);

inventoryCategorySchema.index({ name: 1 }, { unique: true });

module.exports = mongoose.model('InventoryCategory', inventoryCategorySchema);
