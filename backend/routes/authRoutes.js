const express = require('express');
const router = express.Router();
const { signup, login, getUsers } = require('../controllers/authController');
const { protect, admin } = require('../middleware/authMiddleware');

// @route   POST /api/auth/signup
// @desc    Register a new user in MongoDB
// @access  Public
router.post('/signup', signup);

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', login);

// @route   GET /api/auth/users
// @desc    Get all registered users
// @access  Private / Admin
router.get('/users', protect, admin, getUsers);

module.exports = router;
