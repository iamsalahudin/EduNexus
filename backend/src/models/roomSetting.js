const mongoose = require('mongoose');

const RoomSettingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: 'default', trim: true },
    rooms: [{ type: String, trim: true }]
  },
  { timestamps: true }
);

module.exports = mongoose.model('RoomSetting', RoomSettingSchema);
