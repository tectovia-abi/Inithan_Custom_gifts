const mongoose = require('mongoose');

const bulkInquirySchema = new mongoose.Schema({
  name: { type: String, required: true },
  company: { type: String },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  whatsapp: { type: String },
  city: { type: String, required: true },
  state: { type: String },
  
  products: [{ type: String }],
  quantity: { type: Number, required: true },
  budgetRange: { type: String, required: true },
  deliveryDate: { type: Date },
  productDescription: { type: String, required: true },
  
  customization: { type: String, required: true },
  occasion: { type: String, required: true },
  designNotes: { type: String },
  
  packaging: { type: String },
  deliveryType: { type: String },
  orderType: { type: String },
  
  source: { type: String },
  contactPref: { type: String },
  notes: { type: String },
  userEmail: { type: String }, // To track which account submitted it
  
  referenceId: { type: String, unique: true },
  submittedAt: { type: Date, default: Date.now },
  status: { type: String, default: 'New', enum: ['New', 'Reviewed', 'Resolved', 'Cancelled'] } // Updated status options as requested
});

bulkInquirySchema.pre('save', async function (next) {
  if (!this.referenceId) {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
    const random = Math.floor(100 + Math.random() * 900); // 3 digit random
    this.referenceId = `INQ-${dateStr}-${random}`;
  }
  next();
});

// Indexes for performance optimization
bulkInquirySchema.index({ email: 1 });
bulkInquirySchema.index({ userEmail: 1 });
bulkInquirySchema.index({ status: 1 });
bulkInquirySchema.index({ submittedAt: -1 });

module.exports = mongoose.model('BulkInquiry', bulkInquirySchema);