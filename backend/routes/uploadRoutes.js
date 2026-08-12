const express = require('express');
const router = express.Router();
const multer = require('multer');
const { uploadToS3 } = require('../utils/s3');
const { protect, admin } = require('../middleware/authMiddleware');

// Use memory storage — files go to RAM, then we push to S3
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// @route   POST /api/upload/single
// @desc    Upload a single product image to S3
// @access  Private / Admin
router.post('/single', protect, admin, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const url = await uploadToS3(req.file.buffer, req.file.originalname, 'products');
    res.json({ success: true, url });
  } catch (err) {
    console.error('❌ S3 Single Upload Error:', err);
    res.status(500).json({ success: false, message: err.message || 'Upload failed.' });
  }
});

// @route   POST /api/upload/multiple
// @desc    Upload multiple gallery images to S3
// @access  Private / Admin
router.post('/multiple', protect, admin, upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded.' });
    }

    const urls = await Promise.all(
      req.files.map(f => uploadToS3(f.buffer, f.originalname, 'gallery'))
    );

    res.json({ success: true, urls });
  } catch (err) {
    console.error('❌ S3 Multiple Upload Error:', err);
    res.status(500).json({ success: false, message: err.message || 'Upload failed.' });
  }
});

module.exports = router;
