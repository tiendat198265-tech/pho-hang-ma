const express = require('express');
const router = express.Router();
const customOrderController = require('../controllers/customOrderController');
const { verifyToken, optionalAuth, requireRole } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

// Khách gửi yêu cầu tùy chỉnh (Bắt buộc phải đăng nhập tài khoản)
router.post('/', verifyToken, customOrderController.createCustomOrderRequest);

// Upload ảnh tham khảo (Bắt buộc đăng nhập)
router.post('/upload-images', verifyToken, upload.array('images', 10), customOrderController.uploadImages);

// Khách tra cứu yêu cầu của mình
router.get('/my-requests', verifyToken, customOrderController.getMyRequests);
router.get('/code/:code', optionalAuth, customOrderController.getRequestByCode);

// Khách phản hồi báo giá (Chấp nhận -> Tạo Order, hoặc Từ chối - Bắt buộc đăng nhập)
router.post('/:id/respond-quote', verifyToken, customOrderController.respondToQuote);

// Admin / Staff quản lý
router.get('/admin', verifyToken, requireRole('ADMIN', 'STAFF'), customOrderController.getAdminRequests);
router.get('/admin/:id', verifyToken, requireRole('ADMIN', 'STAFF'), customOrderController.getAdminRequestDetail);
router.post('/admin/:id/quote', verifyToken, requireRole('ADMIN', 'STAFF'), customOrderController.submitQuote);
router.patch('/admin/:id/status', verifyToken, requireRole('ADMIN', 'STAFF'), customOrderController.updateStatus);

module.exports = router;
