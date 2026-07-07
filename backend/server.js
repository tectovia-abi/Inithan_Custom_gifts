const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const compression = require('compression');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const bulkInquiryRoutes = require('./routes/bulkInquiryRoutes');

const app = express();

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ── Serve frontend static files from ../frontend ────────────────────────────
const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));

// ── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/bulk-inquiry', bulkInquiryRoutes);

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Inithat Gifts backend server is running!',
    db: mongoose.connection.readyState === 1 ? 'Connected to MongoDB Atlas' : 'Disconnected'
  });
});

// ── Fallback: serve index.html for non-API routes ────────────────────────────
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, message: 'API route not found' });
  }
  res.sendFile(path.join(frontendPath, 'index.html'));
});

const connectDB = require('./config/db');

// ── Connect to MongoDB Atlas then start server ───────────────────────────────
const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running → http://localhost:${PORT}`);
      console.log(`📂 Serving frontend from: ${frontendPath}`);
    });
  });
}

module.exports = app;
