const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { optionalAuth, verifyToken, requireRole } = require('../middlewares/auth');

// Seed default system notifications if empty
const seedSampleNotificationsIfEmpty = async () => {
  try {
    const count = await Notification.countDocuments();
    if (count === 0) {
      await Notification.create([
        {
          title: 'Chào mừng Quý khách đến với Phố Hàng Mã',
          message: 'Xưởng nghệ nhân Hà Nội hân hạnh phục vụ đồ mã cổ truyền, mâm lễ Tứ Phủ trang nghiêm chuẩn nghi thức.',
          type: 'system',
          link: '/bo-mau',
          isGlobal: true,
        },
        {
          title: 'Khuyến mãi mùa Vấn Hầu & Đàn Lễ',
          message: 'Nhập mã HANGMA10 để nhận ưu đãi 10% cho đơn hàng đàn lễ trọn gói trên 2 triệu đồng.',
          type: 'promotion',
          link: '/san-pham',
          isGlobal: true,
        },
        {
          title: 'Dịch vụ vận chuyển xe mui kín chuyên dụng',
          message: 'Bảo quản đàn lễ, hình nhân nguyên vẹn tuyệt đối đến tận cửa Đền, Phủ, Điện trên toàn quốc.',
          type: 'info',
          link: '/tuy-chinh-mau/dan-tu-phu',
          isGlobal: true,
        },
      ]);
    }
  } catch (err) {
    console.error('Error seeding notifications:', err);
  }
};

// Seed on module load
seedSampleNotificationsIfEmpty();

// GET /api/notifications - Get notifications for current user or guest
router.get('/', optionalAuth, async (req, res) => {
  try {
    const userId = req.user ? req.user._id : null;

    let query = {};
    if (userId) {
      query = {
        $or: [{ recipient: userId }, { isGlobal: true }, { recipient: null }],
      };
    } else {
      query = {
        $or: [{ isGlobal: true }, { recipient: null }],
      };
    }

    const rawNotifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    const notifications = rawNotifications.map((n) => {
      let isRead = false;
      if (userId) {
        if (n.recipient && String(n.recipient) === String(userId)) {
          isRead = Boolean(n.isRead);
        } else {
          isRead = Array.isArray(n.readBy) && n.readBy.some((id) => String(id) === String(userId));
        }
      }
      return {
        ...n,
        isRead,
      };
    });

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    res.json({
      success: true,
      data: notifications,
      unreadCount,
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi tải thông báo' });
  }
});

// PUT /api/notifications/:id/read - Mark single notification as read
router.put('/:id/read', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user ? req.user._id : null;

    const notification = await Notification.findById(id);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thông báo' });
    }

    if (userId) {
      if (notification.recipient && String(notification.recipient) === String(userId)) {
        notification.isRead = true;
      } else {
        if (!notification.readBy) notification.readBy = [];
        if (!notification.readBy.some((uid) => String(uid) === String(userId))) {
          notification.readBy.push(userId);
        }
      }
      await notification.save();
    } else {
      // Guest: if not user, mark isRead if it's general
      notification.isRead = true;
      await notification.save();
    }

    res.json({ success: true, message: 'Đã đánh dấu thông báo đã đọc' });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ success: false, message: 'Lỗi cập nhật thông báo' });
  }
});

// PUT /api/notifications/read-all - Mark all as read
router.put('/read-all', optionalAuth, async (req, res) => {
  try {
    const userId = req.user ? req.user._id : null;

    if (userId) {
      // Mark direct notifications
      await Notification.updateMany({ recipient: userId, isRead: false }, { $set: { isRead: true } });

      // Mark global notifications by adding to readBy
      await Notification.updateMany(
        {
          $or: [{ isGlobal: true }, { recipient: null }],
          readBy: { $ne: userId },
        },
        {
          $addToSet: { readBy: userId },
        }
      );
    } else {
      await Notification.updateMany({ isGlobal: true }, { $set: { isRead: true } });
    }

    res.json({ success: true, message: 'Đã đánh dấu tất cả là đã đọc' });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ success: false, message: 'Lỗi cập nhật tất cả thông báo' });
  }
});

// POST /api/notifications - Create new notification (admin or internal)
router.post('/', optionalAuth, async (req, res) => {
  try {
    const { title, message, type, link, recipient, isGlobal, metadata } = req.body;

    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'Tiêu đề và nội dung là bắt buộc' });
    }

    const notification = await Notification.create({
      title,
      message,
      type: type || 'info',
      link: link || '',
      recipient: recipient || null,
      isGlobal: isGlobal ?? !recipient,
      metadata: metadata || {},
    });

    res.status(201).json({
      success: true,
      data: notification,
      message: 'Tạo thông báo thành công',
    });
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({ success: false, message: 'Lỗi tạo thông báo' });
  }
});

// DELETE /api/notifications/:id - Delete notification
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findById(id);

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thông báo' });
    }

    // Only recipient or Admin/Staff can delete
    const isOwner = notification.recipient && String(notification.recipient) === String(req.user._id);
    const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(req.user.role);

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền xóa thông báo này' });
    }

    await Notification.findByIdAndDelete(id);
    res.json({ success: true, message: 'Đã xóa thông báo' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi xóa thông báo' });
  }
});

module.exports = router;
