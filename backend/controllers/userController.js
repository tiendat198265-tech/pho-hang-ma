const User = require('../models/User');
const Order = require('../models/Order');
const CustomOrderRequest = require('../models/CustomOrderRequest');
const Review = require('../models/Review');
const Consultation = require('../models/Consultation');
const { logAudit } = require('../utils/auditLogger');

// @desc    Admin: Get list of users (Customers or Staff)
// @route   GET /api/admin/users
// @access  Private (Staff/Admin)
exports.getUsers = async (req, res) => {
  try {
    const { role, search, status, page = 1, limit = 20 } = req.query;
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);

    const query = {};
    if (role && role !== 'ALL') {
      if (role === 'STAFF_GROUP') {
        query.role = { $in: ['STAFF', 'ADMIN', 'SUPER_ADMIN'] };
      } else {
        query.role = role;
      }
    }
    if (status === 'ACTIVE') query.isActive = true;
    if (status === 'INACTIVE') query.isActive = false;

    if (search) {
      const cleanSearch = String(search).trim();
      query.$or = [
        { name: { $regex: cleanSearch, $options: 'i' } },
        { email: { $regex: cleanSearch, $options: 'i' } },
        { phone: { $regex: cleanSearch, $options: 'i' } },
      ];
    }

    const [total, users] = await Promise.all([
      User.countDocuments(query),
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip((safePage - 1) * safeLimit)
        .limit(safeLimit)
        .lean(),
    ]);

    res.json({
      success: true,
      total,
      data: users,
      users,
      pagination: {
        total,
        page: safePage,
        pages: Math.ceil(total / safeLimit),
        totalPages: Math.ceil(total / safeLimit),
      },
    });
  } catch (error) {
    console.error('getUsers error:', error);
    res.status(500).json({ success: false, message: 'Lỗi tải danh sách người dùng' });
  }
};

// @desc    Admin: Get user details and order history
// @route   GET /api/admin/users/:id
// @access  Private (Staff/Admin)
exports.getUserDetail = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password').lean();
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    }

    const [orders, customRequests] = await Promise.all([
      Order.find({ customerId: user._id })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean(),
      CustomOrderRequest.find({
        $or: [{ customerId: user._id }, { 'contactInfo.phone': user.phone }],
      })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean(),
    ]);

    const totalSpent = orders
      .filter((o) => o.orderStatus !== 'CANCELLED')
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    res.json({
      success: true,
      data: {
        user,
        stats: {
          ordersCount: orders.length,
          customRequestsCount: customRequests.length,
          totalSpent,
        },
        orders,
        customRequests,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi tải chi tiết người dùng' });
  }
};

// @desc    Admin: Toggle user active / lock status
// @route   PATCH /api/admin/users/:id/status
// @access  Private (Admin)
exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    }

    // Protection: Cannot lock yourself
    if (req.user._id.toString() === user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Bạn không thể tự khóa tài khoản của chính mình' });
    }

    // Protection: Normal ADMIN cannot lock a SUPER_ADMIN
    if (user.role === 'SUPER_ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Chỉ SUPER_ADMIN mới có quyền thay đổi trạng thái của SUPER_ADMIN' });
    }

    user.isActive = !user.isActive;
    await user.save();

    await logAudit(req, {
      action: user.isActive ? 'UNLOCK_USER' : 'LOCK_USER',
      entity: 'USER',
      entityId: user._id,
      details: `${user.isActive ? 'Mở khóa' : 'Khóa'} tài khoản người dùng: ${user.name} (${user.email})`,
    });

    res.json({
      success: true,
      message: `${user.isActive ? 'Mở khóa' : 'Khóa'} tài khoản thành công`,
      data: { isActive: user.isActive },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi cập nhật trạng thái tài khoản' });
  }
};

