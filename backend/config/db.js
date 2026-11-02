const mongoose = require('mongoose');

let retryTimeout = null;

const connectDB = async () => {
  try {
    const MONGO_URI = process.env.MONGO_URI;
    console.log(`📡 Connecting to MongoDB Atlas database...`);
    
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 8000,
    });
    console.log('✅ Connected successfully to MongoDB Atlas (inithan_gifts)');
  } catch (err) {
    console.error('❌ MongoDB Atlas connection failed:', err.message);
    console.log('⚠️  Make sure your IP is allowed in MongoDB Atlas Network Access (https://cloud.mongodb.com -> Network Access -> Add 0.0.0.0/0)');
    console.log('🔄 Will automatically retry connecting in 5 seconds...');
    if (!retryTimeout) {
      retryTimeout = setTimeout(() => {
        retryTimeout = null;
        connectDB();
      }, 5000);
    }
  }
};

// Reconnect on unexpected disconnects
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB connection lost. Reconnecting in 5 seconds...');
  if (!retryTimeout) {
    retryTimeout = setTimeout(() => {
      retryTimeout = null;
      connectDB();
    }, 5000);
  }
});

module.exports = connectDB;

