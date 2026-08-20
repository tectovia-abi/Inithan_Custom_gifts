const Offer = require('../models/Offer');
const Product = require('../models/Product');
const mongoose = require('mongoose');

const slugify = (text) => {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

// Default seed offers for holiday occasions
const defaultSeedOffers = [
  {
    name: "Mother's Day Special",
    occasionType: "Mother's Day",
    slug: "mothers-day-special",
    title: "Celebrate Mom with Handcrafted Personalized Treasures 🌸",
    subtitle: "Make her feel cherished with custom photo frames, engraved jewelry, and personalized mugs at up to 35% OFF!",
    badgeText: "Mother's Day SPL",
    bannerImage: "https://inithan-custom-gifts-prod-651484323514-eu-north-1-an.s3.eu-north-1.amazonaws.com/static/custom-frame.png",
    discountPercentage: 25,
    startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    endDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),   // 12 days from now
    overrideStatus: "Auto",
    themeColor: "#C41E3A",
    priority: 1
  },
  {
    name: "Valentine's Day Bonanza",
    occasionType: "Valentine's Day",
    slug: "valentines-day-bonanza",
    title: "Express Your Love with Romantic Custom Gifts ❤️",
    subtitle: "Couple photo pillows, personalized music plaques, and customized wooden keepsakes.",
    badgeText: "Valentine Deal",
    bannerImage: "https://inithan-custom-gifts-prod-651484323514-eu-north-1-an.s3.eu-north-1.amazonaws.com/static/custom-pillow.png",
    discountPercentage: 30,
    startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    overrideStatus: "Auto",
    themeColor: "#E11D48",
    priority: 2
  },
  {
    name: "Diwali Festive Bonanza",
    occasionType: "Diwali",
    slug: "diwali-festive-bonanza",
    title: "Light Up Celebrations with Festive Corporate & Family Gifts 🪔",
    subtitle: "Exclusive custom gift hampers, premium brass trophies, and personalized dry fruit boxes.",
    badgeText: "Diwali Mega Sale",
    bannerImage: "https://inithan-custom-gifts-prod-651484323514-eu-north-1-an.s3.eu-north-1.amazonaws.com/static/gift-box.png",
    discountPercentage: 20,
    startDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000),
    overrideStatus: "Auto",
    themeColor: "#D97706",
    priority: 3
  }
];

// Helper to determine status string
const computeOfferStatus = (offer) => {
  if (offer.overrideStatus === 'Force Active') return 'Live';
  if (offer.overrideStatus === 'Force Inactive') return 'Paused';
  const now = new Date();
  const start = new Date(offer.startDate);
  const end = new Date(offer.endDate);
  if (now < start) return 'Upcoming';
  if (now > end) return 'Expired';
  return 'Live';
};

// @route   GET /api/offers
const getOffers = async (req, res) => {
  try {
    const offers = await Offer.find().populate('products.productId').sort({ priority: 1, createdAt: -1 });

    const formatted = offers.map(o => {
      const plain = o.toObject();
      plain.computedStatus = computeOfferStatus(o);
      plain.productsCount = Array.isArray(o.products) ? o.products.length : 0;
      return plain;
    });

    return res.status(200).json({
      success: true,
      count: formatted.length,
      offers: formatted
    });
  } catch (error) {
    console.error('❌ [OFFERS BACKEND] Get Offers Error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching offers.'
    });
  }
};

// @route   GET /api/offers/active
// @desc    Get currently active offers for Storefront (offers.html & catalog)
// @access  Public
const getActiveOffers = async (req, res) => {
  try {
    const now = new Date();

    // Query active offers
    const offers = await Offer.find({
      $or: [
        { overrideStatus: 'Force Active' },
        {
          overrideStatus: 'Auto',
          startDate: { $lte: now },
          endDate: { $gte: now }
        }
      ]
    }).populate({
      path: 'products.productId',
      match: { status: 'Active' }
    }).sort({ priority: 1, createdAt: -1 });

    // Format offers and products with effective prices
    const activeOffers = offers.map(offer => {
      const offerObj = offer.toObject();
      offerObj.computedStatus = 'Live';

      // Resolve products list with pricing calculation
      const validProducts = (offer.products || [])
        .filter(p => p.productId && p.productId._id)
        .map(p => {
          const prod = p.productId;
          const originalPrice = Number(prod.price) || 0;
          let offerPrice = null;

          if (p.customOfferPrice && p.customOfferPrice > 0) {
            offerPrice = Number(p.customOfferPrice);
          } else if (p.customDiscountPercentage && p.customDiscountPercentage > 0) {
            offerPrice = Math.round(originalPrice * (1 - p.customDiscountPercentage / 100));
          } else {
            // Apply offer general discount
            offerPrice = Math.round(originalPrice * (1 - (offer.discountPercentage || 0) / 100));
          }

          const discountPct = originalPrice > 0 && offerPrice < originalPrice
            ? Math.round(((originalPrice - offerPrice) / originalPrice) * 100)
            : (offer.discountPercentage || 0);

          return {
            _id: prod._id,
            name: prod.name,
            code: prod.code,
            category: prod.category,
            subCategory: prod.subCategory,
            occasions: prod.occasions,
            imageUrl: prod.imageUrl,
            originalPrice,
            offerPrice,
            effectivePrice: offerPrice,
            discountPercentage: discountPct,
            badge: p.badge || offer.badgeText || `${offer.name} Special`,
            stockQuantity: prod.stockQuantity,
            status: prod.status
          };
        });

      offerObj.resolvedProducts = validProducts;
      return offerObj;
    });

    // Only return offers that actually have at least 1 active product attached
    const offersWithProducts = activeOffers.filter(
      offer => Array.isArray(offer.resolvedProducts) && offer.resolvedProducts.length > 0
    );

    return res.status(200).json({
      success: true,
      count: offersWithProducts.length,
      offers: offersWithProducts
    });
  } catch (error) {
    console.error('❌ [OFFERS BACKEND] Get Active Offers Error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching active offers.'
    });
  }
};

