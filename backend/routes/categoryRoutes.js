const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const { protect, admin } = require('../middleware/authMiddleware');

// @route   GET /api/categories
// @desc    Get all categories
// @access  Public
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: 1 });
    res.json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/categories
// @desc    Create a category
// @access  Private/Admin
router.post('/', protect, admin, async (req, res) => {
  try {
    const { name, image, subcategories } = req.body;
    const categoryExists = await Category.findOne({ name });
    
    if (categoryExists) {
      return res.status(400).json({ success: false, message: 'Category already exists' });
    }

    const category = await Category.create({
      name,
      image: image || 'images/gift-box.png',
      subcategories: subcategories || []
    });

    res.status(201).json({ success: true, category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/categories/:id
// @desc    Update a category (name, image, or full subcategories array)
// @access  Private/Admin
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    category.name = req.body.name || category.name;
    if (req.body.image !== undefined) category.image = req.body.image;
    if (req.body.subcategories !== undefined) category.subcategories = req.body.subcategories;

    const updatedCategory = await category.save();
    res.json({ success: true, category: updatedCategory });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/categories/:id
// @desc    Delete a category
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    await category.deleteOne();
    res.json({ success: true, message: 'Category removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/categories/:id/sub
// @desc    Add a subcategory
// @access  Private/Admin
router.post('/:id/sub', protect, admin, async (req, res) => {
  try {
    const { subName } = req.body;
    if (!subName) return res.status(400).json({ success: false, message: 'Subcategory name is required' });

    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });

    if (!category.subcategories.includes(subName)) {
      category.subcategories.push(subName);
      await category.save();
    }
    res.json({ success: true, category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/categories/:id/sub/:subName
// @desc    Delete a subcategory
// @access  Private/Admin
router.delete('/:id/sub/:subName', protect, admin, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });

    category.subcategories = category.subcategories.filter(sub => sub !== req.params.subName);
    await category.save();
    
    res.json({ success: true, category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
