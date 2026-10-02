const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUserDetail,
  getUserOrders,
  toggleUserStatus,
  updateUser,
  updateStaffPermissions,
  getStaffList,
  createStaff,
  createUser,
  deleteUser,
} = require('../controllers/userController');
const { verifyToken, requireRole, requirePermission } = require('../middlewares/auth');

router.use(verifyToken);

// Staff management & RBAC
router.get('/staff', requireRole('ADMIN', 'SUPER_ADMIN'), getStaffList);
router.post('/staff', requireRole('ADMIN', 'SUPER_ADMIN'), createStaff);

// Customer management routes
router.get('/customers', requireRole('STAFF', 'ADMIN', 'SUPER_ADMIN'), (req, res, next) => {
  req.query.role = 'CUSTOMER';
  return getUsers(req, res, next);
});
router.get('/:id/orders', requireRole('STAFF', 'ADMIN', 'SUPER_ADMIN'), getUserOrders);

// General User management
router.get('/', requireRole('STAFF', 'ADMIN', 'SUPER_ADMIN'), getUsers);
router.post('/', requireRole('ADMIN', 'SUPER_ADMIN'), createUser);
router.get('/:id', requireRole('STAFF', 'ADMIN', 'SUPER_ADMIN'), getUserDetail);
router.patch('/:id/status', requireRole('ADMIN', 'SUPER_ADMIN'), toggleUserStatus);
router.patch('/:id/toggle-status', requireRole('ADMIN', 'SUPER_ADMIN'), toggleUserStatus);
router.put('/:id', requireRole('ADMIN', 'SUPER_ADMIN'), updateUser);
router.put('/:id/permissions', requireRole('ADMIN', 'SUPER_ADMIN'), updateUser);
router.delete('/:id', requireRole('ADMIN', 'SUPER_ADMIN'), deleteUser);

module.exports = router;
