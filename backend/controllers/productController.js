const Product = require('../models/Product');

const createProduct = async (req, res) => {
  try {
    const {
      name, code, category, subCategory, brand, productType, keywords, status,
      price, discountPrice, costPrice, imageUrl, galleryImages, shortDescription, detailedDescription,
      stockQuantity, lowStockAlert, skuBarcode, weight, dimensions, shippingType,
      metaTitle, metaDescription, urlSlug, visibility,
      isFeatured, isBestSeller, isNewArrival, allowReviews, showOnHomepage,
      size, color, shape, capacity, otherVariants
    } = req.body;

    if (!name || !code || price === undefined || price === null) {
      return res.status(400).json({
        success: false,
        message: 'Product name, product code, and product price are required.'
      });
    }

    // Check code uniqueness
    const existingProduct = await Product.findOne({ code: code.trim().toUpperCase() });
    if (existingProduct) {
      return res.status(400).json({
        success: false,
        message: `Product code "${code}" already exists. Please use a unique product code.`
      });
    }

    const newProduct = await Product.create({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      category: category ? category.trim() : 'Custom Gifts',
      subCategory: subCategory ? subCategory.trim() : '',
      brand: brand ? brand.trim() : 'Inithat Custom Gifts',
      productType: productType ? productType.trim() : 'Physical',
      keywords: keywords ? keywords.trim() : '',
      status: status ? status.trim() : 'Active',
      price: Number(price),
      discountPrice: discountPrice ? Number(discountPrice) : 0,
      costPrice: costPrice ? Number(costPrice) : 0,
      imageUrl: imageUrl ? imageUrl.trim() : 'images/gift-box.png',
      galleryImages: Array.isArray(galleryImages) ? galleryImages : [],
      shortDescription: shortDescription ? shortDescription.trim() : '',
      detailedDescription: detailedDescription ? detailedDescription.trim() : '',
      stockQuantity: stockQuantity !== undefined ? Number(stockQuantity) : 50,
      lowStockAlert: lowStockAlert !== undefined ? Number(lowStockAlert) : 5,
      skuBarcode: skuBarcode ? skuBarcode.trim() : '',
      weight: weight !== undefined ? Number(weight) : 0.5,
      dimensions: dimensions || { length: 0, width: 0, height: 0 },
      shippingType: shippingType ? shippingType.trim() : 'Standard Delivery',
      metaTitle: metaTitle ? metaTitle.trim() : '',
      metaDescription: metaDescription ? metaDescription.trim() : '',
      urlSlug: urlSlug ? urlSlug.trim() : '',
      visibility: visibility ? visibility.trim() : 'Visible (Public)',
      isFeatured: !!isFeatured,
      isBestSeller: !!isBestSeller,
      isNewArrival: isNewArrival !== undefined ? !!isNewArrival : true,
      allowReviews: allowReviews !== undefined ? !!allowReviews : true,
      showOnHomepage: showOnHomepage !== undefined ? !!showOnHomepage : true,
      size: size ? size.trim() : '',
      color: color ? color.trim() : '',
      shape: shape ? shape.trim() : '',
      capacity: capacity ? capacity.trim() : '',
      otherVariants: otherVariants ? otherVariants.trim() : ''
    });

    console.log(`🎁 [PRODUCT BACKEND] New Product Created: ${newProduct.name} (${newProduct.code})`);
    productCache.data = null; // Clear cache

    return res.status(201).json({
      success: true,
      message: 'Product added successfully!',
      product: newProduct
    });

  } catch (error) {
    console.error('❌ [PRODUCT BACKEND] Create Product Error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error creating product.'
    });
  }
};

// In-memory cache for products
let productCache = {
  data: null,
  timestamp: 0
};
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

const getProducts = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      // Return fallback products if database connection is offline
      return res.status(200).json({
        success: true,
        count: 6,
        products: [
          { name: 'Personalized Photo Mug', code: 'MUG-001', price: 499, keywords: 'mug, photo, ceramic', imageUrl: 'images/custom-mug.png' },
          { name: 'Engraved Wooden Frame', code: 'FRM-002', price: 899, keywords: 'frame, wooden, photo', imageUrl: 'images/custom-frame.png' },
          { name: 'Engraved Metal Keychain', code: 'KEY-003', price: 349, keywords: 'keychain, metal, accessory', imageUrl: 'images/custom-keychain.png' },
          { name: 'Custom Printed Pillow', code: 'PIL-004', price: 699, keywords: 'pillow, cushion, apparel', imageUrl: 'images/custom-pillow.png' },
          { name: 'Custom Printed T-Shirt', code: 'TSH-005', price: 599, keywords: 'tshirt, apparel, fashion', imageUrl: 'images/custom-tshirt.png' },
          { name: 'Custom Gold Pendant', code: 'JWL-006', price: 1499, keywords: 'jewelry, pendant, accessory', imageUrl: 'images/custom-jewelry.png' }
        ]
      });
    }

    // Check cache
    const now = Date.now();
    if (productCache.data && (now - productCache.timestamp < CACHE_DURATION_MS)) {
      console.log('⚡ Serving products from memory cache');
      return res.status(200).json(productCache.data);
    }

    console.time("getProducts_db_query");
    // Use .lean() for faster read-only queries
    const products = await Product.find().lean().sort({ createdAt: -1 });
    console.timeEnd("getProducts_db_query");

    const responseData = {
      success: true,
      count: products.length,
      products
    };

    // Update cache
    productCache = {
      data: responseData,
      timestamp: now
    };

    return res.status(200).json(responseData);
  } catch (error) {
    console.error('❌ [PRODUCT BACKEND] Fetch Products Error:', error.message);
    return res.status(200).json({
      success: true,
      count: 6,
      products: [
        { name: 'Personalized Photo Mug', code: 'MUG-001', price: 499, keywords: 'mug, photo, ceramic', imageUrl: 'images/custom-mug.png' },
        { name: 'Engraved Wooden Frame', code: 'FRM-002', price: 899, keywords: 'frame, wooden, photo', imageUrl: 'images/custom-frame.png' },
        { name: 'Engraved Metal Keychain', code: 'KEY-003', price: 349, keywords: 'keychain, metal, accessory', imageUrl: 'images/custom-keychain.png' },
        { name: 'Custom Printed Pillow', code: 'PIL-004', price: 699, keywords: 'pillow, cushion, apparel', imageUrl: 'images/custom-pillow.png' },
        { name: 'Custom Printed T-Shirt', code: 'TSH-005', price: 599, keywords: 'tshirt, apparel, fashion', imageUrl: 'images/custom-tshirt.png' },
        { name: 'Custom Gold Pendant', code: 'JWL-006', price: 1499, keywords: 'jewelry, pendant, accessory', imageUrl: 'images/custom-jewelry.png' }
      ]
    });
  }
};

