const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const bulkInquiryRoutes = require('./routes/bulkInquiryRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const occasionRoutes = require('./routes/occasionRoutes');
const offerRoutes = require('./routes/offerRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const Product = require('./models/Product');

const app = express();

// ── Trust Proxy for Render ───────────────────────────────────────────────────
app.set('trust proxy', 1);

// ── Security Headers (Helmet) ────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://*"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://inithan-custom-gifts-prod-651484323514-eu-north-1-an.s3.eu-north-1.amazonaws.com", "https://*.amazonaws.com"],
      connectSrc: ["'self'", "https://*", "http://127.0.0.1:*", "http://localhost:*"]
    }
  }
}));

// ── CORS Configuration ────────────────────────────────────────────────────────
const allowedOrigins = [
  'https://inithancustomgifts.com',
  'https://www.inithancustomgifts.com'
];
app.use(cors({
  origin: (origin, callback) => {
    if (
      !origin || 
      origin === 'null' || 
      allowedOrigins.includes(origin) ||
      /^http:\/\/localhost:\d+$/.test(origin) ||
      /^http:\/\/127\.0\.0\.1:\d+$/.test(origin)
    ) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// ── Rate Limiting ────────────────────────────────────────────────────────────
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' }
});
app.use('/api', generalLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many auth attempts, please try again in 15 minutes.' }
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/signup', authLimiter);

const inquiryLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many inquiries submitted, please try again in an hour.' }
});
app.use('/api/bulk-inquiry', inquiryLimiter);

// ── Body Parser Limits & Sanitization ──────────────────────────────────────────
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ limit: '1mb', extended: true }));
app.use(mongoSanitize());

// ── Serve frontend static files from ../frontend ────────────────────────────
const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));

// ── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/bulk-inquiry', bulkInquiryRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/occasions', occasionRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/upload', uploadRoutes);

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Inithat Gifts backend server is running!',
    db: mongoose.connection.readyState === 1 ? 'Connected to MongoDB Atlas' : 'Disconnected'
  });
});

// ── robots.txt Route ─────────────────────────────────────────────────────────
app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send(`User-agent: *
Allow: /

Sitemap: https://inithancustomgifts.com/sitemap.xml`);
});

// ── sitemap.xml Route ────────────────────────────────────────────────────────
app.get('/sitemap.xml', async (req, res) => {
  try {
    const products = await Product.find({ status: 'Active', visibility: 'Visible (Public)' });
    
    let productUrls = '';
    products.forEach(product => {
      if (product.urlSlug) {
        productUrls += `
  <url>
    <loc>https://inithancustomgifts.com/products/${product.urlSlug}</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`;
      }
    });

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Static Pages -->
  <url>
    <loc>https://inithancustomgifts.com/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://inithancustomgifts.com/products.html</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://inithancustomgifts.com/bulk-retail.html</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://inithancustomgifts.com/offers.html</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://inithancustomgifts.com/reviews.html</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>https://inithancustomgifts.com/contact.html</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://inithancustomgifts.com/machines.html</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>${productUrls}
</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.send(sitemap);
  } catch (error) {
    console.error('❌ Sitemap generation error:', error);
    res.status(500).send('Error generating sitemap');
  }
});