// @route   GET /api/offers/:id
// @desc    Get single offer by ID
// @access  Public / Admin
const getOfferById = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id).populate('products.productId');
    if (!offer) {
      return res.status(404).json({ success: false, message: 'Offer not found.' });
    }

    const offerObj = offer.toObject();
    offerObj.computedStatus = computeOfferStatus(offer);

    return res.status(200).json({
      success: true,
      offer: offerObj
    });
  } catch (error) {
    console.error('❌ [OFFERS BACKEND] Get Offer by ID Error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @route   POST /api/offers
// @desc    Create a new offer
// @access  Private / Admin
const createOffer = async (req, res) => {
  try {
    const {
      name,
      occasionType,
      title,
      subtitle,
      badgeText,
      bannerImage,
      discountPercentage,
      startDate,
      endDate,
      overrideStatus,
      themeColor,
      ctaButtonText,
      ctaButtonLink,
      secondaryButtonText,
      secondaryButtonLink,
      priority
    } = req.body;

    if (!name || !title || !startDate || !endDate || discountPercentage === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Name, display title, start date, end date, and discount percentage are required.'
      });
    }

    let slug = slugify(name);
    // Ensure slug uniqueness
    const existing = await Offer.findOne({ slug });
    if (existing) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    const offer = await Offer.create({
      name: name.trim(),
      occasionType: occasionType || "Mother's Day",
      slug,
      title: title.trim(),
      subtitle: subtitle ? subtitle.trim() : '',
      badgeText: badgeText ? badgeText.trim() : `${name} SPL`,
      bannerImage: bannerImage || 'https://inithan-custom-gifts-prod-651484323514-eu-north-1-an.s3.eu-north-1.amazonaws.com/static/gift-box.png',
      discountPercentage: Number(discountPercentage),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      overrideStatus: overrideStatus || 'Auto',
      themeColor: themeColor || '#C41E3A',
      ctaButtonText: ctaButtonText ? ctaButtonText.trim() : 'Explore Deals Below ↓',
      ctaButtonLink: ctaButtonLink ? ctaButtonLink.trim() : '#offerProductsSection',
      secondaryButtonText: secondaryButtonText ? secondaryButtonText.trim() : 'View Full Catalog →',
      secondaryButtonLink: secondaryButtonLink ? secondaryButtonLink.trim() : 'products.html',
      priority: priority ? Number(priority) : 1,
      products: []
    });

    return res.status(201).json({
      success: true,
      message: 'Occasion offer created successfully!',
      offer
    });
  } catch (error) {
    console.error('❌ [OFFERS BACKEND] Create Offer Error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @route   PUT /api/offers/:id
// @desc    Update an offer
// @access  Private / Admin
const updateOffer = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) {
      return res.status(404).json({ success: false, message: 'Offer not found.' });
    }

    const {
      name,
      occasionType,
      title,
      subtitle,
      badgeText,
      bannerImage,
      discountPercentage,
      startDate,
      endDate,
      overrideStatus,
      themeColor,
      ctaButtonText,
      ctaButtonLink,
      secondaryButtonText,
      secondaryButtonLink,
      priority
    } = req.body;

    if (name && name.trim() !== offer.name) {
      offer.name = name.trim();
      offer.slug = slugify(name);
    }

    if (occasionType) offer.occasionType = occasionType;
    if (title) offer.title = title.trim();
    if (subtitle !== undefined) offer.subtitle = subtitle.trim();
    if (badgeText !== undefined) offer.badgeText = badgeText.trim();
    if (bannerImage !== undefined) offer.bannerImage = bannerImage.trim();
    if (discountPercentage !== undefined) offer.discountPercentage = Number(discountPercentage);
    if (startDate) offer.startDate = new Date(startDate);
    if (endDate) offer.endDate = new Date(endDate);
    if (overrideStatus) offer.overrideStatus = overrideStatus;
    if (themeColor) offer.themeColor = themeColor;
    if (ctaButtonText !== undefined) offer.ctaButtonText = ctaButtonText.trim();
    if (ctaButtonLink !== undefined) offer.ctaButtonLink = ctaButtonLink.trim();
    if (secondaryButtonText !== undefined) offer.secondaryButtonText = secondaryButtonText.trim();
    if (secondaryButtonLink !== undefined) offer.secondaryButtonLink = secondaryButtonLink.trim();
    if (priority !== undefined) offer.priority = Number(priority);

    const updated = await offer.save();

    return res.status(200).json({
      success: true,
      message: 'Offer updated successfully!',
      offer: updated
    });
  } catch (error) {
    console.error('❌ [OFFERS BACKEND] Update Offer Error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @route   DELETE /api/offers/:id
// @desc    Delete an offer and detach linked products
// @access  Private / Admin
const deleteOffer = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) {
      return res.status(404).json({ success: false, message: 'Offer not found.' });
    }

    // Detach from Product model
    await Product.updateMany(
      { offerId: offer._id },
      { $set: { offerId: null, offerPrice: null, offerDiscountPercent: null, offerBadge: '' } }
    );

    await Offer.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Offer deleted and products restored to standard pricing.'
    });
  } catch (error) {
    console.error('❌ [OFFERS BACKEND] Delete Offer Error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @route   POST /api/offers/:id/products
// @desc    Add or update a product in an offer
// @access  Private / Admin
const addProductToOffer = async (req, res) => {
  try {
    const { productId, customOfferPrice, customDiscountPercentage, badge } = req.body;
    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required.' });
    }

    const offer = await Offer.findById(req.params.id);
    if (!offer) {
      return res.status(404).json({ success: false, message: 'Offer not found.' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const basePrice = Number(product.price) || 0;
    let resolvedOfferPrice = customOfferPrice ? Number(customOfferPrice) : null;
    let resolvedDiscountPct = customDiscountPercentage ? Number(customDiscountPercentage) : null;

    if (!resolvedOfferPrice && resolvedDiscountPct) {
      resolvedOfferPrice = Math.round(basePrice * (1 - resolvedDiscountPct / 100));
    } else if (resolvedOfferPrice && !resolvedDiscountPct) {
      resolvedDiscountPct = Math.round(((basePrice - resolvedOfferPrice) / basePrice) * 100);
    } else if (!resolvedOfferPrice && !resolvedDiscountPct) {
      resolvedDiscountPct = offer.discountPercentage || 20;
      resolvedOfferPrice = Math.round(basePrice * (1 - resolvedDiscountPct / 100));
    }

    const productBadge = badge ? badge.trim() : (offer.badgeText || `${offer.name} SPL`);

    // Check if product is already in offer.products
    const existingIndex = offer.products.findIndex(p => p.productId && p.productId.toString() === productId.toString());

    const offerItem = {
      productId: product._id,
      customOfferPrice: resolvedOfferPrice,
      customDiscountPercentage: resolvedDiscountPct,
      badge: productBadge
    };

    if (existingIndex > -1) {
      offer.products[existingIndex] = offerItem;
    } else {
      offer.products.push(offerItem);
    }

    await offer.save();

    // Also update Product model
    product.offerId = offer._id;
    product.offerPrice = resolvedOfferPrice;
    product.offerDiscountPercent = resolvedDiscountPct;
    product.offerBadge = productBadge;
    await product.save();

    // Return populated offer so the frontend gets the latest populated products immediately
    const updatedOffer = await Offer.findById(req.params.id).populate('products.productId');

    return res.status(200).json({
      success: true,
      message: `"${product.name}" added to offer with offer price ₹${resolvedOfferPrice}!`,
      offer: updatedOffer
    });
  } catch (error) {
    console.error('❌ [OFFERS BACKEND] Add Product to Offer Error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @route   DELETE /api/offers/:id/products/:productId
// @desc    Remove a product from an offer
// @access  Private / Admin
const removeProductFromOffer = async (req, res) => {
  try {
    const { id, productId } = req.params;
    const offer = await Offer.findById(id);
    if (!offer) {
      return res.status(404).json({ success: false, message: 'Offer not found.' });
    }

    const targetIdStr = String(productId).trim();

    // Filter out item that matches productId or subdocument _id
    offer.products = (offer.products || []).filter(p => {
      if (!p) return false;
      const pIdStr = p.productId ? (p.productId._id || p.productId).toString() : '';
      const subIdStr = p._id ? p._id.toString() : '';
      return pIdStr !== targetIdStr && subIdStr !== targetIdStr;
    });

    await offer.save();

    // Clear Product model offer link if targetIdStr is a valid ObjectId
    if (mongoose.Types.ObjectId.isValid(targetIdStr)) {
      await Product.findByIdAndUpdate(targetIdStr, {
        $set: { offerId: null, offerPrice: null, offerDiscountPercent: null, offerBadge: '' }
      });
    }

    const updatedOffer = await Offer.findById(id).populate('products.productId');

    return res.status(200).json({
      success: true,
      message: 'Product removed from offer and restored to normal pricing.',
      offer: updatedOffer
    });
  } catch (error) {
    console.error('❌ [OFFERS BACKEND] Remove Product from Offer Error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getOffers,
  getActiveOffers,
  getOfferById,
  createOffer,
  updateOffer,
  deleteOffer,
  addProductToOffer,
  removeProductFromOffer
};
