const mongoose = require('mongoose');

function generateOrderNumber() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(100000 + Math.random() * 900000);
  return 'ICG-' + date + '-' + random;
}

const orderItemSchema = new mongoose.Schema(
  {
    productId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: false, default: null },
    name:         { type: String, required: true, trim: true },
    image:        { type: String, default: '', trim: true },
    quantity:     { type: Number, required: true, min: 1 },
    unitPrice:    { type: Number, required: true, min: 0 },
    subtotal:     { type: Number, required: true, min: 0 },
    customText:   { type: String, default: '', trim: true },
    customImages: [{ type: String, trim: true }],
  },
  { _id: false }
);

const statusHistorySchema = new mongoose.Schema(
  {
    status:    { type: String, required: true },
    changedAt: { type: Date,   default: Date.now },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { _id: false }
);

const activityLogSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: [
        'order_created',
        'payment_verified',
        'status_updated',
        'address_updated',
        'tracking_added',
        'note_added',
        'cancelled',
        'refund_started',
        'refund_completed',
      ],
    },
    oldValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    newValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    performedBy: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },
      name: {
        type: String,
        default: 'System',
        trim: true,
      },
      role: {
        type: String,
        default: 'system',
        trim: true,
      },
    },
    note: {
      type: String,
      default: '',
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type:    String,
      unique:  true,
      index:   true,
      default: generateOrderNumber,
    },
    razorpayOrderId: {
      type:   String,
      unique: true,
      index:  true,
      sparse: true,
    },
    razorpayPaymentId: {
      type:   String,
      unique: true,
      index:  true,
      sparse: true,
    },
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },
    customer: {
      name:  { type: String, required: true, trim: true },
      email: { type: String, required: true, lowercase: true, trim: true },
      phone: { type: String, required: true, trim: true },
    },
    shippingAddress: {
      address1: { type: String, required: true, trim: true },
      address2: { type: String, default: '',   trim: true },
      city:     { type: String, required: true, trim: true },
      district: { type: String, required: true, trim: true },
      state:    { type: String, required: true, trim: true },
      pincode:  { type: String, required: true, trim: true },
    },
    items: { type: [orderItemSchema], required: true },
    subtotal:       { type: Number, required: true, min: 0 },
    shippingCharge: { type: Number, default: 0,    min: 0 },
    discount:       { type: Number, default: 0,    min: 0 },
    totalAmount:    { type: Number, required: true, min: 0 },
    paymentMethod:   { type: String, default: 'online', enum: ['online'] },
    paymentProvider: { type: String, default: 'razorpay', enum: ['razorpay'] },
    paymentStatus: {
      type:    String,
      default: 'paid',
      enum:    ['paid', 'failed'],
      index:   true,
    },
    orderStatus: {
      type:    String,
      default: 'placed',
      enum:    ['placed', 'processing', 'shipped', 'delivered', 'cancelled'],
      index:   true,
    },
    lastHandledBy: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },
      name: {
        type: String,
        default: '',
        trim: true,
      },
      role: {
        type: String,
        default: '',
        trim: true,
      },
    },
    lastUpdatedAt: {
      type: Date,
      default: Date.now,
    },
    statusHistory: {
      type: [statusHistorySchema],
      default: [],
    },
    activityLog: {
      type: [activityLogSchema],
      default: [],
    },
  },
  { timestamps: true }
);

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1, createdAt: -1 });
orderSchema.index({ 'customer.email': 1 });
orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
