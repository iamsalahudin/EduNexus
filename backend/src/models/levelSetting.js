const mongoose = require('mongoose');

const LevelSettingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: 'default', trim: true },
    levels: [{ type: String, trim: true }]
  },
  { timestamps: true }
);

module.exports = mongoose.model('LevelSetting', LevelSettingSchema);
