const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Order = require('../models/Order');
const CustomOrderRequest = require('../models/CustomOrderRequest');
const Review = require('../models/Review');
const Consultation = require('../models/Consultation');
const { JWT_SECRET } = require('../middlewares/auth');
const { logAudit } = require('../utils/auditLogger');

exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ họ tên, email và mật khẩu' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email này đã được đăng ký tài khoản' });
    }

    const user = await User.create({
      name,
      email,
      password,
      phone: phone || '',
      address: address || '',
      role: 'CUSTOMER',
    });

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản thành công',
      token,
      user: {
        _id: user._id,
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
        avatar: user.avatar || '',
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập email và mật khẩu' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không chính xác' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không chính xác' });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      message: 'Đăng nhập thành công',
      token,
      user: {
        _id: user._id,
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
        avatar: user.avatar || '',
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, address, avatar } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    }

    const oldName = user.name;
    const newName = name ? name.trim() : oldName;
    const nameChanged = newName && newName !== oldName;

    const oldPhone = user.phone;
    const newPhone = phone !== undefined ? phone.trim() : oldPhone;

    let ordersUpdated = 0;
    let customOrdersUpdated = 0;
    let reviewsUpdated = 0;

    if (nameChanged) {
      user.name = newName;
      if (!user.nameHistory) user.nameHistory = [];
      user.nameHistory.push({
        oldName,
        newName,
        changedAt: new Date(),
        ipAddress: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.ip || '',
      });

      // Synchronize past orders with new name
      const orderFilter = {
        $or: [
          { customerId: user._id },
          ...(oldPhone ? [{ 'shippingAddress.phone': oldPhone }] : []),
          ...(newPhone ? [{ 'shippingAddress.phone': newPhone }] : []),
        ],
      };
      const orderRes = await Order.updateMany(orderFilter, {
        $set: { 'shippingAddress.fullName': newName },
      });
      ordersUpdated = orderRes.modifiedCount || 0;

      // Synchronize timeline logs under old name
      await Order.updateMany(
        {
          customerId: user._id,
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
          { customerId: user._id },
          ...(oldPhone ? [{ 'contactInfo.phone': oldPhone }] : []),
          ...(newPhone ? [{ 'contactInfo.phone': newPhone }] : []),
          ...(user.email ? [{ 'contactInfo.email': user.email }] : []),
        ],
      };
      const customRes = await CustomOrderRequest.updateMany(customFilter, {
        $set: { 'contactInfo.fullName': newName },
      });
      customOrdersUpdated = customRes.modifiedCount || 0;

      // Synchronize product reviews
      const reviewRes = await Review.updateMany(
        { userId: user._id },
        { $set: { userName: newName } }
      );
      reviewsUpdated = reviewRes.modifiedCount || 0;

      // Synchronize consultation requests
      const consultFilter = {
        $or: [
          { userId: user._id },
          ...(oldPhone ? [{ phone: oldPhone }] : []),
          ...(newPhone ? [{ phone: newPhone }] : []),
          ...(user.email ? [{ email: user.email }] : []),
        ],
      };
      await Consultation.updateMany(consultFilter, {
        $set: { fullName: newName },
      });

      await logAudit(req, {
        action: 'CHANGE_NAME',
        entity: 'USER',
        entityId: user._id,
        details: `Người dùng [${user.email}] (${user.role}) đã đổi họ tên từ "${oldName}" sang "${newName}". Đã đồng bộ ${ordersUpdated} đơn hàng, ${customOrdersUpdated} yêu cầu tùy chỉnh, ${reviewsUpdated} đánh giá đã đặt trước đó.`,
        metadata: {
          userId: user._id,
          email: user.email,
          oldName,
          newName,
          role: user.role,
          ordersUpdated,
          customOrdersUpdated,
          reviewsUpdated,
        },
      });
    }

    if (phone !== undefined) user.phone = newPhone;
    if (address !== undefined) user.address = address.trim();
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();

    res.json({
      success: true,
      message: nameChanged
        ? `Đổi tên thành công: "${newName}". Đã đồng bộ thông tin ${ordersUpdated} đơn hàng và hồ sơ liên quan đã đặt trước đó.`
        : 'Cập nhật thông tin thành công',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
        avatar: user.avatar || '',
        nameHistory: user.nameHistory,
      },
      syncedStats: {
        ordersUpdated,
        customOrdersUpdated,
        reviewsUpdated,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp mật khẩu hiện tại và mật khẩu mới' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Mật khẩu hiện tại không chính xác' });
    }

    user.password = newPassword;
    await user.save();

    await logAudit(req, {
      action: 'CHANGE_PASSWORD',
      entity: 'USER',
      entityId: user._id,
      details: `Người dùng [${user.email}] (${user.role}) đã đổi mật khẩu tài khoản thành công`,
      metadata: { userId: user._id, email: user.email, role: user.role },
    });

    res.json({ success: true, message: 'Đổi mật khẩu thành công' });
  } catch (error) {
    console.error('changePassword error:', error);
    res.status(500).json({ success: false, message: error.message || 'Lỗi đổi mật khẩu' });
  }
};

// Cập nhật ảnh đại diện người dùng
exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Vui lòng chọn file ảnh để tải lên' });
    }

    let avatarUrl = `/uploads/${req.file.filename}`;
    const { isCloudinaryConfigured, uploadToCloudinary } = require('../config/cloudinary');

    if (isCloudinaryConfigured()) {
      try {
        const cloudResult = await uploadToCloudinary(req.file.path, 'pho-hang-ma/avatars');
        avatarUrl = cloudResult.secure_url;
      } catch (cErr) {
        console.warn('Cloudinary upload warning for avatar, falling back to local file:', cErr.message);
      }
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    }

    user.avatar = avatarUrl;
    await user.save();

    await logAudit(req, {
      action: 'UPDATE_AVATAR',
      entity: 'USER',
      entityId: user._id,
      details: `Người dùng [${user.email}] (${user.role}) đã tải lên ảnh đại diện mới`,
      metadata: { userId: user._id, email: user.email, avatarUrl },
    });

    res.json({
      success: true,
      message: 'Cập nhật ảnh đại diện thành công',
      avatar: avatarUrl,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
        avatar: user.avatar || '',
        nameHistory: user.nameHistory,
      },
    });
  } catch (error) {
    console.error('uploadAvatar error:', error);
    res.status(500).json({ success: false, message: error.message || 'Lỗi tải ảnh đại diện' });
  }
};

