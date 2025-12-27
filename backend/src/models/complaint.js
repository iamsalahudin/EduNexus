const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  message: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const ComplaintSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    type: { type: String },
    description: { type: String },
    status: { type: String, enum: ['open', 'assigned', 'resolved', 'closed'], default: 'open' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    comments: { type: [CommentSchema], default: [] },
    resolvedAt: { type: Date }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Complaint', ComplaintSchema);
