const mongoose = require('mongoose');

const LibraryBookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, index: true },
    author: { type: String, trim: true, default: '' },
    isbn: { type: String, trim: true, default: '', index: true },
    category: { type: String, trim: true, default: '' },
    shelf: { type: String, trim: true, default: '' },
    totalCopies: { type: Number, min: 1, default: 1 },
    availableCopies: { type: Number, min: 0, default: 1 },
    active: { type: Boolean, default: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

LibraryBookSchema.index({ title: 1, author: 1 });
LibraryBookSchema.index({ category: 1, active: 1 });

module.exports = mongoose.model('LibraryBook', LibraryBookSchema);
