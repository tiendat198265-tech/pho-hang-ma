const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'pho_hang_ma_secret_key_2026_dev';

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Yêu cầu đăng nhập để thực hiện thao tác này' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Tài khoản không tồn tại hoặc đã bị khóa' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn' });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (user && user.isActive) {
        req.user = user;
      }
    }
  } catch (err) {
    // Guest access allowed
  }
  next();
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Chưa xác thực người dùng' });
    }
    // SUPER_ADMIN has access to all roles
    if (req.user.role === 'SUPER_ADMIN' || roles.includes(req.user.role)) {
      return next();
    }
    return res.status(403).json({
      success: false,
      message: `Bạn không có quyền truy cập chức năng này (Yêu cầu vai trò: ${roles.join(', ')})`,
    });
  };
};

const requirePermission = (...permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Chưa xác thực người dùng' });
    }
    // SUPER_ADMIN has all permissions
    if (req.user.role === 'SUPER_ADMIN') {
      return next();
    }
    // ADMIN has all permissions except special SUPER_ADMIN actions
    if (req.user.role === 'ADMIN') {
      return next();
    }
    // STAFF requires specific permission grant (case-insensitive)
    if (req.user.role === 'STAFF') {
      const perms = (Array.isArray(req.user.permissions) ? req.user.permissions : []).map((p) =>
        String(p).toLowerCase()
      );
      const targetList = permissions.map((p) => String(p).toLowerCase());
      if (perms.includes('all') || targetList.some((t) => perms.includes(t))) {
        return next();
      }
    }
    return res.status(403).json({
      success: false,
      message: `Bạn không có quyền thực hiện nghiệp vụ: [${permissions.join(', ')}]. Vui lòng liên hệ Quản trị viên cấp quyền.`,
    });
  };
};

const requireSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Chưa xác thực người dùng' });
  }
  if (req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Chức năng đặc biệt này chỉ dành riêng cho Tổng Quản Trị Viên (SUPER_ADMIN)',
    });
  }
  next();
};

module.exports = {
  verifyToken,
  optionalAuth,
  requireRole,
  requirePermission,
  requireSuperAdmin,
  JWT_SECRET,
};

