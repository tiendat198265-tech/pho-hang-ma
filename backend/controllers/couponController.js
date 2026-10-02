const Coupon = require('../models/Coupon');
const { logAudit } = require('../utils/auditLogger');

// @desc    Validate coupon code on checkout
// @route   POST /api/coupons/validate
// @access  Public / Authenticated
exports.validateCoupon = async (req, res) => {
  try {
    const { code } = req.body;
    const cartTotal = Number(req.body.cartTotal || req.body.orderValue || 0);
    const userId = req.user?._id;

    if (!code) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập mã giảm giá' });
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Mã giảm giá không tồn tại hoặc đã bị khóa' });
    }

    const now = new Date();
    if (coupon.startDate && now < new Date(coupon.startDate)) {
      return res.status(400).json({ success: false, message: 'Mã giảm giá chưa đến ngày kích hoạt' });
    }
    if (coupon.endDate && now > new Date(coupon.endDate)) {
      return res.status(400).json({ success: false, message: 'Mã giảm giá đã hết thời hạn áp dụng' });
    }

    if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ success: false, message: 'Mã giảm giá đã hết lượt sử dụng' });
    }

    if (coupon.minOrderValue > 0 && Number(cartTotal) < coupon.minOrderValue) {
      return res.status(400).json({
        success: false,
        message: `Đơn hàng chưa đạt giá trị tối thiểu ${coupon.minOrderValue.toLocaleString('vi-VN')} đ để dùng mã này`,
      });
    }

    // Check user per-customer usage
    if (userId && coupon.userUsageLimit > 0) {
      const userUsage = (coupon.usedByUsers || []).find(
        (u) => u.userId?.toString() === userId.toString()
      );
      if (userUsage && userUsage.count >= coupon.userUsageLimit) {
        return res.status(400).json({
          success: false,
          message: 'Bạn đã đạt giới hạn số lần sử dụng mã giảm giá này',
        });
      }
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (coupon.discountType === 'PERCENTAGE') {
      discountAmount = Math.round((Number(cartTotal) * coupon.discountValue) / 100);
      if (coupon.maxDiscount > 0 && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
    } else {
      discountAmount = coupon.discountValue;
    }

    // Cap at cart total
    if (discountAmount > Number(cartTotal)) {
      discountAmount = Number(cartTotal);
    }

    res.json({
      success: true,
      discountAmount,
      message: `Áp dụng mã giảm giá thành công! Giảm ${discountAmount.toLocaleString('vi-VN')} đ`,
      data: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount,
        finalTotal: Math.max(0, Number(cartTotal) - discountAmount),
      },
    });
  } catch (error) {
    console.error('validateCoupon error:', error);
    res.status(500).json({ success: false, message: 'Lỗi kiểm tra mã giảm giá' });
  }
};

// @desc    Admin: Get all coupons
// @route   GET /api/admin/coupons
// @access  Private (Staff/Admin)
exports.getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json({ success: true, data: coupons });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi tải danh sách mã giảm giá' });
  }
};

// @desc    Admin: Create coupon
// @route   POST /api/admin/coupons
// @access  Private (Admin)
exports.createCoupon = async (req, res) => {
  try {
    const { code, description, discountType, discountValue, minOrderValue, maxDiscount, usageLimit, userUsageLimit, startDate, endDate, isActive } = req.body;

    const existing = await Coupon.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Mã giảm giá này đã tồn tại' });
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      description,
      discountType,
      discountValue: Number(discountValue),
      minOrderValue: Number(minOrderValue) || 0,
      maxDiscount: Number(maxDiscount) || 0,
      usageLimit: Number(usageLimit) || 0,
      userUsageLimit: Number(userUsageLimit) || 1,
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: new Date(endDate),
      isActive: isActive !== undefined ? isActive : true,
    });

    await logAudit(req, {
      action: 'CREATE_COUPON',
      entity: 'COUPON',
      entityId: coupon._id,
      details: `Tạo mã giảm giá mới: ${coupon.code}`,
      metadata: coupon,
    });

    res.status(201).json({ success: true, message: 'Tạo mã giảm giá thành công', data: coupon });
  } catch (error) {
    console.error('createCoupon error:', error);
    res.status(500).json({ success: false, message: error.message || 'Lỗi tạo mã giảm giá' });
  }
};

// @desc    Admin: Update coupon
// @route   PUT /api/admin/coupons/:id
// @access  Private (Admin)
exports.updateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy mã giảm giá' });
    }

    Object.assign(coupon, req.body);
    if (req.body.code) coupon.code = req.body.code.toUpperCase();
    await coupon.save();

    await logAudit(req, {
      action: 'UPDATE_COUPON',
      entity: 'COUPON',
      entityId: coupon._id,
      details: `Cập nhật mã giảm giá: ${coupon.code}`,
      metadata: req.body,
    });

    res.json({ success: true, message: 'Cập nhật mã giảm giá thành công', data: coupon });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi cập nhật mã giảm giá' });
  }
};

// @desc    Admin: Delete coupon
// @route   DELETE /api/admin/coupons/:id
// @access  Private (Admin)
exports.deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy mã giảm giá' });
    }

    await logAudit(req, {
      action: 'DELETE_COUPON',
      entity: 'COUPON',
      entityId: coupon._id,
      details: `Xóa mã giảm giá: ${coupon.code}`,
    });

    res.json({ success: true, message: 'Xóa mã giảm giá thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi xóa mã giảm giá' });
  }
};

// @desc    Admin: Toggle active status
// @route   PATCH /api/coupons/:id/toggle
exports.toggleCouponActive = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return res.status(404).json({ success: false, message: 'Không tìm thấy coupon' });
    coupon.isActive = !coupon.isActive;
    await coupon.save();
    res.json({ success: true, data: coupon });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
