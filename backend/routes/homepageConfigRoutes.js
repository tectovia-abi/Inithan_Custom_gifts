const express = require('express');
const router = express.Router();
const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const HomepageConfig = require('../models/HomepageConfig');
const {
  defaultRelationshipItems,
  defaultBudgetItems,
  defaultOccasionItems,
  defaultUniqueItems,
  defaultReviewItems
} = HomepageConfig;
const { protect, admin } = require('../middleware/authMiddleware');
const { uploadToS3 } = require('../utils/s3');

// Multer memory storage for fast image processing
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB max
});

// Admin auth helper that supports tokens & localhost admin requests
const adminAuthOptional = async (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    return protect(req, res, () => {
      admin(req, res, next);
    });
  }
  const isLocal = req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1' || req.hostname === 'localhost';
  if (isLocal) {
    return next();
  }
  return protect(req, res, () => admin(req, res, next));
};


const DEFAULT_NAV_LINKS = [
  { id: 1, text: 'Home', url: 'index.html' },
  { id: 2, text: 'Shop', url: 'products.html' },
  { id: 3, text: 'Categories', url: 'index.html#categories' },
  { id: 4, text: 'Customization', url: 'personalize.html' },
  { id: 5, text: 'Corporate & Bulk Orders', url: 'corporate-gifts.html' },
  { id: 6, text: 'Reseller', url: 'bulk-retail.html' },
  { id: 7, text: 'About Us', url: 'about.html' },
  { id: 8, text: 'Contact', url: 'contact.html' }
];

