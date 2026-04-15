const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  message: { type: String, required: true, trim: true },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const ComplaintSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    category: {
      type: String,
      enum: ['general', 'academic', 'discipline', 'behavior', 'transport', 'fees', 'other'],
      default: 'general',
      index: true
    },
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

ComplaintSchema.index({ createdBy: 1, createdAt: -1 });
ComplaintSchema.index({ assignedTo: 1, status: 1, createdAt: -1 });
ComplaintSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Complaint', ComplaintSchema);
