const express = require('express');
const router = express.Router();
const { getRevenueReport } = require('../controllers/reportController');
const { verifyToken, requireRole, requirePermission } = require('../middlewares/auth');

router.get('/revenue', verifyToken, requireRole('STAFF', 'ADMIN', 'SUPER_ADMIN'), requirePermission('REPORTS'), getRevenueReport);

module.exports = router;
