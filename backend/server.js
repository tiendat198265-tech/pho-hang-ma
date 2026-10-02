const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;
const HOST = process.env.HOST || '0.0.0.0';

// Connect to MongoDB
connectDB();

// CORS configuration supporting localhost, Vercel (*.vercel.app) & Cloudflare Pages (*.pages.dev)
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'https://frontend-two-rho-39.vercel.app',
  process.env.CLIENT_URL,
  process.env.CORS_ORIGIN,
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      const isAllowed =
        allowedOrigins.includes(origin) ||
        origin.endsWith('.pages.dev') ||
        origin.endsWith('.vercel.app') ||
        process.env.NODE_ENV !== 'production';

      if (isAllowed) {
        return callback(null, true);
      }
      return callback(new Error('Chặn bởi chính sách bảo mật CORS'));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Serve uploaded static files with browser cache headers (7 days)
app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'), {
    maxAge: '7d',
    etag: true,
    lastModified: true,
  })
);

// Mount API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/templates', require('./routes/templateRoutes'));
app.use('/api/custom-orders', require('./routes/customOrderRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/banners', require('./routes/bannerRoutes'));
app.use('/api/admin/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/admin/reports', require('./routes/reportRoutes'));
app.use('/api/admin/inventory', require('./routes/inventoryRoutes'));
app.use('/api/coupons', require('./routes/couponRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/admin/users', require('./routes/userRoutes'));
app.use('/api/settings', require('./routes/settingRoutes'));
app.use('/api/admin/audit-logs', require('./routes/auditLogRoutes'));
app.use('/api/consultations', require('./routes/consultationRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Phố Hàng Mã API Server',
    database: 'MongoDB Connected',
    time: new Date(),
  });
});

// Centralized error handler (hides stack trace in production)
app.use((err, req, res, next) => {
  console.error('API Error:', err.message || err);
  const isProd = process.env.NODE_ENV === 'production';
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Lỗi máy chủ nội bộ',
    ...(isProd ? {} : { stack: err.stack }),
  });
});

const server = app.listen(PORT, HOST, () => {
  console.log(`=========================================`);
  console.log(`🚀 Phố Hàng Mã API Server running on ${HOST}:${PORT}`);
  console.log(`🔗 Health check: http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}/api/health`);
  console.log(`=========================================`);
});

// Graceful shutdown handling
const handleGracefulShutdown = async (signal) => {
  console.log(`\n${signal} received. Closing HTTP server and database connections...`);
  server.close(async () => {
    try {
      const mongoose = require('mongoose');
      await mongoose.connection.close();
      console.log('MongoDB connection closed cleanly.');
      process.exit(0);
    } catch (err) {
      console.error('Error during database close:', err);
      process.exit(1);
    }
  });
};

process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));

module.exports = app;
