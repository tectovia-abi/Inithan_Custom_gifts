const express = require('express');
const router = express.Router();
const Relationship = require('../models/Relationship');
const { protect, admin } = require('../middleware/authMiddleware');

const defaultRelationships = [
  { name: 'Mother', description: 'Heartfelt personalized keepsakes & custom gifts for Mom', status: 'Active', image: 'images/relationships/mother.jpg' },
  { name: 'Father', description: 'Thoughtful customized surprises & memory frames for Dad', status: 'Active', image: 'images/relationships/father.jpg' },
  { name: 'Husband', description: 'Romantic engraved gifts & hampers for your husband', status: 'Active', image: 'images/relationships/husband.jpg' },
  { name: 'Wife', description: 'Treasured jewelry, cushions & romantic keepsakes for your wife', status: 'Active', image: 'images/relationships/wife.jpg' },
  { name: 'Sister', description: 'Fun, cute and emotional personalized gifts for your sister', status: 'Active', image: 'images/relationships/sister.jpg' },
  { name: 'Brother', description: 'Cool customized accessories & gift combos for your brother', status: 'Active', image: 'images/relationships/brother.jpg' },
  { name: 'Couple', description: 'Special wedding & anniversary keepsakes for couples', status: 'Active', image: 'images/relationships/couple.jpg' },
  { name: 'Boyfriend', description: 'Romantic photo plaques, lamps & personalized gifts for boyfriend', status: 'Active', image: 'images/relationships/boyfriend.jpg' },
  { name: 'Girlfriend', description: 'Cute, romantic & heartwarming customized gifts for girlfriend', status: 'Active', image: 'images/relationships/girlfriend.jpg' },
  { name: 'Friend', description: 'Celebrate friendship with unique personalized photo gifts', status: 'Active', image: 'images/relationships/friend.jpg' }
];

// Admin auth helper supporting token or localhost development
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

// @route   GET /api/relationships
// @desc    Get all relationships (auto-seeds defaults if empty)
// @access  Public
router.get('/', async (req, res) => {
  try {
    let count = await Relationship.countDocuments();
    if (count === 0) {
      const toInsert = defaultRelationships.map(r => ({
        ...r,
        slug: r.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      }));
      await Relationship.insertMany(toInsert);
    }

    const relationships = await Relationship.find().sort({ createdAt: 1 });
    res.json({ success: true, count: relationships.length, relationships });
  } catch (error) {
    console.error('Error fetching relationships:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/relationships
// @desc    Create a new relationship
// @access  Private/Admin
router.post('/', adminAuthOptional, async (req, res) => {
  try {
    const { name, description, image, status } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Relationship name is required.' });
    }

    const existing = await Relationship.findOne({ name: name.trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'A relationship with this name already exists.' });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const relationship = await Relationship.create({
      name: name.trim(),
      slug,
      description: description ? description.trim() : '',
      image: image || 'images/relationships/boyfriend.jpg',
      status: (status && ['Active', 'Inactive'].includes(status)) ? status : 'Active'
    });

    res.status(201).json({ success: true, relationship });
  } catch (error) {
    console.error('Error creating relationship:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/relationships/:id
// @desc    Update a relationship
// @access  Private/Admin
router.put('/:id', adminAuthOptional, async (req, res) => {
  try {
    const { name, description, image, status } = req.body;
    const relationship = await Relationship.findById(req.params.id);

    if (!relationship) {
      return res.status(404).json({ success: false, message: 'Relationship not found.' });
    }

    if (name && name.trim() !== relationship.name) {
      const existing = await Relationship.findOne({ name: name.trim(), _id: { $ne: relationship._id } });
      if (existing) {
        return res.status(400).json({ success: false, message: 'A relationship with this name already exists.' });
      }
      relationship.name = name.trim();
      relationship.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }

    if (description !== undefined) relationship.description = description.trim();
    if (image !== undefined) relationship.image = image;
    if (status !== undefined && ['Active', 'Inactive'].includes(status)) relationship.status = status;

    const updated = await relationship.save();
    res.json({ success: true, relationship: updated });
  } catch (error) {
    console.error('Error updating relationship:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/relationships/:id
// @desc    Delete a relationship
// @access  Private/Admin
router.delete('/:id', adminAuthOptional, async (req, res) => {
  try {
    const relationship = await Relationship.findById(req.params.id);
    if (!relationship) {
      return res.status(404).json({ success: false, message: 'Relationship not found.' });
    }

    await Relationship.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Relationship deleted successfully.' });
  } catch (error) {
    console.error('Error deleting relationship:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
