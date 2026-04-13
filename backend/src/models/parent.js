const mongoose = require('mongoose');

const ParentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
      unique: true
    },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, index: true },
    phone: { type: String, required: true, trim: true, index: true },
    cnic: { type: String, trim: true, index: true, sparse: true },
    dob: { type: Date },
    occupation: { type: String, trim: true },
    salary: { type: Number, min: 0 },
    relation: { type: String, trim: true },
    address: { type: String, trim: true }
  },
  { timestamps: true }
);

ParentSchema.index({ name: 1 });
ParentSchema.index({ email: 1 });
ParentSchema.index({ phone: 1 });
ParentSchema.index({ cnic: 1 }, { sparse: true });

module.exports = mongoose.model('Parent', ParentSchema);
