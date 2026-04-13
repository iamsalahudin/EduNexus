const mongoose = require('mongoose');

const SchoolClassSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true, index: true },
    // Optional level grouping used for notifications targeting
    level: { type: String, trim: true, default: undefined },
    sections: [{ type: String, trim: true }],
    active: { type: Boolean, default: true },
    tutionFee: { type: Number, default: 0 }
  },
  { timestamps: true }
);

SchoolClassSchema.index({ name: 1 }, { unique: true });
SchoolClassSchema.index({ active: 1, name: 1 });

module.exports = mongoose.model('SchoolClass', SchoolClassSchema);