// @desc    Admin: Update any user (Staff or Customer)
// @route   PUT /api/admin/users/:id
// @access  Private (Admin / Super Admin)
exports.updateUser = async (req, res) => {
  try {
    const { name, email, phone, address, password, role, permissions, isActive } = req.body;
    const targetUser = await User.findById(req.params.id);

    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    }

    // Role checks
    if (role && role !== targetUser.role) {
      if (role === 'SUPER_ADMIN' && req.user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền chỉ định hoặc tự nâng cấp tài khoản lên Tổng Quản Trị Viên (SUPER_ADMIN)',
        });
      }

      if (targetUser.role === 'SUPER_ADMIN' && req.user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Chỉ có Tổng Quản Trị Viên mới có quyền thay đổi quyền của tài khoản SUPER_ADMIN khác',
        });
      }

      if (req.user._id.toString() === targetUser._id.toString() && (role === 'STAFF' || role === 'CUSTOMER')) {
        return res.status(400).json({
          success: false,
          message: 'Bạn không thể tự hạ cấp vai trò quản trị viên của chính mình',
        });
      }

      targetUser.role = role;
    }

    // Check email uniqueness if modified
    if (email && email.trim()) {
      const normalizedEmail = email.trim().toLowerCase();
      if (normalizedEmail !== targetUser.email) {
        const existing = await User.findOne({ email: normalizedEmail, _id: { $ne: targetUser._id } });
        if (existing) {
          return res.status(400).json({ success: false, message: 'Email này đã được sử dụng bởi tài khoản khác' });
        }
        targetUser.email = normalizedEmail;
      }
    }

    const oldName = targetUser.name;
    const oldPhone = targetUser.phone;
    const newName = name && name.trim() ? name.trim() : oldName;
    const nameChanged = newName !== oldName;

    if (nameChanged) {
      targetUser.name = newName;
      if (!targetUser.nameHistory) targetUser.nameHistory = [];
      targetUser.nameHistory.push({
        oldName,
        newName,
        changedAt: new Date(),
        ipAddress: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.ip || '',
      });

      // Synchronize past orders
      const orderFilter = {
        $or: [
          { customerId: targetUser._id },
          ...(oldPhone ? [{ 'shippingAddress.phone': oldPhone }] : []),
        ],
      };
      await Order.updateMany(orderFilter, {
        $set: { 'shippingAddress.fullName': newName },
      });

      // Synchronize timeline logs under old name
      await Order.updateMany(
        {
          customerId: targetUser._id,
          'timeline.changedBy': oldName,
        },
        {
          $set: { 'timeline.$[elem].changedBy': newName },
        },
        {
          arrayFilters: [{ 'elem.changedBy': oldName }],
        }
      );

      // Synchronize custom order requests
      const customFilter = {
        $or: [
          { customerId: targetUser._id },
          ...(oldPhone ? [{ 'contactInfo.phone': oldPhone }] : []),
          ...(targetUser.email ? [{ 'contactInfo.email': targetUser.email }] : []),
        ],
      };
      await CustomOrderRequest.updateMany(customFilter, {
        $set: { 'contactInfo.fullName': newName },
      });

      // Synchronize reviews
      await Review.updateMany(
        { userId: targetUser._id },
        { $set: { userName: newName } }
      );

      // Synchronize consultation requests
      const consultFilter = {
        $or: [
          { userId: targetUser._id },
          ...(oldPhone ? [{ phone: oldPhone }] : []),
          ...(targetUser.email ? [{ email: targetUser.email }] : []),
        ],
      };
      await Consultation.updateMany(consultFilter, {
        $set: { fullName: newName },
      });
    }

    if (phone !== undefined) targetUser.phone = phone ? phone.trim() : '';
    if (address !== undefined) targetUser.address = address ? address.trim() : '';
    if (isActive !== undefined) targetUser.isActive = Boolean(isActive);

    // Update password if provided
    if (password && password.trim()) {
      if (password.trim().length < 6) {
        return res.status(400).json({ success: false, message: 'Mật khẩu phải có ít nhất 6 ký tự' });
      }
      targetUser.password = password.trim();
    }

    // Update permissions if provided
    if (permissions && Array.isArray(permissions)) {
      targetUser.permissions = permissions;
    }

    await targetUser.save();

    await logAudit(req, {
      action: 'UPDATE_USER',
      entity: 'USER',
      entityId: targetUser._id,
      details: `Cập nhật tài khoản người dùng: ${targetUser.name} (${targetUser.email}) - Vai trò: ${targetUser.role}`,
      metadata: {
        name: targetUser.name,
        email: targetUser.email,
        phone: targetUser.phone,
        address: targetUser.address,
        role: targetUser.role,
        permissions: targetUser.permissions,
        isActive: targetUser.isActive,
      },
    });

    res.json({
      success: true,
      message: 'Cập nhật tài khoản người dùng thành công',
      data: {
        _id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        phone: targetUser.phone,
        address: targetUser.address,
        role: targetUser.role,
        permissions: targetUser.permissions,
        isActive: targetUser.isActive,
      },
    });
  } catch (error) {
    console.error('updateUser error:', error);
    res.status(500).json({ success: false, message: error.message || 'Lỗi cập nhật người dùng' });
  }
};

