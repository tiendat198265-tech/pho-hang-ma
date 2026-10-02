const express = require('express');
const router = express.Router();
const bannerController = require('../controllers/bannerController');
const { verifyToken, requireRole } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

// Public route: Lấy banner active theo vị trí
router.get('/', bannerController.getBanners);

// Admin routes
router.get('/admin', verifyToken, requireRole('ADMIN', 'STAFF'), bannerController.getAdminBanners);
router.get('/admin/:id', verifyToken, requireRole('ADMIN', 'STAFF'), bannerController.getBannerById);
router.post('/upload', verifyToken, requireRole('ADMIN', 'STAFF'), upload.single('image'), bannerController.uploadBannerImage);
// Create banner (support both / and /admin)
router.post('/', verifyToken, requireRole('ADMIN'), bannerController.createBanner);
router.post('/admin', verifyToken, requireRole('ADMIN'), bannerController.createBanner);

// Update banner (support both /:id and /admin/:id)
router.put('/:id', verifyToken, requireRole('ADMIN'), bannerController.updateBanner);
router.put('/admin/:id', verifyToken, requireRole('ADMIN'), bannerController.updateBanner);

// Toggle banner status (support both /:id/toggle and /admin/:id/toggle)
router.patch('/:id/toggle', verifyToken, requireRole('ADMIN'), bannerController.toggleBannerStatus);
router.patch('/admin/:id/toggle', verifyToken, requireRole('ADMIN'), bannerController.toggleBannerStatus);

// Delete banner (support both /:id and /admin/:id)
router.delete('/:id', verifyToken, requireRole('ADMIN'), bannerController.deleteBanner);
router.delete('/admin/:id', verifyToken, requireRole('ADMIN'), bannerController.deleteBanner);

module.exports = router;
