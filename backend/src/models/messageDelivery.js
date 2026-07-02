const mongoose = require('mongoose');

const MessageDeliverySchema = new mongoose.Schema(
  {
    message: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', required: true },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['sent', 'delivered', 'read'], default: 'sent' },
    sentAt: { type: Date, default: Date.now },
    deliveredAt: { type: Date },
    readAt: { type: Date }
  },
  { timestamps: true }
);

MessageDeliverySchema.index({ message: 1, recipient: 1 }, { unique: true });
MessageDeliverySchema.index({ recipient: 1, status: 1 });

module.exports = mongoose.model('MessageDelivery', MessageDeliverySchema);
