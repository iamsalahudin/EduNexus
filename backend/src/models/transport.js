const mongoose = require('mongoose');

const TransportSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    route: { type: String, required: true },
    pickupPoint: { type: String, required: true },
    dropoffPoint: { type: String, required: true },
    transportFee: { type: Number, required: true },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Transport', TransportSchema);