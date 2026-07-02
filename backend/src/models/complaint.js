const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  message: { type: String, required: true, trim: true },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const ComplaintSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    category: { type: String, default: 'general', index: true },
    type: { type: String },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
      index: true
    },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: ['open', 'assigned', 'in_progress', 'resolved', 'closed'],
      default: 'open',
      index: true
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    relatedToStudent: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    comments: { type: [CommentSchema], default: [] },
    resolvedAt: { type: Date }
  },
  { timestamps: true }
);

// Normalize priority casing before validation so values like "High" (from the
// agent or older data) don't fail the lowercase enum on any save() path.
ComplaintSchema.pre('validate', function (next) {
  if (this.priority != null) this.priority = String(this.priority).trim().toLowerCase();
  next();
});

ComplaintSchema.index({ createdBy: 1, createdAt: -1 });
ComplaintSchema.index({ assignedTo: 1, status: 1, createdAt: -1 });
ComplaintSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Complaint', ComplaintSchema);
