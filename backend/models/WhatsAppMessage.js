const mongoose = require('mongoose');

const whatsAppMessageSchema = new mongoose.Schema(
  {
    messageId: {
      type: String,
      required: true,
      index: true
    },
    phoneNumberId: {
      type: String,
      default: ''
    },
    direction: {
      type: String,
      enum: ['incoming', 'outgoing'],
      default: 'incoming'
    },
    type: {
      type: String, // 'text', 'interactive', 'image', 'document', 'otp', 'template', 'status'
      default: 'text'
    },
    from: {
      type: String, // Phone number of sender
      index: true
    },
    to: {
      type: String // Phone number of recipient
    },
    senderName: {
      type: String,
      default: ''
    },
    body: {
      type: String,
      default: ''
    },
    status: {
      type: String, // 'sent', 'delivered', 'read', 'failed', 'received'
      default: 'received'
    },
    statusHistory: [
      {
        status: { type: String },
        timestamp: { type: Date, default: Date.now },
        error: { type: mongoose.Schema.Types.Mixed }
      }
    ],
    metadata: {
      type: mongoose.Schema.Types.Mixed
    }
  },
  {
    timestamps: true
  }
);

// Compound index for fast queries by phone and timestamp
whatsAppMessageSchema.index({ from: 1, createdAt: -1 });

module.exports = mongoose.model('WhatsAppMessage', whatsAppMessageSchema);

