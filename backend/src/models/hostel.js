const mongoose = require('mongoose');

const HostelSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    wardenName: { type: String, trim: true, default: '' },
    gender: { type: String, enum: ['boys', 'girls', 'mixed'], default: 'mixed' },
    address: { type: String, trim: true, default: '' },
    active: { type: Boolean, default: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Hostel', HostelSchema);
