const express = require('express');
const router = express.Router();
const {
  validateCoupon,
  getAllCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  toggleCouponActive,
} = require('../controllers/couponController');
const { verifyToken, optionalAuth, requireRole, requirePermission } = require('../middlewares/auth');

// Public checkout validation
router.post('/validate', optionalAuth, validateCoupon);

// Admin management
router.get('/', verifyToken, requireRole('STAFF', 'ADMIN', 'SUPER_ADMIN'), getAllCoupons);
router.get('/admin', verifyToken, requireRole('STAFF', 'ADMIN', 'SUPER_ADMIN'), getAllCoupons);
router.post('/', verifyToken, requireRole('ADMIN', 'SUPER_ADMIN'), createCoupon);
router.post('/admin', verifyToken, requireRole('ADMIN', 'SUPER_ADMIN'), createCoupon);
router.put('/:id', verifyToken, requireRole('ADMIN', 'SUPER_ADMIN'), updateCoupon);
router.put('/admin/:id', verifyToken, requireRole('ADMIN', 'SUPER_ADMIN'), updateCoupon);
router.patch('/:id/toggle', verifyToken, requireRole('ADMIN', 'SUPER_ADMIN'), toggleCouponActive);
router.delete('/:id', verifyToken, requireRole('ADMIN', 'SUPER_ADMIN'), deleteCoupon);
router.delete('/admin/:id', verifyToken, requireRole('ADMIN', 'SUPER_ADMIN'), deleteCoupon);

module.exports = router;
