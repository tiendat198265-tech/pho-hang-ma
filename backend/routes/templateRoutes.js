const express = require('express');
const router = express.Router();
const templateController = require('../controllers/templateController');
const { verifyToken, requireRole } = require('../middlewares/auth');

router.get('/', templateController.getAllTemplates);
router.get('/admin', verifyToken, requireRole('ADMIN', 'STAFF'), templateController.getAdminTemplates);

// Bulk operations
router.post('/bulk-delete', verifyToken, requireRole('ADMIN', 'SUPER_ADMIN'), templateController.bulkDeleteTemplates);
router.delete('/bulk-delete', verifyToken, requireRole('ADMIN', 'SUPER_ADMIN'), templateController.bulkDeleteTemplates);
router.post('/create-from-custom-order', verifyToken, requireRole('ADMIN'), templateController.createTemplateFromCustomOrder);

router.get('/:slug', templateController.getTemplateBySlug);

router.post('/', verifyToken, requireRole('ADMIN'), templateController.createTemplate);
router.put('/:id', verifyToken, requireRole('ADMIN'), templateController.updateTemplate);
router.delete('/:id', verifyToken, requireRole('ADMIN'), templateController.deleteTemplate);
router.patch('/:id/toggle-status', verifyToken, requireRole('ADMIN'), templateController.toggleStatus);

module.exports = router;
