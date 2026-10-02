const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { verifyToken, optionalAuth, requireRole, requirePermission } = require('../middlewares/auth');
const { orderLimiter } = require('../middlewares/rateLimiter');

router.post('/', orderLimiter, verifyToken, orderController.createOrder);
router.get('/my-orders', verifyToken, orderController.getMyOrders);
router.get('/code/:code', optionalAuth, orderController.getOrderByCode);

// Admin / Staff routes (support both root and /admin prefixes)
router.get('/', verifyToken, requireRole('STAFF', 'ADMIN', 'SUPER_ADMIN'), requirePermission('ORDERS'), orderController.getAdminOrders);
router.get('/admin', verifyToken, requireRole('STAFF', 'ADMIN', 'SUPER_ADMIN'), requirePermission('ORDERS'), orderController.getAdminOrders);
router.patch('/:id/status', verifyToken, requireRole('STAFF', 'ADMIN', 'SUPER_ADMIN'), requirePermission('ORDERS'), orderController.updateOrderStatus);
router.patch('/admin/:id/status', verifyToken, requireRole('STAFF', 'ADMIN', 'SUPER_ADMIN'), requirePermission('ORDERS'), orderController.updateOrderStatus);
router.put('/:id/status', verifyToken, requireRole('STAFF', 'ADMIN', 'SUPER_ADMIN'), requirePermission('ORDERS'), orderController.updateOrderStatus);
router.put('/admin/:id/status', verifyToken, requireRole('STAFF', 'ADMIN', 'SUPER_ADMIN'), requirePermission('ORDERS'), orderController.updateOrderStatus);

module.exports = router;
