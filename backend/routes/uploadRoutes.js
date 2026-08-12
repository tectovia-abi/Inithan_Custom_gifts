const express = require('express');
const router = express.Router();
const multer = require('multer');
const sharp = require('sharp');
const { uploadToS3 } = require('../utils/s3');
const { protect, admin } = require('../middleware/authMiddleware');

// Multer in-memory storage (Max 5MB per file)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// @route   POST /api/upload/single
// @desc    Upload a single product image to S3 (processed as secure WebP)
// @access  Private / Admin
router.post('/single', protect, admin, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    // Security: Validate image using Sharp and strip potential EXIF payloads
    const image = sharp(req.file.buffer);
    const metadata = await image.metadata();

    const allowedFormats = ['jpeg', 'jpg', 'png', 'webp', 'avif', 'tiff'];
    if (!allowedFormats.includes(metadata.format)) {
      return res.status(400).json({ success: false, message: 'Unsupported image format.' });
    }

    // Convert to webp to compress and clean file data
    const processedBuffer = await image
      .webp({ quality: 80 })
      .toBuffer();

    const originalName = req.file.originalname;
    const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
    const s3Filename = `${nameWithoutExt}.webp`;

    const url = await uploadToS3(processedBuffer, s3Filename, 'products');
    res.json({ success: true, url });
  } catch (err) {
    console.error('❌ S3 Single Upload Error:', err);
    res.status(500).json({ success: false, message: 'Invalid or corrupted image file.' });
  }
});

// @route   POST /api/upload/multiple
// @desc    Upload multiple gallery images to S3 (processed as secure WebPs)
// @access  Private / Admin
router.post('/multiple', protect, admin, upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded.' });
    }

    const urls = await Promise.all(
      req.files.map(async (file) => {
        const image = sharp(file.buffer);
        const metadata = await image.metadata();

        const allowedFormats = ['jpeg', 'jpg', 'png', 'webp', 'avif', 'tiff'];
        if (!allowedFormats.includes(metadata.format)) {
          throw new Error(`Unsupported image format: ${metadata.format}`);
        }

        const processedBuffer = await image
          .webp({ quality: 80 })
          .toBuffer();

        const nameWithoutExt = file.originalname.substring(0, file.originalname.lastIndexOf('.')) || file.originalname;
        const s3Filename = `${nameWithoutExt}.webp`;

        return uploadToS3(processedBuffer, s3Filename, 'gallery');
      })
    );

    res.json({ success: true, urls });
  } catch (err) {
    console.error('❌ S3 Multiple Upload Error:', err);
    res.status(500).json({ success: false, message: err.message || 'Invalid or corrupted image files.' });
  }
});

module.exports = router;
