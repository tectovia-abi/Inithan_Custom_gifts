const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  // Basic Info
  name: { type: String, required: [true, 'Product name is required'], trim: true },
  code: { type: String, required: [true, 'Product code is required'], unique: true, uppercase: true, trim: true },
  category: { type: String, default: 'Custom Gifts', trim: true },
  subCategory: { type: String, default: '', trim: true },
  occasions: [{ type: String, trim: true }],
  brand: { type: String, default: 'Inithat Custom Gifts', trim: true },
  productType: { type: String, default: 'Physical', trim: true },
  keywords: { type: String, default: '', trim: true },
  status: { type: String, default: 'Active', enum: ['Active', 'Inactive', 'Draft', 'Out of Stock'] },
  
  // Pricing
  price: { type: Number, required: [true, 'Selling price is required'], min: 0 },
  discountPrice: { type: Number, default: 0, min: 0 },
  offerPercentage: { type: Number, default: 0, min: 0, max: 100 },
  costPrice: { type: Number, default: 0, min: 0 },

  // Special Occasion Offer Link
  offerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Offer', default: null },
  offerPrice: { type: Number, default: null, min: 0 },
  offerDiscountPercent: { type: Number, default: null, min: 0, max: 100 },
  offerBadge: { type: String, default: '', trim: true },

  // Images & Description
  imageUrl: { type: String, default: 'https://inithan-custom-gifts-prod-651484323514-eu-north-1-an.s3.eu-north-1.amazonaws.com/static/gift-box.png', trim: true },
  galleryImages: [{ type: String, trim: true }],
  shortDescription: { type: String, default: '', trim: true },
  detailedDescription: { type: String, default: '', trim: true },

  // Inventory & Shipping
  stockQuantity: { type: Number, default: 50, min: 0 },
  lowStockAlert: { type: Number, default: 5, min: 0 },
  skuBarcode: { type: String, default: '', trim: true },
  weight: { type: Number, default: 0.5, min: 0 },
  dimensions: {
    length: { type: Number, default: 0 },
    width: { type: Number, default: 0 },
    height: { type: Number, default: 0 },
    unit: { type: String, default: 'cm', trim: true },
    description: { type: String, default: '', trim: true }
  },
  shippingType: { type: String, default: 'Standard Delivery', trim: true },

  // SEO & Visibility
  metaTitle: { type: String, default: '', trim: true },
  metaDescription: { type: String, default: '', trim: true },
  urlSlug: { type: String, default: '', trim: true },
  visibility: { type: String, default: 'Visible (Public)', trim: true },

  // Customization Options
  allowCustomText: { type: Boolean, default: true },
  customTextLabel: { type: String, default: 'Custom Name / Message to Print', trim: true },
  allowCustomImage: { type: Boolean, default: true },
  maxCustomImages: { type: Number, default: 1, min: 1, max: 10 },

  // Feature Flags
  isFeatured: { type: Boolean, default: false },
  isBestSeller: { type: Boolean, default: false },
  isNewArrival: { type: Boolean, default: true },
  allowReviews: { type: Boolean, default: true },
  showOnHomepage: { type: Boolean, default: true },

  // Variants
  size: { type: String, default: '', trim: true },
  color: { type: String, default: '', trim: true },
  shape: { type: String, default: '', trim: true },
  capacity: { type: String, default: '', trim: true },
  otherVariants: { type: String, default: '', trim: true },

  createdAt: { type: Date, default: Date.now }
});

// Indexes for performance optimization
productSchema.index({ category: 1 });
productSchema.index({ status: 1 });
productSchema.index({ name: 'text' });
productSchema.index({ isFeatured: 1 });
productSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Product', productSchema);
