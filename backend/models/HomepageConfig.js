const mongoose = require('mongoose');

const defaultNavLinks = [
  { id: 1, text: 'Home', url: 'index.html' },
  { id: 2, text: 'Shop', url: 'products.html' },
  { id: 3, text: 'Categories', url: 'index.html#categories' },
  { id: 4, text: 'Customization', url: 'personalize.html' },
  { id: 5, text: 'Corporate & Bulk Orders', url: 'corporate-gifts.html' },
  { id: 6, text: 'Reseller', url: 'bulk-retail.html' },
  { id: 7, text: 'About Us', url: 'about.html' },
  { id: 8, text: 'Contact', url: 'contact.html' }
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

const defaultRelationshipItems = [
  { id: 1, title: 'Mother', imageUrl: 'images/relationships/mother.jpg', link: 'products.html?search=Mother' },
  { id: 2, title: 'Father', imageUrl: 'images/relationships/father.jpg', link: 'products.html?search=Father' },
  { id: 3, title: 'Husband', imageUrl: 'images/relationships/husband.jpg', link: 'products.html?search=Husband' },
  { id: 4, title: 'Wife', imageUrl: 'images/relationships/wife.jpg', link: 'products.html?search=Wife' },
  { id: 5, title: 'Sister', imageUrl: 'images/relationships/sister.jpg', link: 'products.html?search=Sister' },
  { id: 6, title: 'Brother', imageUrl: 'images/relationships/brother.jpg', link: 'products.html?search=Brother' },
  { id: 7, title: 'Couple', imageUrl: 'images/relationships/couple.jpg', link: 'products.html?search=Couple' },
  { id: 8, title: 'Boyfriend', imageUrl: 'images/relationships/boyfriend.jpg', link: 'products.html?search=Boyfriend' },
  { id: 9, title: 'Girlfriend', imageUrl: 'images/relationships/girlfriend.jpg', link: 'products.html?search=Girlfriend' },
  { id: 10, title: 'Friend', imageUrl: 'images/relationships/friend.jpg', link: 'products.html?search=Friend' }
];

const defaultBudgetItems = [
  { id: 1, pill: 'Pocket Pick', tag: 'Pocket Friendly', price: '₹99', imageUrl: 'images/budget/under99.jpg', link: 'products.html?budget=99' },
  { id: 2, pill: 'Everyday Fav', tag: 'Ceramic & Metal', price: '₹199', imageUrl: 'images/budget/under199.jpg', link: 'products.html?budget=199' },
  { id: 3, pill: 'Trending', tag: 'Sweet Moments', price: '₹299', imageUrl: 'images/budget/under299.jpg', link: 'products.html?budget=299' },
  { id: 4, pill: 'Most Popular', tag: 'Warm & Cozy', price: '₹499', imageUrl: 'images/budget/under499.jpg', link: 'products.html?budget=499' },
  { id: 5, pill: 'Best Value', tag: 'LED & Keepsakes', price: '₹799', imageUrl: 'images/budget/under799.jpg', link: 'products.html?budget=799' },
  { id: 6, pill: 'Signature', tag: 'Premium Picks', price: '₹999', imageUrl: 'images/budget/under999.jpg', link: 'products.html?budget=999' },
  { id: 7, pill: 'Luxury Hamper', tag: 'Grand Gift Sets', price: '₹1,499', imageUrl: 'images/budget/under1499.jpg', link: 'products.html?budget=1499' }
];

const defaultOccasionItems = [
  {
    id: 1,
    badge: '🎂 Birthday Pick',
    discount: '23% OFF',
    title: 'Personalized Photo Puzzle Cube',
    curPrice: '₹890.00',
    mrpPrice: '₹1,150.00',
    imageUrl: 'images/occasions/occ_puzzle_cube.jpg',
    link: 'products.html?search=Puzzle',
    tags: 'birthday special anniversary',
    rating: '★ 4.9 (1,240)'
  },
  {
    id: 2,
    badge: '🎵 Scan & Play',
    discount: '27% OFF',
    title: 'Custom Star Constellation Frame',
    curPrice: '₹599.00',
    mrpPrice: '₹820.00',
    imageUrl: 'images/occasions/occ_spotify_frame.jpg',
    link: 'products.html?search=Spotify',
    tags: 'love anniversary valentine',
    rating: '★ 4.9 (2,180)'
  },
  {
    id: 3,
    badge: '✨ Top Rated',
    discount: '38% OFF',
    title: 'LED Illuminated Wooden Frame',
    curPrice: '₹799.00',
    mrpPrice: '₹1,299.00',
    imageUrl: 'images/occasions/occ_wooden_frame.jpg',
    link: 'products.html?search=Frame',
    tags: 'anniversary birthday housewarming love',
    rating: '★ 5.0 (3,410)'
  },
  {
    id: 4,
    badge: '💝 Most Loved',
    discount: '44% OFF',
    title: 'Custom Satin Heart Photo Cushion',
    curPrice: '₹499.00',
    mrpPrice: '₹899.00',
    imageUrl: 'images/occasions/occ_heart_cushion.jpg',
    link: 'products.html?search=Pillow',
    tags: 'love valentine smile',
    rating: '★ 4.8 (1,650)'
  },
  {
    id: 5,
    badge: '📅 New Arrival',
    discount: '47% OFF',
    title: 'Acrylic Daily Photo Calendar Stand',
    curPrice: '₹798.00',
    mrpPrice: '₹1,499.00',
    imageUrl: 'images/occasions/occ_daily_calendar.jpg',
    link: 'products.html?search=Calendar',
    tags: 'housewarming farewell special',
    rating: '★ 4.8 (720)'
  },
  {
    id: 6,
    badge: '🎁 Grand Combo',
    discount: '41% OFF',
    title: 'Grand Luxury Couple Hamper',
    curPrice: '₹1,299.00',
    mrpPrice: '₹2,199.00',
    imageUrl: 'images/occasions/occ_luxury_hamper.jpg',
    link: 'products.html?search=Hamper',
    tags: 'anniversary love special',
    rating: '★ 5.0 (2,150)'
  },
  {
    id: 7,
    badge: '👑 Handcrafted',
    discount: '55% OFF',
    title: 'Custom Engraved Photo Pendant',
    curPrice: '₹490.00',
    mrpPrice: '₹1,099.00',
    imageUrl: 'images/occasions/occ_engraved_pendant.jpg',
    link: 'products.html?search=Jewelry',
    tags: 'women birthday farewell love',
    rating: '★ 4.7 (980)'
  },
  {
    id: 8,
    badge: '✨ Ambient Glow',
    discount: '42% OFF',
    title: 'Magical Glowing Snow Globe Lamp',
    curPrice: '₹699.00',
    mrpPrice: '₹1,199.00',
    imageUrl: 'images/occasions/occ_snowglobe_lamp.jpg',
    link: 'products.html?search=Lamp',
    tags: 'smile birthday special housewarming',
    rating: '★ 4.9 (1,340)'
  }
];

const defaultUniqueItems = [
  {
    id: 1,
    badge: '💡 Ambient Glow',
    discount: '57% OFF',
    title: 'Couple Glow Name Magnet',
    curPrice: '₹299.00',
    mrpPrice: '₹699.00',
    imageUrl: 'images/unique/unique_glow_magnet.jpg',
    link: 'products.html?search=Magnet',
    rating: '★ 4.9 (1,850)'
  },
  {
    id: 2,
    badge: '✨ Top Rated',
    discount: '55% OFF',
    title: 'Illuminated Glow Photo Frame',
    curPrice: '₹299.00',
    mrpPrice: '₹670.00',
    imageUrl: 'images/unique/unique_glow_frame.jpg',
    link: 'products.html?search=Glow',
    rating: '★ 4.8 (1,420)'
  },
  {
    id: 3,
    badge: '🗺️ Coordinates',
    discount: '37% OFF',
    title: 'Customized Landsat Map Frame',
    curPrice: '₹490.00',
    mrpPrice: '₹780.00',
    imageUrl: 'images/unique/unique_landsat_frame.jpg',
    link: 'products.html?search=Landsat',
    rating: '★ 4.9 (980)'
  },
  {
    id: 4,
    badge: '📻 Retro Beats',
    discount: '37% OFF',
    title: 'Own Retro Radio Music Frame',
    curPrice: '₹490.00',
    mrpPrice: '₹777.00',
    imageUrl: 'images/unique/unique_radio_frame.jpg',
    link: 'products.html?search=Radio',
    rating: '★ 4.8 (1,150)'
  },
  {
    id: 5,
    badge: '💎 Crystal Clear',
    discount: '71% OFF',
    title: 'Transparent Photo Crystal Keychain',
    curPrice: '₹100.00',
    mrpPrice: '₹350.00',
    imageUrl: 'images/unique/unique_photo_keychain.jpg',
    link: 'products.html?search=Keychain',
    rating: '★ 4.9 (2,650)'
  },
  {
    id: 6,
    badge: '☕ Magic Reveal',
    discount: '42% OFF',
    title: 'Thermal Color-Changing Magic Mug',
    curPrice: '₹349.00',
    mrpPrice: '₹599.00',
    imageUrl: 'images/unique/unique_magic_mug.jpg',
    link: 'products.html?search=Mug',
    rating: '★ 4.9 (1,740)'
  },
  {
    id: 7,
    badge: '🪵 Laser Art',
    discount: '47% OFF',
    title: 'Laser Engraved Wooden Memory Plaque',
    curPrice: '₹449.00',
    mrpPrice: '₹849.00',
    imageUrl: 'images/unique/unique_wood_engraving.jpg',
    link: 'products.html?search=Engraving',
    rating: '★ 4.8 (890)'
  },
  {
    id: 8,
    badge: '🎵 Scan & Play',
    discount: '45% OFF',
    title: 'Illuminated Spotify Acrylic Song Plaque',
    curPrice: '₹599.00',
    mrpPrice: '₹1,099.00',
    imageUrl: 'images/unique/unique_spotify_acrylic.jpg',
    link: 'products.html?search=Spotify',
    rating: '★ 5.0 (3,120)'
  }
];

const defaultReviewItems = [
  {
    id: 1,
    userName: 'Priya S.',
    userCity: 'Coimbatore',
    stars: 5,
    quote: 'Beautifully made and exactly what I wanted. The perfect gift!',
    verified: true
  },
  {
    id: 2,
    userName: 'Karthik & Divya',
    userCity: 'Chennai',
    stars: 5,
    quote: 'Ordered an anniversary frame with our photos. The wood finish and photo print exceeded all expectations. Fast delivery too!',
    verified: true
  },
  {
    id: 3,
    userName: 'Sneha M.',
    userCity: 'Bengaluru',
    stars: 5,
    quote: 'The magic mug surprise was priceless! When hot coffee was poured, our family photo appeared so vibrantly. Loved it!',
    verified: true
  }
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
    subtitle: { type: String, default: 'Find the perfect match for the people who matter most.' },
    items: [{ type: mongoose.Schema.Types.Mixed }]
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
    showUnder1499: { type: Boolean, default: true },
    items: [{ type: mongoose.Schema.Types.Mixed }]
  },

  // Section 5: Celebrate Every Occasion (with Product Count edited by admin)
  homeOccasions: {
    enabled: { type: Boolean, default: true },
    title: { type: String, default: 'Celebrate Every Occasion 🎉' },
    subtitle: { type: String, default: 'Thoughtful personalized gifts crafted to make every celebration truly unforgettable.' },
    maxProductsCount: { type: Number, default: 8, min: 2, max: 50 },
    items: [{ type: mongoose.Schema.Types.Mixed }]
  },

  // Section 6: Discover Unique Creations (with Product Count edited by admin)
  uniqueCollection: {
    enabled: { type: Boolean, default: true },
    title: { type: String, default: 'Discover Unique Creations ✨' },
    subtitle: { type: String, default: 'Artisan keepsakes, illuminated wonders & handcrafted gifts you won\'t find anywhere else.' },
    maxProductsCount: { type: Number, default: 8, min: 2, max: 50 },
    items: [{ type: mongoose.Schema.Types.Mixed }]
  },

  // Section 7: Customer Reviews Spotlight
  customerReviews: {
    enabled: { type: Boolean, default: true },
    title: { type: String, default: 'Made With Love. Loved By You. ❤️' },
    subtitle: { type: String, default: 'Real smiles and authentic stories from over 25,000+ happy customers across India.' },
    maxReviewsCount: { type: Number, default: 3, min: 1, max: 12 },
    items: [{ type: mongoose.Schema.Types.Mixed }]
  }
}, { timestamps: true });

module.exports = mongoose.model('HomepageConfig', homepageConfigSchema);
module.exports.defaultNavLinks = defaultNavLinks;
module.exports.defaultCategoryItems = defaultCategoryItems;
module.exports.defaultRelationshipItems = defaultRelationshipItems;
module.exports.defaultBudgetItems = defaultBudgetItems;
module.exports.defaultOccasionItems = defaultOccasionItems;
module.exports.defaultUniqueItems = defaultUniqueItems;
module.exports.defaultReviewItems = defaultReviewItems;
