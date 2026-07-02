const mongoose = require('mongoose');

const inventoryItemSchema = new mongoose.Schema(
  {
    sku: { type: String, trim: true, default: '' },
    name: { type: String, required: true, trim: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryCategory', required: true },
    unit: { type: String, trim: true, default: 'piece' },
    quantity: { type: Number, default: 0, min: 0 },
    minQuantity: { type: Number, default: 0, min: 0 },
    location: { type: String, default: '', trim: true },
    status: { type: String, enum: ['active', 'inactive', 'damaged'], default: 'active' },
    notes: { type: String, default: '', trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
  },
  { timestamps: true }
);

inventoryItemSchema.index({ sku: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('InventoryItem', inventoryItemSchema);
