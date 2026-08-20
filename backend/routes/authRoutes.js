const express = require('express');
const router = express.Router();
const {
  signup,
  login,
  getUsers,
  getProfile,
  updateProfile,
  changePassword
} = require('../controllers/authController');
const { protect, admin } = require('../middleware/authMiddleware');
const { validateSignup, validateLogin } = require('../middleware/validationMiddleware');

// @route   POST /api/auth/signup
// @desc    Register a new user in MongoDB
// @access  Public
router.post('/signup', validateSignup, signup);

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', validateLogin, login);

// @route   GET /api/auth/profile
// @desc    Get current user's profile
// @access  Private
router.get('/profile', protect, getProfile);

// @route   PUT /api/auth/profile
// @desc    Update current user's profile details
// @access  Private
router.put('/profile', protect, updateProfile);

// @route   PUT /api/auth/change-password
// @desc    Change user's password
// @access  Private
router.put('/change-password', protect, changePassword);

// @route   GET /api/auth/users
// @desc    Get all registered users
// @access  Private / Admin
router.get('/users', protect, admin, getUsers);

module.exports = router;

