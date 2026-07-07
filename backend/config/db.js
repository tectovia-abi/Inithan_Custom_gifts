const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const MONGO_URI = process.env.MONGO_URI;
    console.log(`📡 Connecting to MongoDB Atlas database...`);
    
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected successfully to MongoDB Atlas (inithat_gifts)');
  } catch (err) {
    console.error('❌ MongoDB Atlas connection failed:', err.message);
    console.log('⚠️  Please ensure your connection string and credentials are correct.');
  }
};

module.exports = connectDB;
