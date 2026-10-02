const express = require('express');
const router = express.Router();
const consultationController = require('../controllers/consultationController');
const { verifyToken, requireRole } = require('../middlewares/auth');
const { consultationLimiter } = require('../middlewares/rateLimiter');

// Public route: Khách hàng gửi yêu cầu tư vấn
router.post('/', consultationLimiter, consultationController.createConsultation);

// Admin/Staff routes: Quản lý danh sách và gọi điện
router.get(
  '/',
  verifyToken,
  requireRole('ADMIN', 'SUPER_ADMIN', 'STAFF'),
  consultationController.getConsultations
);

router.get(
  '/stats',
  verifyToken,
  requireRole('ADMIN', 'SUPER_ADMIN', 'STAFF'),
  consultationController.getConsultationStats
);

router.put(
  '/:id',
  verifyToken,
  requireRole('ADMIN', 'SUPER_ADMIN', 'STAFF'),
  consultationController.updateConsultation
);

router.delete(
  '/:id',
  verifyToken,
  requireRole('ADMIN', 'SUPER_ADMIN'),
  consultationController.deleteConsultation
);

module.exports = router;
