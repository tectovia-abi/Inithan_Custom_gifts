const express = require('express');
const router = express.Router();
const {
  createProduct,
  getProducts,
  getProductById,
  deleteProduct,
  updateProduct
} = require('../controllers/productController');
const { protect, admin } = require('../middleware/authMiddleware');

// @route   POST /api/products
// @desc    Create a new product
// @access  Private / Admin
router.post('/', protect, admin, createProduct);

// @route   GET /api/products
// @desc    Get all products
// @access  Public
router.get('/', getProducts);

// @route   GET /api/products/:id
// @desc    Get a single product by ID
// @access  Public
router.get('/:id', getProductById);

// @route   DELETE /api/products/:id
// @desc    Delete a product by ID
// @access  Private / Admin
router.delete('/:id', protect, admin, deleteProduct);

// @route   PUT /api/products/:id
// @desc    Update a product by ID
// @access  Private / Admin
router.put('/:id', protect, admin, updateProduct);

module.exports = router;
