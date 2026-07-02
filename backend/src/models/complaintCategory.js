const mongoose = require('mongoose');

const ComplaintCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    description: { type: String, trim: true },
    icon: { type: String }, // Optional: color or icon identifier
    active: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ComplaintCategory', ComplaintCategorySchema);