const DEFAULT_CATEGORY_ITEMS = [
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

const DEFAULT_MASCOT_URL = 'https://inithan-custom-gifts-prod-651484323514-eu-north-1-an.s3.eu-north-1.amazonaws.com/static/logoman.png';

const DEFAULT_HERO_SLIDES = [
  {
    id: 1,
    badge: '🎁 Signature Box',
    title: 'Complete Surprise Gift Box',
    subtitle: 'Photo Mugs, Constellation Frames & Chocolates',
    ctaText: 'Shop Collection →',
    imageUrl: 'https://inithan-custom-gifts-prod-651484323514-eu-north-1-an.s3.eu-north-1.amazonaws.com/static/hero.jpeg',
    link: 'products.html?search=Hamper'
  },
  {
    id: 2,
    badge: '✨ Grand Combo • 41% OFF',
    title: 'Luxury Curated Hamper',
    subtitle: 'Premium Satin Ribbon Luxury Box',
    ctaText: 'View Hamper →',
    imageUrl: 'images/occasions/occ_luxury_hamper.jpg',
    link: 'products.html?search=Hamper'
  },
  {
    id: 3,
    badge: '🎵 Viral Hit • Scan & Play',
    title: '3D Spotify Acrylic Plaque',
    subtitle: 'Warm Wooden LED Light Stand',
    ctaText: 'Customize Song →',
    imageUrl: 'images/unique/unique_spotify_acrylic.jpg',
    link: 'products.html?search=Spotify'
  },
  {
    id: 4,
    badge: '👑 Top Rated • 5.0 Star',
    title: 'LED Illuminated Wooden Frame',
    subtitle: 'Crisp HD Fade-Proof Photo Print',
    ctaText: 'Personalize Now →',
    imageUrl: 'images/occasions/occ_wooden_frame.jpg',
    link: 'products.html?search=Frame'
  },
  {
    id: 5,
    badge: '☕ Magic Reveal Surprise',
    title: 'Thermal Color-Changing Mug',
    subtitle: 'Pour Hot Coffee to Reveal Memories',
    ctaText: 'Create Mug →',
    imageUrl: 'images/unique/unique_magic_mug.jpg',
    link: 'products.html?search=Mug'
  }
];

const DEFAULT_CONFIG = {
  configKey: 'main_homepage',
  navbar: {
    enabled: true,
    logoUrl: 'https://inithan-custom-gifts-prod-651484323514-eu-north-1-an.s3.eu-north-1.amazonaws.com/static/logo.png',
    brandName: 'Inithan Custom Gifts',
    brandTagline: 'Made with Love',
    links: DEFAULT_NAV_LINKS
  },
  hero: {
    enabled: true,
    mascotImageUrl: DEFAULT_MASCOT_URL,
    scriptText: 'Turning Memories',
    headline: 'INTO GIFTS',
    subheadline: 'Personalized Gifts Crafted With Love For Every Occasion',
    ctaPrimaryText: 'Explore Gifts',
    ctaPrimaryLink: 'products.html',
    ctaSecondaryText: 'Customize Now',
    ctaSecondaryLink: 'customize-product.html',
    slides: DEFAULT_HERO_SLIDES
  },
  shopCategory: {
    enabled: true,
    title: 'Every Style, Every Kind of Love 💝',
    subtitle: 'Explore our curated collections crafted to make every moment memorable.',
    maxItems: 10,
    items: DEFAULT_CATEGORY_ITEMS
  },
  shopRelationship: {
    enabled: true,
    title: 'For Relationship ❤️',
    subtitle: 'Find the perfect match for the people who matter most.',
    items: defaultRelationshipItems
  },
  giftsBudget: {
    enabled: true,
    title: 'Gifts for Every Budget 🎁',
    subtitle: 'Thoughtful personalized surprises tailored to fit every budget.',
    showUnder99: true,
    showUnder199: true,
    showUnder299: true,
    showUnder499: true,
    showUnder799: true,
    showUnder999: true,
    showUnder1499: true,
    items: defaultBudgetItems
  },
  homeOccasions: {
    enabled: true,
    title: 'Celebrate Every Occasion 🎉',
    subtitle: 'Thoughtful personalized gifts crafted to make every celebration truly unforgettable.',
    maxProductsCount: 8,
    items: defaultOccasionItems
  },
  uniqueCollection: {
    enabled: true,
    title: 'Discover Unique Creations ✨',
    subtitle: 'Artisan keepsakes, illuminated wonders & handcrafted gifts you won\'t find anywhere else.',
    maxProductsCount: 8,
    items: defaultUniqueItems
  },
  customerReviews: {
    enabled: true,
    title: 'Made With Love. Loved By You. ❤️',
    subtitle: 'Real smiles and authentic stories from over 25,000+ happy customers across India.',
    maxReviewsCount: 3,
    items: defaultReviewItems
  }
};

// @route   GET /api/homepage-config
// @desc    Get homepage configuration (public)
router.get('/', async (req, res) => {
  try {
    let config = await HomepageConfig.findOne({ configKey: 'main_homepage' }).lean();
    if (!config) {
      config = await HomepageConfig.create(DEFAULT_CONFIG);
      config = config.toObject();
    } else {
      // Ensure all sections and items are fully populated
      let needsSave = false;
      if (!config.navbar || !Array.isArray(config.navbar.links) || config.navbar.links.length < 8) {
        config.navbar = DEFAULT_CONFIG.navbar;
        needsSave = true;
      }
      if (!config.hero || !Array.isArray(config.hero.slides) || config.hero.slides.length < 5) {
        if (!config.hero) {
          config.hero = DEFAULT_CONFIG.hero;
        } else {
          config.hero.mascotImageUrl = config.hero.mascotImageUrl || DEFAULT_MASCOT_URL;
          config.hero.slides = DEFAULT_HERO_SLIDES;
        }
        needsSave = true;
      }
      if (!config.shopCategory || !Array.isArray(config.shopCategory.items) || config.shopCategory.items.length < 10) {
        config.shopCategory = config.shopCategory || {};
        config.shopCategory.items = DEFAULT_CATEGORY_ITEMS;
        needsSave = true;
      }
      if (!config.shopRelationship || !Array.isArray(config.shopRelationship.items) || config.shopRelationship.items.length < 10) {
        config.shopRelationship = config.shopRelationship || {};
        config.shopRelationship.items = defaultRelationshipItems;
        needsSave = true;
      }
      if (!config.giftsBudget || !Array.isArray(config.giftsBudget.items) || config.giftsBudget.items.length < 7) {
        config.giftsBudget = config.giftsBudget || {};
        config.giftsBudget.items = defaultBudgetItems;
        needsSave = true;
      }
      if (!config.homeOccasions || !Array.isArray(config.homeOccasions.items) || config.homeOccasions.items.length < 8) {
        config.homeOccasions = config.homeOccasions || {};
        config.homeOccasions.items = defaultOccasionItems;
        needsSave = true;
      }
      if (!config.uniqueCollection || !Array.isArray(config.uniqueCollection.items) || config.uniqueCollection.items.length < 8) {
        config.uniqueCollection = config.uniqueCollection || {};
        config.uniqueCollection.items = defaultUniqueItems;
        needsSave = true;
      }
      if (!config.customerReviews || !Array.isArray(config.customerReviews.items) || config.customerReviews.items.length < 3) {
        config.customerReviews = config.customerReviews || {};
        config.customerReviews.items = defaultReviewItems;
        needsSave = true;
      }
      if (needsSave) {
        await HomepageConfig.findOneAndUpdate({ configKey: 'main_homepage' }, { $set: config });
      }
    }

    return res.status(200).json({
      success: true,
      config
    });
  } catch (error) {
    console.error('Error fetching homepage config:', error);
    return res.status(200).json({
      success: true,
      config: DEFAULT_CONFIG
    });
  }
});

// @route   POST /api/homepage-config/upload
// @desc    Upload an image for homepage (Logo photo or Category card photo)
router.post('/upload', upload.single('photo'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, message: 'No photo uploaded.' });
    }

    // Process image with Sharp and convert to WebP
    const image = sharp(file.buffer);
    const processedBuffer = await image.webp({ quality: 85 }).toBuffer();
    const cleanName = (file.originalname || 'upload').replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    const filename = `hp-${Date.now()}-${cleanName}.webp`;

    let photoUrl = null;
    // 1. Try S3 upload if configured
    try {
      if (process.env.AWS_S3_BUCKET && process.env.AWS_ACCESS_KEY_ID) {
        photoUrl = await uploadToS3(processedBuffer, filename, 'homepage');
      }
    } catch (s3Err) {
      console.warn('⚠️ S3 upload notice, saving locally:', s3Err.message);
    }

    // 2. Local fallback if S3 not available
    if (!photoUrl) {
      const uploadDir = path.join(__dirname, '../../frontend/images/uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const localFilePath = path.join(uploadDir, filename);
      fs.writeFileSync(localFilePath, processedBuffer);
      photoUrl = `images/uploads/${filename}`;
    }

    return res.status(200).json({
      success: true,
      url: photoUrl,
      message: 'Photo uploaded successfully'
    });
  } catch (err) {
    console.error('❌ Homepage Photo Upload Error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Image upload failed.' });
  }
});

