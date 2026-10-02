const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/dashboardController');
const { verifyToken, requireRole, requirePermission } = require('../middlewares/auth');

router.get('/', verifyToken, requireRole('STAFF', 'ADMIN', 'SUPER_ADMIN'), getDashboardStats);
router.get('/stats', verifyToken, requireRole('STAFF', 'ADMIN', 'SUPER_ADMIN'), getDashboardStats);

module.exports = router;
