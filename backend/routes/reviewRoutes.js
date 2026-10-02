const express = require('express');
const router = express.Router();
const {
  getProductReviews,
  submitReview,
  getAllReviews,
  updateReviewStatus,
  deleteReview,
} = require('../controllers/reviewController');
const { verifyToken, optionalAuth, requireRole, requirePermission } = require('../middlewares/auth');

// Public
router.get('/product/:productId', getProductReviews);
router.post('/', optionalAuth, submitReview);

// Admin management
router.get('/admin/all', verifyToken, requireRole('STAFF', 'ADMIN', 'SUPER_ADMIN'), requirePermission('REVIEWS'), getAllReviews);
router.patch('/admin/:id/status', verifyToken, requireRole('STAFF', 'ADMIN', 'SUPER_ADMIN'), requirePermission('REVIEWS'), updateReviewStatus);
router.put('/admin/:id/status', verifyToken, requireRole('STAFF', 'ADMIN', 'SUPER_ADMIN'), requirePermission('REVIEWS'), updateReviewStatus);
router.post('/admin/:id/reply', verifyToken, requireRole('STAFF', 'ADMIN', 'SUPER_ADMIN'), requirePermission('REVIEWS'), (req, res, next) => {
  if (req.body.reply !== undefined && req.body.adminReply === undefined) {
    req.body.adminReply = req.body.reply;
  }
  return updateReviewStatus(req, res, next);
});
router.patch('/admin/:id', verifyToken, requireRole('STAFF', 'ADMIN', 'SUPER_ADMIN'), requirePermission('REVIEWS'), updateReviewStatus);
router.put('/admin/:id', verifyToken, requireRole('STAFF', 'ADMIN', 'SUPER_ADMIN'), requirePermission('REVIEWS'), updateReviewStatus);
router.delete('/admin/:id', verifyToken, requireRole('ADMIN', 'SUPER_ADMIN'), requirePermission('REVIEWS'), deleteReview);

module.exports = router;
