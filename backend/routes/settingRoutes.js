const express = require('express');
const router = express.Router();
const {
  getPublicSettings,
  getAllSettings,
  updateSetting,
  updateSettingsBatch,
} = require('../controllers/settingController');
const { verifyToken, requireRole, requirePermission } = require('../middlewares/auth');

// Public settings endpoints
router.get('/', getPublicSettings);
router.get('/public', getPublicSettings);

// Admin settings endpoints
router.get('/admin', verifyToken, requireRole('STAFF', 'ADMIN', 'SUPER_ADMIN'), requirePermission('SETTINGS'), getAllSettings);
router.post('/admin/batch', verifyToken, requireRole('ADMIN', 'SUPER_ADMIN'), requirePermission('SETTINGS'), updateSettingsBatch);
router.put('/admin/batch', verifyToken, requireRole('ADMIN', 'SUPER_ADMIN'), requirePermission('SETTINGS'), updateSettingsBatch);
router.put('/admin/:key', verifyToken, requireRole('ADMIN', 'SUPER_ADMIN'), requirePermission('SETTINGS'), updateSetting);

module.exports = router;
