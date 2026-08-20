const mongoose = require('mongoose');

const offerProductSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  customOfferPrice: {
    type: Number,
    min: 0,
    default: null
  },
  customDiscountPercentage: {
    type: Number,
    min: 0,
    max: 100,
    default: null
  },
  badge: {
    type: String,
    trim: true,
    default: ''
  }
}, { _id: false });

const offerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Offer name is required'],
    trim: true
  },
  occasionType: {
    type: String,
    required: [true, 'Occasion type is required'],
    enum: [
      "Mother's Day",
      "Father's Day",
      "Valentine's Day",
      "Diwali",
      "Christmas",
      "New Year",
      "Raksha Bandhan",
      "Women's Day",
      "Birthday",
      "Anniversary",
      "Custom"
    ],
    default: "Mother's Day"
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  title: {
    type: String,
    required: [true, 'Display title is required'],
    trim: true
  },
  subtitle: {
    type: String,
    trim: true,
    default: ''
  },
  badgeText: {
    type: String,
    trim: true,
    default: 'Special Offer'
  },
  bannerImage: {
    type: String,
    trim: true,
    default: 'https://inithan-custom-gifts-prod-651484323514-eu-north-1-an.s3.eu-north-1.amazonaws.com/static/gift-box.png'
  },
  discountPercentage: {
    type: Number,
    required: [true, 'Discount percentage is required'],
    min: 0,
    max: 100,
    default: 20
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  overrideStatus: {
    type: String,
    enum: ['Auto', 'Force Active', 'Force Inactive'],
    default: 'Auto'
  },
  themeColor: {
    type: String,
    default: '#C41E3A',
    trim: true
  },
  ctaButtonText: {
    type: String,
    trim: true,
    default: 'Explore Deals Below ↓'
  },
  ctaButtonLink: {
    type: String,
    trim: true,
    default: '#offerProductsSection'
  },
  secondaryButtonText: {
    type: String,
    trim: true,
    default: 'View Full Catalog →'
  },
  secondaryButtonLink: {
    type: String,
    trim: true,
    default: 'products.html'
  },
  priority: {
    type: Number,
    default: 1
  },
  products: [offerProductSchema]
}, {
  timestamps: true
});

// Helper virtual / method to determine if offer is currently active
offerSchema.methods.isActive = function() {
  if (this.overrideStatus === 'Force Active') return true;
  if (this.overrideStatus === 'Force Inactive') return false;
  
  const now = new Date();
  return now >= new Date(this.startDate) && now <= new Date(this.endDate);
};

// Indexes
offerSchema.index({ startDate: 1, endDate: 1 });
offerSchema.index({ overrideStatus: 1 });

module.exports = mongoose.model('Offer', offerSchema);
