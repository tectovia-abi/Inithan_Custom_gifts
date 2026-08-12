const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    unique: true
  },
  image: {
    type: String,
    default: 'https://inithan-custom-gifts-prod-651484323514-eu-north-1-an.s3.eu-north-1.amazonaws.com/static/gift-box.png'
  },
  subcategories: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Category', categorySchema);
