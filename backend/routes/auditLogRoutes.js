const express = require('express');
const router = express.Router();
const { getAuditLogs } = require('../controllers/auditLogController');
const { verifyToken, requireRole, requirePermission } = require('../middlewares/auth');

router.get('/', verifyToken, requireRole('ADMIN', 'SUPER_ADMIN'), requirePermission('AUDIT_LOGS'), getAuditLogs);

module.exports = router;
