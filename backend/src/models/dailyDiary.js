const mongoose = require('mongoose');

function normalizeDay(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
}

const DailyDiarySchema = new mongoose.Schema(
  {
    date: { type: Date, required: true, index: true },
    class: { type: String, required: true, trim: true, index: true },
    section: { type: String, required: true, trim: true, index: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true, index: true },
    subjectName: { type: String, trim: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    teacherName: { type: String, trim: true },
    title: { type: String, required: true, trim: true },
    content: { type: String, default: '' },
    status: { type: String, enum: ['draft', 'published'], default: 'published', index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    editHistory: {
      type: [
        {
          editedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
          editorRole: { type: String },
          action: { type: String, default: 'update' },
          note: { type: String, default: '' },
          editedAt: { type: Date, default: Date.now }
        }
      ],
      default: []
    }
  },
  { timestamps: true }
);

DailyDiarySchema.pre('validate', function preValidate(next) {
  if (this.date) {
    const normalized = normalizeDay(this.date);
    if (normalized) this.date = normalized;
  }
  if (this.class) this.class = String(this.class).trim();
  if (this.section) this.section = String(this.section).trim();
  if (this.subjectName) this.subjectName = String(this.subjectName).trim();
  if (this.teacherName) this.teacherName = String(this.teacherName).trim();
  if (this.title) this.title = String(this.title).trim();
  next();
});

DailyDiarySchema.index({ class: 1, section: 1, subject: 1, date: 1 }, { unique: true });
DailyDiarySchema.index({ class: 1, section: 1, date: -1 });
DailyDiarySchema.index({ teacher: 1, date: -1 });
DailyDiarySchema.index({ subject: 1, date: -1 });

module.exports = mongoose.model('DailyDiary', DailyDiarySchema);
