const mongoose = require('mongoose');

const TimetableSlotSchema = new mongoose.Schema({
  day: { type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], required: true },
  startTime: { type: String, required: true }, // HH:MM format
  endTime: { type: String, required: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  class: { type: String },
  section: { type: String },
  room: { type: String }
});

const TimetableSchema = new mongoose.Schema(
  {
    level: { type: String, trim: true, index: true },
    class: { type: String, index: true }, // legacy compatibility only
    section: { type: String }, // legacy compatibility only
    year: { type: Number, required: true },
    slots: { type: [TimetableSlotSchema], default: [] },
    status: { type: String, enum: ['active', 'pending', 'archived'], default: 'active', index: true },
    isActive: { type: Boolean, default: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

TimetableSchema.index({ level: 1, year: 1 }, { unique: true });
TimetableSchema.index({ level: 1, isActive: 1, year: 1 });
TimetableSchema.index({ status: 1, year: 1, level: 1 });

module.exports = mongoose.model('Timetable', TimetableSchema);
