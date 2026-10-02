const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const connectDB = require('./config/db');
const { globalLimiter } = require('./middlewares/rateLimiter');
const { sanitizeInputs } = require('./middlewares/sanitizer');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;
const HOST = process.env.HOST || '0.0.0.0';

// Connect to MongoDB
connectDB();

// 1. Hide technology stack
app.disable('x-powered-by');

// 2. HTTP Security Headers with Helmet
app.use(
  helmet({
    contentSecurityPolicy: false, // Prevents blocking Cloudinary CDN & YouTube media embeds
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Crucial: allows frontend to load images/videos from /uploads
    crossOriginEmbedderPolicy: false,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    frameguard: {
      action: 'sameorigin',
    },
    noSniff: true,
    xssFilter: true,
  })
);

// 3. CORS Policy - Strict Whitelisting in Production
const productionOrigins = [
  'https://tuyetmathuongtin.vercel.app',
  'https://frontend-two-rho-39.vercel.app',
  process.env.CLIENT_URL,
  process.env.CORS_ORIGIN,
].filter(Boolean);

const developmentOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
];

const allowedOrigins =
  process.env.NODE_ENV === 'production'
    ? productionOrigins
    : [...productionOrigins, ...developmentOrigins];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      const isAllowed =
        allowedOrigins.includes(origin) ||
        (process.env.NODE_ENV !== 'production' &&
          (origin.startsWith('http://localhost:') ||
            origin.startsWith('http://127.0.0.1:')));

      if (isAllowed) {
        return callback(null, true);
      }
      return callback(new Error('Chặn bởi chính sách bảo mật CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// 4. Global Anti-DoS Rate Limiter for all API routes
app.use('/api/', globalLimiter);

// 5. Body Parsing with Safe Size Limits (Prevents JSON payload bomb attacks)
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// 6. NoSQL Query Injection Prevention (Strips '$' and '.' operators from req.body, req.query, req.params)
app.use(
  mongoSanitize({
    replaceWith: '_',
    onSanitize: ({ req, key }) => {
      console.warn(`[Security Alert] Suspicious NoSQL injection sanitized in key: ${key}`);
    },
  })
);

// 7. Cross-Site Scripting (XSS) Sanitization on all incoming string inputs
app.use(sanitizeInputs);

// 8. Serve uploaded static files with browser cache headers (7 days)
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

// Centralized Production Error Handler (Masks database internals & stack traces in production)
app.use((err, req, res, next) => {
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    console.error('API Error:', err);
  } else {
    console.error('API Error:', err.message || 'Internal Server Error');
  }

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Mã định danh dữ liệu không hợp lệ',
    });
  }

  // Handle Mongoose Validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors || {}).map((val) => val.message);
    return res.status(400).json({
      success: false,
      message: messages.join(', ') || 'Dữ liệu cung cấp không hợp lệ',
    });
  }

  // Handle MongoDB duplicate key error (E11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0];
    const fieldName =
      field === 'email' ? 'Email' : field === 'phone' ? 'Số điện thoại' : field || 'Dữ liệu';
    return res.status(400).json({
      success: false,
      message: `${fieldName} này đã tồn tại trong hệ thống`,
    });
  }

  // Handle Multer file size error
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'Kích thước file tải lên vượt quá giới hạn cho phép',
    });
  }

  // Handle CORS policy block error
  if (err.message === 'Chặn bởi chính sách bảo mật CORS') {
    return res.status(403).json({
      success: false,
      message: 'Truy cập bị từ chối bởi chính sách bảo mật CORS',
    });
  }

  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message:
      isProd && statusCode === 500
        ? 'Lỗi máy chủ nội bộ. Vui lòng thử lại sau.'
        : err.message || 'Lỗi máy chủ nội bộ',
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
