const express = require('express');
const router = express.Router();
const {
  createInquiry,
  getInquiriesByUser,
  getInquiries,
  updateInquiryStatus,
  deleteInquiry
} = require('../controllers/bulkInquiryController');
const { protect, admin } = require('../middleware/authMiddleware');

// @route   POST /api/bulk-inquiry
// @desc    Submit a bulk order inquiry
// @access  Public
router.post('/', createInquiry);

// @route   GET /api/bulk-inquiry/user/:email
// @desc    Get all bulk inquiries submitted by a specific user email
// @access  Private
router.get('/user/:email', protect, getInquiriesByUser);

// @route   GET /api/bulk-inquiry
// @desc    Get all bulk inquiries
// @access  Private / Admin
router.get('/', protect, admin, getInquiries);

// @route   PUT /api/bulk-inquiry/:id/status
// @desc    Update inquiry status
// @access  Private / Admin
router.put('/:id/status', protect, admin, updateInquiryStatus);

// @route   DELETE /api/bulk-inquiry/:id
// @desc    Delete a bulk inquiry
// @access  Private / Admin
router.delete('/:id', protect, admin, deleteInquiry);

module.exports = router;
