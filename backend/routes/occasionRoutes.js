const express = require('express');
const router = express.Router();
const Occasion = require('../models/Occasion');
const { protect, admin } = require('../middleware/authMiddleware');

const defaultOccasions = [
  { name: '🎂 Birthday Gifts', description: 'Surprise gifts for birthdays', status: 'Active', image: 'https://inithan-custom-gifts-prod-651484323514-eu-north-1-an.s3.eu-north-1.amazonaws.com/static/gift-box.png' },
  { name: '❤️ Anniversary Gifts', description: 'Romantic customized gifts for couples', status: 'Active', image: 'https://inithan-custom-gifts-prod-651484323514-eu-north-1-an.s3.eu-north-1.amazonaws.com/static/custom-frame.png' },
  { name: '💍 Wedding Gifts', description: 'Memorable wedding and return gifts', status: 'Active', image: 'https://inithan-custom-gifts-prod-651484323514-eu-north-1-an.s3.eu-north-1.amazonaws.com/static/custom-jewelry.png' },
  { name: '💼 Corporate Events', description: 'Branded bulk corporate gifts', status: 'Active', image: 'https://inithan-custom-gifts-prod-651484323514-eu-north-1-an.s3.eu-north-1.amazonaws.com/static/custom-mug.png' },
  { name: '💖 Valentine Special', description: 'Personalized romantic tokens of love', status: 'Active', image: 'https://inithan-custom-gifts-prod-651484323514-eu-north-1-an.s3.eu-north-1.amazonaws.com/static/custom-pillow.png' },
  { name: '🪔 Festive & Diwali', description: 'Traditional & festival gift hampers', status: 'Active', image: 'https://inithan-custom-gifts-prod-651484323514-eu-north-1-an.s3.eu-north-1.amazonaws.com/static/gift-box.png' }
];

router.get('/', async (req, res) => {
  try {
    const occasions = await Occasion.find().sort({ createdAt: 1 });
    res.json({ success: true, occasions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/occasions
// @desc    Create a new occasion
// @access  Private/Admin
router.post('/', protect, admin, async (req, res) => {
  try {
    const { name, description, image, status } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Occasion name is required.' });
    }

    const existing = await Occasion.findOne({ name: name.trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'An occasion with this name already exists.' });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const occasion = await Occasion.create({
      name: name.trim(),
      slug,
      description: description ? description.trim() : '',
      image: image || 'https://inithan-custom-gifts-prod-651484323514-eu-north-1-an.s3.eu-north-1.amazonaws.com/static/gift-box.png',
      status: (status && ['Active', 'Inactive'].includes(status)) ? status : 'Active'
    });

    res.status(201).json({ success: true, occasion });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/occasions/:id
// @desc    Update an occasion
// @access  Private/Admin
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const { name, description, image, status } = req.body;
    const occasion = await Occasion.findById(req.params.id);

    if (!occasion) {
      return res.status(404).json({ success: false, message: 'Occasion not found.' });
    }

    if (name && name.trim() !== occasion.name) {
      const existing = await Occasion.findOne({ name: name.trim(), _id: { $ne: occasion._id } });
      if (existing) {
        return res.status(400).json({ success: false, message: 'An occasion with this name already exists.' });
      }
      occasion.name = name.trim();
      occasion.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }

    if (description !== undefined) occasion.description = description.trim();
    if (image !== undefined) occasion.image = image;
    if (status !== undefined && ['Active', 'Inactive'].includes(status)) occasion.status = status;

    const updated = await occasion.save();
    res.json({ success: true, occasion: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/occasions/:id
// @desc    Delete an occasion
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const occasion = await Occasion.findById(req.params.id);
    if (!occasion) {
      return res.status(404).json({ success: false, message: 'Occasion not found.' });
    }

    await Occasion.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Occasion deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
