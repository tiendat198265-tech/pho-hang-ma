const rateLimit = require('express-rate-limit');

/**
 * Standard factory for JSON-formatted rate limiter error responses
 */
const createLimiter = ({ windowMs, max, message }) => {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: {
      success: false,
      message,
    },
    // Handler ensuring consistent JSON format
    handler: (req, res, next, options) => {
      res.status(options.statusCode).json(options.message);
    },
  });
};

// Global API rate limit: 300 requests per 15 minutes per IP
const globalLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: 'Bạn đã gửi quá nhiều yêu cầu đến máy chủ. Vui lòng thử lại sau vài phút.',
});

// Authentication rate limit: 10 attempts per 15 minutes (protects against credential brute-force)
const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Quá nhiều lần thử đăng nhập/đăng ký thất bại. Vì lý do bảo mật, vui lòng thử lại sau 15 phút.',
});

// Order and Quote submission rate limit: 30 submissions per hour per IP (protects against spam orders)
const orderLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max: 30,
  message: 'Bạn đã gửi quá nhiều yêu cầu tạo đơn/báo giá trong thời gian ngắn. Vui lòng thử lại sau.',
});

// Search & filter query rate limit: 60 queries per minute per IP
const searchLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: 60,
  message: 'Tần suất tìm kiếm quá nhanh. Vui lòng làm chậm thao tác.',
});

// Consultation contact form rate limit: 10 per 15 minutes per IP
const consultationLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Bạn đã gửi yêu cầu tư vấn nhiều lần. Chuyên viên của chúng tôi sẽ liên hệ lại sớm nhất.',
});

module.exports = {
  globalLimiter,
  authLimiter,
  orderLimiter,
  searchLimiter,
  consultationLimiter,
};
