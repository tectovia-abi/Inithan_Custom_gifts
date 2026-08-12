/**
 * migrateImagesToS3.js
 * Finds all products with base64 imageUrl/galleryImages and migrates them to S3.
 * Run once: node backend/migrateImagesToS3.js
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Product = require('./models/Product');
const { uploadBase64ToS3 } = require('./utils/s3');

async function migrate() {
  await connectDB();

  const products = await Product.find({});
  console.log(`🔍 Checking ${products.length} products for base64 images...`);

  let updatedCount = 0;

  for (const product of products) {
    let changed = false;

    // Migrate primary image
    if (product.imageUrl && product.imageUrl.startsWith('data:')) {
      console.log(`📤 Uploading primary image for: "${product.name}"`);
      const s3Url = await uploadBase64ToS3(product.imageUrl, 'products');
      product.imageUrl = s3Url;
      changed = true;
      console.log(`  ✅ → ${s3Url}`);
    }

    // Migrate gallery images
    if (product.galleryImages && product.galleryImages.length > 0) {
      const newGallery = [];
      for (const img of product.galleryImages) {
        if (img && img.startsWith('data:')) {
          console.log(`📤 Uploading gallery image for: "${product.name}"`);
          const s3Url = await uploadBase64ToS3(img, 'gallery');
          newGallery.push(s3Url);
          changed = true;
          console.log(`  ✅ → ${s3Url}`);
        } else {
          newGallery.push(img);
        }
      }
      product.galleryImages = newGallery;
    }

    if (changed) {
      await product.save();
      updatedCount++;
    }
  }

  console.log(`\n🎉 Migration complete! Migrated images for ${updatedCount} products.`);
  await mongoose.disconnect();
  process.exit(0);
}

migrate().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
