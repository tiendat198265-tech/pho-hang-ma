const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { verifyToken, requireRole, requirePermission } = require('../middlewares/auth');

router.get('/', categoryController.getAllCategories);
router.get('/tree', categoryController.getCategoryTree);
router.get('/folder/:id', categoryController.getFolderDetails);
router.get('/admin', verifyToken, requireRole('STAFF', 'ADMIN', 'SUPER_ADMIN'), requirePermission('CATEGORIES', 'PRODUCTS'), categoryController.getAdminCategories);
router.post('/', verifyToken, requireRole('STAFF', 'ADMIN', 'SUPER_ADMIN'), requirePermission('CATEGORIES', 'PRODUCTS'), categoryController.createCategory);
router.put('/:id', verifyToken, requireRole('STAFF', 'ADMIN', 'SUPER_ADMIN'), requirePermission('CATEGORIES', 'PRODUCTS'), categoryController.updateCategory);
router.post('/bulk-delete', verifyToken, requireRole('ADMIN', 'SUPER_ADMIN'), requirePermission('CATEGORIES', 'PRODUCTS'), categoryController.bulkDeleteCategories);
router.delete('/bulk', verifyToken, requireRole('ADMIN', 'SUPER_ADMIN'), requirePermission('CATEGORIES', 'PRODUCTS'), categoryController.bulkDeleteCategories);
router.delete('/:id', verifyToken, requireRole('ADMIN', 'SUPER_ADMIN'), requirePermission('CATEGORIES', 'PRODUCTS'), categoryController.deleteCategory);

module.exports = router;
