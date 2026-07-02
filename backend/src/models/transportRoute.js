const mongoose = require('mongoose');

const TransportRouteSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, trim: true, uppercase: true },
    pickupPoint: { type: String, required: true, trim: true },
    dropoffPoint: { type: String, required: true, trim: true },
    fee: { type: Number, required: true, min: 0 },
    vehicleNumber: { type: String, trim: true },
    driverName: { type: String, trim: true },
    driverPhone: { type: String, trim: true },
    active: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

TransportRouteSchema.index({ active: 1, name: 1 });
TransportRouteSchema.index({ code: 1 }, { sparse: true });

module.exports = mongoose.model('TransportRoute', TransportRouteSchema);
