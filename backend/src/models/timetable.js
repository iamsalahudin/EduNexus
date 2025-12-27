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
    class: { type: String, required: true, index: true },
    section: { type: String },
    year: { type: Number, required: true },
    slots: { type: [TimetableSlotSchema], default: [] },
    isActive: { type: Boolean, default: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

TimetableSchema.index({ class: 1, section: 1, year: 1 }, { unique: true });
TimetableSchema.index({ isActive: 1, year: 1 });

module.exports = mongoose.model('Timetable', TimetableSchema);
