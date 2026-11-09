const mongoose = require('mongoose');

const passwordResetOtpSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    otpHash: {
      type: String,
      required: true
    },
    attempts: {
      type: Number,
      default: 0
    },
    maxAttempts: {
      type: Number,
      default: 5
    },
    isUsed: {
      type: Boolean,
      default: false
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 } // Auto-removes document after expiry via MongoDB TTL
    }
  },
  {
    timestamps: true
  }
);

// Compound index for querying active OTP by email and usage status
passwordResetOtpSchema.index({ email: 1, isUsed: 1 });

module.exports = mongoose.model('PasswordResetOtp', passwordResetOtpSchema);