// ── Server-Side Rendered (SSR) Product Details Route ─────────────────────────
app.get('/products/:slug', async (req, res) => {
  try {
    const slug = req.params.slug;
    
    // Find the product in DB
    const product = await Product.findOne({ urlSlug: slug, status: 'Active', visibility: 'Visible (Public)' });
    
    if (!product) {
      return res.status(404).sendFile(path.join(frontendPath, 'index.html'));
    }

    const templatePath = path.join(frontendPath, 'product-details.html');
    if (!fs.existsSync(templatePath)) {
      return res.sendFile(path.join(frontendPath, 'index.html'));
    }

    let html = fs.readFileSync(templatePath, 'utf8');

    // 1. Dynamic SEO Header Metadata Injection
    const title = product.metaTitle || `${product.name} | Inithan Custom Gifts`;
    const description = product.metaDescription || product.shortDescription || `Buy ${product.name} online at Inithan Custom Gifts. High-quality personalized gift made with love.`;
    const keywords = product.keywords || `${product.name}, custom gift, personalized gift, Inithan`;
    const url = `https://inithancustomgifts.com/products/${product.urlSlug}`;
    const imageUrl = product.imageUrl ? (product.imageUrl.startsWith('http') ? product.imageUrl : `https://inithancustomgifts.com/${product.imageUrl}`) : 'https://inithancustomgifts.com/https://inithan-custom-gifts-prod-651484323514-eu-north-1-an.s3.eu-north-1.amazonaws.com/static/gift-box.png';

    const seoTags = `
  <title>${title}</title>
  <meta name="description" content="${description.replace(/"/g, '&quot;')}">
  <meta name="keywords" content="${keywords.replace(/"/g, '&quot;')}">
  <link rel="canonical" href="${url}">
  
  <!-- Open Graph (WhatsApp, Facebook) -->
  <meta property="og:type" content="product">
  <meta property="og:title" content="${title.replace(/"/g, '&quot;')}">
  <meta property="og:description" content="${description.replace(/"/g, '&quot;')}">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:url" content="${url}">
  <meta property="og:site_name" content="Inithan Custom Gifts">

  <!-- Hydration Data -->
  <script>window.preloadedProduct = ${JSON.stringify(product)};</script>

  <!-- JSON-LD Product Structured Data -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "${product.name.replace(/"/g, '\\"')}",
    "image": ["${imageUrl}"],
    "description": "${(product.shortDescription || description).replace(/\n/g, ' ').replace(/"/g, '\\"')}",
    "sku": "${product.code || 'GIFT-' + product._id}",
    "brand": {
      "@type": "Brand",
      "name": "Inithan Custom Gifts"
    },
    "offers": {
      "@type": "Offer",
      "url": "${url}",
      "priceCurrency": "INR",
      "price": "${product.price}",
      "priceValidUntil": "2027-12-31",
      "availability": "${product.stockQuantity > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'}"
    }
  }
  </script>
`;

    // Replace the static title tag with our rich SEO tags
    html = html.replace(/<title>.*?<\/title>/i, seoTags);

    // 2. Server-side pre-rendering of product details
    const discountPercent = product.costPrice > product.price ? Math.round(((product.costPrice - product.price) / product.costPrice) * 100) : 0;
    
    let thumbnailsHtml = `<div class="thumbnail active"><img src="../${product.imageUrl}" onerror="this.src='https://inithan-custom-gifts-prod-651484323514-eu-north-1-an.s3.eu-north-1.amazonaws.com/static/gift-box.png'"></div>`;
    if (product.galleryImages && product.galleryImages.length > 0) {
      product.galleryImages.forEach(img => {
        thumbnailsHtml += `<div class="thumbnail"><img src="../${img}" onerror="this.src='https://inithan-custom-gifts-prod-651484323514-eu-north-1-an.s3.eu-north-1.amazonaws.com/static/gift-box.png'"></div>`;
      });
    }

    let featuresHtml = '';
    if (product.detailedDescription) {
      const lines = product.detailedDescription.split('\n').filter(l => l.trim() !== '');
      featuresHtml = lines.map(l => `<li>${l}</li>`).join('');
    } else {
      featuresHtml = `<li>Premium quality custom gift</li><li>Ideal for personal or corporate use</li><li>Crafted with precision</li>`;
    }

    const preRenderedContainer = `
    <div class="pdp-container" id="pdpContainer" style="display: grid;">
      <!-- Left: Images -->
      <div class="pdp-image-col">
        <div class="main-image-container">
          <img id="mainProductImg" src="../${product.imageUrl}" alt="${product.name}" onerror="this.src='https://inithan-custom-gifts-prod-651484323514-eu-north-1-an.s3.eu-north-1.amazonaws.com/static/gift-box.png'">
        </div>
        <div class="thumbnail-gallery">
          ${thumbnailsHtml}
        </div>
      </div>

      <!-- Center: Details -->
      <div class="pdp-info-col">
        <div class="product-brand">${product.brand || 'Inithan Custom Gifts'}</div>
        <h1 class="product-title">${product.name}</h1>
        <div class="product-rating">
          <span class="stars">★★★★½</span>
          <span style="color: var(--gray-500);">(1,403 ratings)</span>
        </div>
        <div class="divider"></div>

        <div class="price-block">
          ${discountPercent > 0 ? `<span class="discount-badge">-${discountPercent}%</span>` : ''}
          <span class="current-price">₹${Number(product.price).toLocaleString('en-IN')}</span>
        </div>
        ${product.costPrice > product.price ? `<div class="mrp">M.R.P.: ₹${Number(product.costPrice).toLocaleString('en-IN')}</div>` : ''}
        <div class="tax-inclusive">Inclusive of all taxes</div>

        <div class="product-description" style="margin-top: 25px;">
          <h3 style="font-size: 1.1rem; margin-bottom: 10px; color: var(--dark);">About this item</h3>
          <ul class="product-features">
            ${featuresHtml}
          </ul>
          <p style="margin-top: 15px; color: var(--gray-600); line-height: 1.6;">${product.shortDescription || 'Experience the perfect blend of personalization and quality with our uniquely crafted gifts.'}</p>
        </div>
      </div>

      <!-- Right: Buy Box -->
      <div class="pdp-buy-col">
        <div class="buy-box">
          <div class="buy-price">₹${Number(product.price).toLocaleString('en-IN')}</div>

          <div class="stock-status" style="margin-top: 15px;">
            <span style="color: ${product.stockQuantity > 0 ? 'var(--green)' : 'var(--primary)'}; font-weight:700;">
              ${product.stockQuantity > 0 ? 'In Stock' : 'Currently unavailable'}
            </span>
          </div>

          <div style="margin: 20px 0; padding: 15px; background: #fff5f6; border-radius: 10px; border: 1px dashed var(--primary); text-align: center;">
            <span style="font-size: 0.9rem; font-weight: 600; color: var(--primary); display: block; margin-bottom: 6px;">✨ Custom Gift Personalization Required</span>
            <span style="font-size: 0.8rem; color: var(--gray-600);">Upload your photo(s) and custom text on the form before checkout.</span>
          </div>

          <button class="action-btn buy-now-btn" onclick="window.location.href='../customize-product.html?id=${product._id}&action=buynow'" style="background: var(--primary); color: white; margin-bottom: 10px; cursor: pointer;">🎨 Personalize & Buy Now</button>
          <button class="action-btn add-cart-btn" onclick="window.location.href='../customize-product.html?id=${product._id}&action=addcart'" style="border: 2px solid var(--primary); color: var(--primary); background: transparent; cursor: pointer;">Customize & Add to Cart</button>

          <div class="secure-transaction">
            🔒 Secure transaction
          </div>
        </div>
      </div>
    </div>
    `;

    // Replace empty placeholder container with pre-rendered server side content
    const targetDivStr = '<div class="pdp-container" id="pdpContainer" style="display: none;">\n    <!-- Rendered via JS -->\n  </div>';
    if (html.includes(targetDivStr)) {
      html = html.replace(targetDivStr, preRenderedContainer);
    } else {
      // Fallback: simple tag-level replacement
      html = html.replace('<div class="pdp-container" id="pdpContainer" style="display: none;">', '<div class="pdp-container" id="pdpContainer" style="display: grid;">' + preRenderedContainer);
    }

    // Hide the loader initially since server-rendered content is already visible
    html = html.replace('id="pdpLoading"', 'id="pdpLoading" style="display: none;"');

    // Fix relative asset paths since we are nested in /products/
    html = html.replace(/href="css\//g, 'href="../css/');
    html = html.replace(/src="js\//g, 'src="../js/');
    html = html.replace(/href="images\//g, 'href="../images/');
    html = html.replace(/src="images\//g, 'src="../images/');
    html = html.replace(/href="index.html/g, 'href="../index.html');
    html = html.replace(/href="products.html/g, 'href="../products.html');
    html = html.replace(/href="bulk-retail.html/g, 'href="../bulk-retail.html');
    html = html.replace(/href="offers.html/g, 'href="../offers.html');
    html = html.replace(/href="reviews.html/g, 'href="../reviews.html');
    html = html.replace(/href="contact.html/g, 'href="../contact.html');
    html = html.replace(/href="machines.html/g, 'href="../machines.html');
    html = html.replace(/href="login.html/g, 'href="../login.html');
    html = html.replace(/href="signup.html/g, 'href="../signup.html');

    res.send(html);
  } catch (error) {
    console.error('❌ SSR Error:', error);
    res.sendFile(path.join(frontendPath, 'product-details.html'));
  }
});

// ── Fallback: serve index.html for non-API routes ────────────────────────────
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, message: 'API route not found' });
  }
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// ── Error Handling Middleware ────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.stack || err.message || err);
  res.status(err.status || 500).json({
    success: false,
    message: 'An unexpected server error occurred. Please try again later.'
  });
});

const connectDB = require('./config/db');

// ── Connect to MongoDB Atlas then start server ───────────────────────────────
const PORT = process.env.PORT || 8081;

if (process.env.NODE_ENV !== 'test') {
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running → http://localhost:${PORT}`);
      console.log(`📂 Serving frontend from: ${frontendPath}`);
    });
  });
}

module.exports = app;