exports.updateStaffPermissions = exports.updateUser;

// @desc    Admin: Create customer or general user
// @route   POST /api/admin/users
// @access  Private (Admin / Super Admin)
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, phone, address, role = 'CUSTOMER', permissions = [] } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Họ tên, email và mật khẩu là bắt buộc' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Mật khẩu phải có ít nhất 6 ký tự' });
    }

    if (role === 'SUPER_ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Chỉ có Tổng Quản Trị Viên mới có quyền tạo tài khoản SUPER_ADMIN',
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email này đã tồn tại trong hệ thống' });
    }

    const newUser = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: password.trim(),
      phone: phone ? phone.trim() : '',
      address: address ? address.trim() : '',
      role,
      permissions,
      isActive: true,
    });

    await logAudit(req, {
      action: 'CREATE_USER',
      entity: 'USER',
      entityId: newUser._id,
      details: `Tạo tài khoản: ${newUser.name} (${newUser.email}) - Vai trò: ${newUser.role}`,
    });

    res.status(201).json({
      success: true,
      message: 'Tạo tài khoản người dùng thành công',
      data: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        address: newUser.address,
        role: newUser.role,
        permissions: newUser.permissions,
        isActive: newUser.isActive,
      },
    });
  } catch (error) {
    console.error('createUser error:', error);
    res.status(500).json({ success: false, message: error.message || 'Lỗi tạo tài khoản' });
  }
};

// @desc    Admin: Delete user (Customer or Staff)
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin / Super Admin)
exports.deleteUser = async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản cần xóa' });
    }

    if (req.user._id.toString() === targetUser._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Bạn không thể tự xóa tài khoản của chính mình',
      });
    }

    if (targetUser.role === 'SUPER_ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Chỉ có Tổng Quản Trị Viên mới có quyền xóa tài khoản SUPER_ADMIN',
      });
    }

    await User.findByIdAndDelete(targetUser._id);

    await logAudit(req, {
      action: 'DELETE_USER',
      entity: 'USER',
      entityId: targetUser._id,
      details: `Xóa tài khoản người dùng: ${targetUser.name} (${targetUser.email}) - Vai trò: ${targetUser.role}`,
    });

    res.json({
      success: true,
      message: `Đã xóa tài khoản ${targetUser.name} thành công`,
    });
  } catch (error) {
    console.error('deleteUser error:', error);
    res.status(500).json({ success: false, message: error.message || 'Lỗi xóa tài khoản' });
  }
};

// @desc    Admin: Get list of staff & admin accounts
// @route   GET /api/admin/users/staff
exports.getStaffList = async (req, res) => {
  try {
    const staff = await User.find({
      role: { $in: ['STAFF', 'ADMIN', 'SUPER_ADMIN'] },
    })
      .select('-password')
      .sort({ role: 1, createdAt: -1 });

    res.json({ success: true, data: staff });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi tải danh sách nhân viên' });
  }
};

// @desc    Admin: Create new staff or admin user
// @route   POST /api/admin/users/staff
exports.createStaff = async (req, res) => {
  try {
    const { name, email, password, phone, role = 'STAFF', permissions = [] } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Tên, email và mật khẩu là bắt buộc' });
    }

    // CRITICAL SECURITY RULE: Only SUPER_ADMIN can assign SUPER_ADMIN role
    if (role === 'SUPER_ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền chỉ định vai trò Tổng Quản Trị (SUPER_ADMIN)',
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email này đã tồn tại trong hệ thống' });
    }

    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      phone: phone || '',
      role,
      permissions,
      isActive: true,
    });

    await logAudit(req, {
      action: 'CREATE_STAFF',
      entity: 'USER',
      entityId: newUser._id,
      details: `Tạo tài khoản nhân sự: ${newUser.name} (${newUser.email}) - Vai trò: ${newUser.role}`,
    });

    res.status(201).json({
      success: true,
      message: 'Tạo tài khoản nhân sự thành công',
      data: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        permissions: newUser.permissions,
      },
    });
  } catch (error) {
    console.error('createStaff error:', error);
    res.status(500).json({ success: false, message: error.message || 'Lỗi tạo nhân viên' });
  }
};

// @desc    Admin: Get orders of a specific customer
// @route   GET /api/admin/users/:id/orders
// @access  Private (Staff/Admin)
exports.getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ customerId: req.params.id }).sort({ createdAt: -1 });
    res.json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    console.error('getUserOrders error:', error);
    res.status(500).json({ success: false, message: 'Lỗi tải danh sách đơn hàng của khách' });
  }
};
