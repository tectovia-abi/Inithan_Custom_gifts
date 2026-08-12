const { body, param, validationResult } = require('express-validator');
const mongoose = require('mongoose');

// Middleware to handle validation errors and return structured errors
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg, // Return the first error message to the client
      errors: errors.array().map(err => ({ field: err.path, message: err.msg }))
    });
  }
  next();
};

const validateSignup = [
  body('fullName').trim().notEmpty().withMessage('Full name is required.'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email address.'),
  body('phone').trim().notEmpty().withMessage('Phone number is required.'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long.'),
  validate
];

const validateLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email address.'),
  body('password').notEmpty().withMessage('Password is required.'),
  validate
];

const validateObjectId = [
  param('id').custom(value => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
      throw new Error('Invalid ID format.');
    }
    return true;
  }),
  validate
];

const validateProduct = [
  body('name').trim().notEmpty().withMessage('Product name is required.'),
  body('code').trim().notEmpty().withMessage('Product code is required.'),
  body('price').isNumeric().withMessage('Product price must be a valid number.'),
  body('costPrice').optional({ nullable: true, checkFalsy: true }).isNumeric().withMessage('Cost price must be a valid number.'),
  body('discountPrice').optional({ nullable: true, checkFalsy: true }).isNumeric().withMessage('Discount price must be a valid number.'),
  body('stockQuantity').optional({ nullable: true, checkFalsy: true }).isInt({ min: 0 }).withMessage('Stock quantity must be a non-negative integer.'),
  validate
];

const validateInquiry = [
  body('name').trim().notEmpty().withMessage('Name is required.'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email address.'),
  body('phone').trim().notEmpty().withMessage('Phone number is required.'),
  body('productName').trim().notEmpty().withMessage('Product name is required.'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1.'),
  validate
];

module.exports = {
  validateSignup,
  validateLogin,
  validateObjectId,
  validateProduct,
  validateInquiry
};