// @route   PUT /api/homepage-config
// @desc    Update homepage configuration (Admin only)
router.put('/', adminAuthOptional, async (req, res) => {
  try {
    const updateData = req.body;
    delete updateData._id;
    delete updateData.configKey;

    // Enforce exactly 8 navbar links (preserve count)
    if (updateData.navbar && Array.isArray(updateData.navbar.links)) {
      updateData.navbar.links = updateData.navbar.links.slice(0, 8);
    }

    // Enforce exactly 5 hero slides (preserve count)
    if (updateData.hero && Array.isArray(updateData.hero.slides)) {
      updateData.hero.slides = updateData.hero.slides.slice(0, 5);
    }

    // Enforce exactly 10 category items (preserve count)
    if (updateData.shopCategory && Array.isArray(updateData.shopCategory.items)) {
      updateData.shopCategory.items = updateData.shopCategory.items.slice(0, 10);
    }

    let config = await HomepageConfig.findOneAndUpdate(
      { configKey: 'main_homepage' },
      { $set: updateData },
      { new: true, upsert: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Homepage configuration saved successfully!',
      config
    });
  } catch (error) {
    console.error('Error updating homepage config:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error updating homepage configuration.'
    });
  }
});

// @route   POST /api/homepage-config/reset
// @desc    Reset homepage configuration to defaults (Admin only)
router.post('/reset', adminAuthOptional, async (req, res) => {
  try {
    let config = await HomepageConfig.findOneAndUpdate(
      { configKey: 'main_homepage' },
      { $set: DEFAULT_CONFIG },
      { new: true, upsert: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Homepage configuration reset to defaults.',
      config
    });
  } catch (error) {
    console.error('Error resetting homepage config:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error resetting homepage configuration.'
    });
  }
});

module.exports = router;

