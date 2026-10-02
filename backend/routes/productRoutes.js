const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { verifyToken, requireRole, requirePermission } = require('../middlewares/auth');

// Public
router.get('/', productController.getProducts);
router.get('/quick-search', productController.quickSearch);
router.get('/:slug', productController.getProductBySlug);
router.get('/id/:id', productController.getProductById);

// Admin routes
router.get('/admin/all', verifyToken, requireRole('STAFF', 'ADMIN', 'SUPER_ADMIN'), requirePermission('PRODUCTS'), productController.getAdminProducts);
router.post('/', verifyToken, requireRole('STAFF', 'ADMIN', 'SUPER_ADMIN'), requirePermission('PRODUCTS'), productController.createProduct);
router.put('/:id', verifyToken, requireRole('STAFF', 'ADMIN', 'SUPER_ADMIN'), requirePermission('PRODUCTS'), productController.updateProduct);
router.delete('/:id', verifyToken, requireRole('ADMIN', 'SUPER_ADMIN'), requirePermission('PRODUCTS'), productController.deleteProduct);
router.post('/admin/bulk-status', verifyToken, requireRole('ADMIN', 'SUPER_ADMIN'), requirePermission('PRODUCTS'), productController.bulkUpdateProductsStatus);
router.patch('/admin/bulk-status', verifyToken, requireRole('ADMIN', 'SUPER_ADMIN'), requirePermission('PRODUCTS'), productController.bulkUpdateProductsStatus);
router.patch('/:id/quick-update', verifyToken, requireRole('STAFF', 'ADMIN', 'SUPER_ADMIN'), requirePermission('PRODUCTS'), productController.quickUpdateProduct);
router.patch('/:id/move-folder', verifyToken, requireRole('STAFF', 'ADMIN', 'SUPER_ADMIN'), requirePermission('PRODUCTS'), productController.moveProductFolder);
router.post('/admin/bulk-move-folder', verifyToken, requireRole('STAFF', 'ADMIN', 'SUPER_ADMIN'), requirePermission('PRODUCTS'), productController.bulkMoveProductsFolder);
router.post('/admin/bulk-delete', verifyToken, requireRole('ADMIN', 'SUPER_ADMIN'), requirePermission('PRODUCTS'), productController.bulkDeleteProducts);
router.delete('/admin/bulk-delete', verifyToken, requireRole('ADMIN', 'SUPER_ADMIN'), requirePermission('PRODUCTS'), productController.bulkDeleteProducts);

module.exports = router;
