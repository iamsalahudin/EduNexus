const mongoose = require('mongoose');

function normalizeKey(value) {
  return String(value || '').trim().toLowerCase();
}

const SubjectSchema = new mongoose.Schema(
  {
    // Backward-compat: legacy DBs may have a unique index on `code`.
    // Keep it populated to avoid duplicate-null insert failures.
    code: { type: String, trim: true, index: true },

    // Subjects are defined per class (no section)
    className: { type: String, required: true, trim: true, index: true },
    classKey: { type: String, required: true, trim: true, index: true },

    name: { type: String, required: true, trim: true },
    nameKey: { type: String, required: true, trim: true, index: true },

    active: { type: Boolean, default: true, index: true },
    order: { type: Number, default: 0, index: true }
  },
  { timestamps: true }
);

SubjectSchema.pre('validate', function preValidate(next) {
  if (this.className) {
    this.className = String(this.className).trim();
    this.classKey = normalizeKey(this.className);
  }
  if (this.name) {
    this.name = String(this.name).trim();
    this.nameKey = normalizeKey(this.name);
  }

  if (this.classKey && this.nameKey) {
    this.code = `${this.classKey}:${this.nameKey}`;
  }
  next();
});

SubjectSchema.index({ classKey: 1, nameKey: 1 }, { unique: true });
SubjectSchema.index({ classKey: 1, order: 1, nameKey: 1 });
SubjectSchema.index({ code: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Subject', SubjectSchema);

