const express = require('express');
const router = express.Router();
const {
  getInventorySummary,
  adjustInventory,
  getInventoryLogs,
} = require('../controllers/inventoryController');
const { verifyToken, requireRole, requirePermission } = require('../middlewares/auth');

router.use(verifyToken, requireRole('STAFF', 'ADMIN', 'SUPER_ADMIN'), requirePermission('INVENTORY'));

router.get('/', getInventorySummary);
router.get('/summary', getInventorySummary);
router.post('/adjust', adjustInventory);
router.get('/logs', getInventoryLogs);

module.exports = router;
