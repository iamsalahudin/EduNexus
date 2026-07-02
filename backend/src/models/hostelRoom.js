const mongoose = require('mongoose');

const HostelRoomSchema = new mongoose.Schema(
  {
    hostel: { type: mongoose.Schema.Types.ObjectId, ref: 'Hostel', required: true, index: true },
    roomNumber: { type: String, required: true, trim: true },
    capacity: { type: Number, min: 1, default: 1 },
    floor: { type: String, trim: true, default: '' },
    active: { type: Boolean, default: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

HostelRoomSchema.index({ hostel: 1, roomNumber: 1 }, { unique: true });

module.exports = mongoose.model('HostelRoom', HostelRoomSchema);
