const mongoose = require('mongoose');

const defaultNavLinks = [
  { id: 1, text: 'Home', url: 'index.html' },
  { id: 2, text: 'All Products', url: 'products.html' },
  { id: 3, text: 'Love & Romance', url: 'love-romance.html' },
  { id: 4, text: 'Birthday', url: 'birthday.html' },
  { id: 5, text: 'Special Occasions', url: 'special-occasions.html' },
  { id: 6, text: 'For Her & Him', url: 'for-her-and-him.html' },
  { id: 7, text: 'Corporate Gifts', url: 'corporate-gifts.html' },
  { id: 8, text: 'Personalize', url: 'personalize.html' }
];

const defaultCategoryItems = [
  { id: 1, title: 'Puzzles', imageUrl: 'images/categories/puzzles.jpg', link: 'products.html?search=Puzzle' },
  { id: 2, title: 'Frames', imageUrl: 'images/categories/frames.jpg', link: 'products.html?search=Frame' },
  { id: 3, title: 'Mugs', imageUrl: 'images/categories/mugs.jpg', link: 'products.html?search=Mug' },
  { id: 4, title: 'Engravings', imageUrl: 'images/categories/engravings.jpg', link: 'products.html?search=Engraving' },
  { id: 5, title: 'Calendar', imageUrl: 'images/categories/calendar.jpg', link: 'products.html?search=Calendar' },
  { id: 6, title: 'Name Gifts', imageUrl: 'images/categories/name-gifts.jpg', link: 'products.html?search=Name' },
  { id: 7, title: 'Hampers', imageUrl: 'images/categories/hampers.jpg', link: 'products.html?search=Hamper' },
  { id: 8, title: 'Combo', imageUrl: 'images/categories/combo.jpg', link: 'products.html?search=Combo' },
  { id: 9, title: 'Long Distance', imageUrl: 'images/categories/long-distance.jpg', link: 'products.html?search=Long+Distance' },
  { id: 10, title: 'Licence', imageUrl: 'images/categories/licence.jpg', link: 'products.html?search=Licence' }
];

const homepageConfigSchema = new mongoose.Schema({
  configKey: { type: String, default: 'main_homepage', unique: true },

  // Top Header Navigation Bar (Navbar)
  navbar: {
    enabled: { type: Boolean, default: true },
    logoUrl: { type: String, default: 'https://inithan-custom-gifts-prod-651484323514-eu-north-1-an.s3.eu-north-1.amazonaws.com/static/logo.png' },
    brandName: { type: String, default: 'Inithan Custom Gifts' },
    brandTagline: { type: String, default: 'Made with Love' },
    links: [
      {
        id: { type: Number, default: 1 },
        text: { type: String, default: 'Home' },
        url: { type: String, default: 'index.html' }
      }
    ]
  },

  // Section 1: Hero
  hero: {
    enabled: { type: Boolean, default: true },
    mascotImageUrl: { type: String, default: 'https://inithan-custom-gifts-prod-651484323514-eu-north-1-an.s3.eu-north-1.amazonaws.com/static/logoman.png' },
    scriptText: { type: String, default: 'Turning Memories' },
    headline: { type: String, default: 'INTO GIFTS' },
    subheadline: { type: String, default: 'Personalized Gifts Crafted With Love For Every Occasion' },
    ctaPrimaryText: { type: String, default: 'Explore Gifts' },
    ctaPrimaryLink: { type: String, default: 'products.html' },
    ctaSecondaryText: { type: String, default: 'Customize Now' },
    ctaSecondaryLink: { type: String, default: 'customize-product.html' },
    slides: [
      {
        id: { type: Number, default: 1 },
        badge: { type: String, default: '🎁 Signature Box' },
        title: { type: String, default: 'Complete Surprise Gift Box' },
        subtitle: { type: String, default: 'Photo Mugs, Constellation Frames & Chocolates' },
        ctaText: { type: String, default: 'Shop Collection →' },
        imageUrl: { type: String, default: 'https://inithan-custom-gifts-prod-651484323514-eu-north-1-an.s3.eu-north-1.amazonaws.com/static/hero.jpeg' },
        link: { type: String, default: 'products.html?search=Hamper' }
      }
    ]
  },

  // Section 2: Shop by Category (10 Collection Cards)
  shopCategory: {
    enabled: { type: Boolean, default: true },
    title: { type: String, default: 'Every Style, Every Kind of Love 💝' },
    subtitle: { type: String, default: 'Explore our curated collections crafted to make every moment memorable.' },
    maxItems: { type: Number, default: 10, min: 2, max: 20 },
    items: [
      {
        id: { type: Number, default: 1 },
        title: { type: String, default: 'Puzzles' },
        imageUrl: { type: String, default: 'images/categories/puzzles.jpg' },
        link: { type: String, default: 'products.html?search=Puzzle' }
      }
    ]
  },

  // Section 3: Shop by Relationship
  shopRelationship: {
    enabled: { type: Boolean, default: true },
    title: { type: String, default: 'For Relationship ❤️' },
    subtitle: { type: String, default: 'Find the perfect match for the people who matter most.' }
  },

  // Section 4: Gifts by Budget
  giftsBudget: {
    enabled: { type: Boolean, default: true },
    title: { type: String, default: 'Gifts for Every Budget 🎁' },
    subtitle: { type: String, default: 'Thoughtful personalized surprises tailored to fit every budget.' },
    showUnder99: { type: Boolean, default: true },
    showUnder199: { type: Boolean, default: true },
    showUnder299: { type: Boolean, default: true },
    showUnder499: { type: Boolean, default: true },
    showUnder799: { type: Boolean, default: true },
    showUnder999: { type: Boolean, default: true },
    showUnder1499: { type: Boolean, default: true }
  },

  // Section 5: Celebrate Every Occasion (with Product Count edited by admin)
  homeOccasions: {
    enabled: { type: Boolean, default: true },
    title: { type: String, default: 'Celebrate Every Occasion 🎉' },
    subtitle: { type: String, default: 'Thoughtful personalized gifts crafted to make every celebration truly unforgettable.' },
    maxProductsCount: { type: Number, default: 8, min: 2, max: 50 }
  },

  // Section 6: Discover Unique Creations (with Product Count edited by admin)
  uniqueCollection: {
    enabled: { type: Boolean, default: true },
    title: { type: String, default: 'Discover Unique Creations ✨' },
    subtitle: { type: String, default: 'Artisan keepsakes, illuminated wonders & handcrafted gifts you won\'t find anywhere else.' },
    maxProductsCount: { type: Number, default: 8, min: 2, max: 50 }
  },

  // Section 7: Customer Reviews Spotlight
  customerReviews: {
    enabled: { type: Boolean, default: true },
    title: { type: String, default: 'Made With Love. Loved By You. ❤️' },
    subtitle: { type: String, default: 'Real smiles and authentic stories from over 25,000+ happy customers across India.' },
    maxReviewsCount: { type: Number, default: 3, min: 1, max: 12 }
  }
}, { timestamps: true });

module.exports = mongoose.model('HomepageConfig', homepageConfigSchema);
module.exports.defaultNavLinks = defaultNavLinks;
module.exports.defaultCategoryItems = defaultCategoryItems;
