const mongoose = require('mongoose');

const inventoryDistributionSchema = new mongoose.Schema(
  {
    item: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryItem', required: true },
    recipientName: { type: String, required: true, trim: true },
    recipientType: {
      type: String,
      enum: ['class', 'student', 'staff', 'department', 'other'],
      default: 'other'
    },
    quantity: { type: Number, required: true, min: 1 },
    status: { type: String, enum: ['issued', 'returned', 'lost'], default: 'issued' },
    distributedAt: { type: Date, default: Date.now },
    note: { type: String, default: '', trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model('InventoryDistribution', inventoryDistributionSchema);