const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.'
      });
    }
    return res.status(200).json({
      success: true,
      product
    });
  } catch (error) {
    console.error('❌ [PRODUCT BACKEND] Fetch Product by ID Error:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Product not found.'
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Server error fetching product.'
    });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.'
      });
    }
    console.log(`🗑️ [PRODUCT BACKEND] Product Deleted: ${product.name} (${product.code})`);
    productCache.data = null; // Clear cache
    return res.status(200).json({
      success: true,
      message: 'Product deleted successfully.'
    });
  } catch (error) {
    console.error('❌ [PRODUCT BACKEND] Delete Product Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error deleting product.'
    });
  }
};

const updateProduct = async (req, res) => {
  try {
    const {
      name, code, category, subCategory, brand, productType, keywords, status,
      price, discountPrice, costPrice, imageUrl, galleryImages, shortDescription, detailedDescription,
      stockQuantity, lowStockAlert, skuBarcode, weight, dimensions, shippingType,
      metaTitle, metaDescription, urlSlug, visibility,
      isFeatured, isBestSeller, isNewArrival, allowReviews, showOnHomepage,
      size, color, shape, capacity, otherVariants
    } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.'
      });
    }

    // Check code uniqueness if code is changed
    if (code && code.trim().toUpperCase() !== product.code) {
      const existingProduct = await Product.findOne({ 
        code: code.trim().toUpperCase(),
        _id: { $ne: product._id }
      });
      if (existingProduct) {
        return res.status(400).json({
          success: false,
          message: `Product code "${code}" already exists. Please use a unique product code.`
        });
      }
      product.code = code.trim().toUpperCase();
    }

    if (name !== undefined) product.name = name.trim();
    if (category !== undefined) product.category = category.trim();
    if (subCategory !== undefined) product.subCategory = subCategory.trim();
    if (brand !== undefined) product.brand = brand.trim();
    if (productType !== undefined) product.productType = productType.trim();
    if (keywords !== undefined) product.keywords = keywords.trim();
    if (status !== undefined) product.status = status.trim();
    
    if (price !== undefined) product.price = Number(price);
    if (discountPrice !== undefined) product.discountPrice = Number(discountPrice);
    if (costPrice !== undefined) product.costPrice = Number(costPrice);

    if (imageUrl !== undefined) product.imageUrl = imageUrl.trim();
    if (galleryImages !== undefined) product.galleryImages = Array.isArray(galleryImages) ? galleryImages : [];
    if (shortDescription !== undefined) product.shortDescription = shortDescription.trim();
    if (detailedDescription !== undefined) product.detailedDescription = detailedDescription.trim();

    if (stockQuantity !== undefined) product.stockQuantity = Number(stockQuantity);
    if (lowStockAlert !== undefined) product.lowStockAlert = Number(lowStockAlert);
    if (skuBarcode !== undefined) product.skuBarcode = skuBarcode.trim();
    if (weight !== undefined) product.weight = Number(weight);
    if (dimensions !== undefined) product.dimensions = dimensions;
    if (shippingType !== undefined) product.shippingType = shippingType.trim();

    if (metaTitle !== undefined) product.metaTitle = metaTitle.trim();
    if (metaDescription !== undefined) product.metaDescription = metaDescription.trim();
    if (urlSlug !== undefined) product.urlSlug = urlSlug.trim();
    if (visibility !== undefined) product.visibility = visibility.trim();

    if (isFeatured !== undefined) product.isFeatured = !!isFeatured;
    if (isBestSeller !== undefined) product.isBestSeller = !!isBestSeller;
    if (isNewArrival !== undefined) product.isNewArrival = !!isNewArrival;
    if (allowReviews !== undefined) product.allowReviews = !!allowReviews;
    if (showOnHomepage !== undefined) product.showOnHomepage = !!showOnHomepage;

    if (size !== undefined) product.size = size.trim();
    if (color !== undefined) product.color = color.trim();
    if (shape !== undefined) product.shape = shape.trim();
    if (capacity !== undefined) product.capacity = capacity.trim();
    if (otherVariants !== undefined) product.otherVariants = otherVariants.trim();

    await product.save();

    console.log(`✏️ [PRODUCT BACKEND] Product Updated: ${product.name} (${product.code})`);
    productCache.data = null; // Clear cache

    return res.status(200).json({
      success: true,
      message: 'Product updated successfully!',
      product
    });

  } catch (error) {
    console.error('❌ [PRODUCT BACKEND] Update Product Error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error updating product.'
    });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  deleteProduct,
  updateProduct
};
