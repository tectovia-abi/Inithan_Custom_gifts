const mongoose = require('mongoose');

const occasionSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Occasion name is required'], 
    unique: true, 
    trim: true 
  },
  slug: { 
    type: String, 
    trim: true 
  },
  image: { 
    type: String, 
    default: 'https://inithan-custom-gifts-prod-651484323514-eu-north-1-an.s3.eu-north-1.amazonaws.com/static/gift-box.png', 
    trim: true 
  },
  description: { 
    type: String, 
    default: '', 
    trim: true 
  },
  status: { 
    type: String, 
    default: 'Active', 
    enum: ['Active', 'Inactive'] 
  }
}, { timestamps: true });

module.exports = mongoose.model('Occasion', occasionSchema);
