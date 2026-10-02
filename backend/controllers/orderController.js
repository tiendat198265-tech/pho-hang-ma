const Order = require('../models/Order');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const InventoryLog = require('../models/InventoryLog');
const Notification = require('../models/Notification');
const { logAudit } = require('../utils/auditLogger');

// @desc    Customer/Public: Create order with server-side price & coupon validation
exports.createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod, orderNotes, couponCode } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ success: false, message: 'Giỏ hàng đang trống' });
    }

    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.address) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đầy đủ thông tin giao hàng' });
    }

    // 1. Batch lookup products to eliminate N+1 queries
    const itemMap = new Map();
    const productIds = [];
    for (const item of items) {
      if (item.productId) {
        const qty = Math.max(1, Number(item.quantity) || 1);
        itemMap.set(item.productId.toString(), { ...item, quantity: qty });
        productIds.push(item.productId);
      }
    }

    const products = await Product.find({ _id: { $in: productIds } }).lean();
    if (products.length !== productIds.length) {
      return res.status(404).json({ success: false, message: 'Một số sản phẩm trong giỏ không còn tồn tại' });
    }

    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    let itemsTotal = 0;
    const orderItems = [];

    // Verify stock & calculate server-side subtotal
    for (const [pId, item] of itemMap.entries()) {
      const product = productMap.get(pId);
      if (!product) {
        return res.status(404).json({ success: false, message: `Không tìm thấy sản phẩm ${pId}` });
      }

      const realPrice = product.price;
      const subtotal = realPrice * item.quantity;
      itemsTotal += subtotal;

      orderItems.push({
        productId: product._id,
        productName: product.name,
        price: realPrice,
        quantity: item.quantity,
        note: item.note || '',
      });
    }

    // Validate Coupon if provided
    let discount = 0;
    let appliedCoupon = null;
    if (couponCode) {
      appliedCoupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
      if (appliedCoupon) {
        const now = new Date();
        const validDates = (!appliedCoupon.startDate || now >= new Date(appliedCoupon.startDate)) &&
                           (!appliedCoupon.endDate || now <= new Date(appliedCoupon.endDate));
        const validUsage = appliedCoupon.usageLimit === 0 || appliedCoupon.usedCount < appliedCoupon.usageLimit;
        const validMin = appliedCoupon.minOrderValue === 0 || itemsTotal >= appliedCoupon.minOrderValue;

        if (validDates && validUsage && validMin) {
          if (appliedCoupon.discountType === 'PERCENTAGE') {
            discount = Math.round((itemsTotal * appliedCoupon.discountValue) / 100);
            if (appliedCoupon.maxDiscount > 0 && discount > appliedCoupon.maxDiscount) {
              discount = appliedCoupon.maxDiscount;
            }
          } else {
            discount = appliedCoupon.discountValue;
          }
          if (discount > itemsTotal) discount = itemsTotal;

          // Increment usage
          appliedCoupon.usedCount += 1;
          if (req.user?._id) {
            const userIdx = (appliedCoupon.usedByUsers || []).findIndex(
              (u) => u.userId?.toString() === req.user._id.toString()
            );
            if (userIdx >= 0) {
              appliedCoupon.usedByUsers[userIdx].count += 1;
            } else {
              appliedCoupon.usedByUsers.push({ userId: req.user._id, count: 1 });
            }
          }
          await appliedCoupon.save();
        }
      }
    }

    const shippingFee = itemsTotal >= 2000000 ? 0 : 50000;
    const totalAmount = Math.max(0, itemsTotal + shippingFee - discount);
    const orderCode = await Order.generateOrderCode();

    // 2. Cập nhật tồn kho & ghi nhận xuất kho / nhận chế tác theo đơn
    const inventoryLogs = [];
    for (const item of orderItems) {
      const origProd = productMap.get(item.productId.toString());
      const currentStock = origProd?.stockQuantity || 0;
      const deductQty = Math.min(currentStock, item.quantity);

      const updatedProduct = await Product.findByIdAndUpdate(
        item.productId,
        {
          $inc: { stockQuantity: -deductQty, soldCount: item.quantity },
        },
        { new: true }
      );

      inventoryLogs.push({
        productId: item.productId,
        productNameSnapshot: item.productName,
        skuSnapshot: updatedProduct?.sku || '',
        changeType: 'OUT',
        quantity: item.quantity,
        previousStock: currentStock,
        newStock: Math.max(0, currentStock - deductQty),
        reason: `Xuất kho / Chế tác thủ công theo đơn hàng ${orderCode}`,
        referenceCode: orderCode,
        createdBy: req.user?._id || null,
        createdByName: req.user?.name || shippingAddress.fullName,
      });
    }

    // 3. Batch insert InventoryLogs
    if (inventoryLogs.length > 0) {
      await InventoryLog.insertMany(inventoryLogs);
    }

    // 4. Create Order
    const order = await Order.create({
      orderCode,
      customerId: req.user ? req.user._id : null,
      items: orderItems,
      itemsTotal,
      shippingFee,
      discount,
      couponCode: appliedCoupon ? appliedCoupon.code : '',
      totalAmount,
      shippingAddress,
      paymentMethod: paymentMethod || 'COD',
      paymentStatus: 'PENDING',
      orderStatus: 'PENDING',
      orderNotes: orderNotes || '',
      timeline: [
        {
          status: 'PENDING',
          changedAt: new Date(),
          changedBy: req.user?.name || shippingAddress.fullName || 'Khách đặt hàng',
          note: 'Đơn hàng mới được tiếp nhận vào hệ thống',
        },
      ],
    });

    // 5. Trigger notification
    try {
      await Notification.create({
        recipient: req.user?._id || null,
        title: `Đơn hàng mới #${order.orderCode}`,
        message: `Đơn hàng trị giá ${order.totalAmount.toLocaleString('vi-VN')} đ đã được tiếp nhận thành công. Xưởng đang chuẩn bị đồ lễ.`,
        type: 'order',
        link: `/don-hang/${order.orderCode}`,
        isGlobal: !req.user?._id,
        metadata: { orderCode: order.orderCode },
      });
    } catch (notifErr) {
      console.error('Lỗi tạo notification đơn hàng:', notifErr);
    }

    res.status(201).json({
      success: true,
      message: 'Đặt đơn hàng thành công',
      data: order,
    });
  } catch (error) {
    console.error('createOrder error:', error);
    res.status(500).json({ success: false, message: error.message || 'Lỗi đặt đơn hàng' });
  }
};

// @desc    Customer: Get my orders
exports.getMyOrders = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(Math.max(1, Number(req.query.limit) || 20), 100);

    const [total, orders] = await Promise.all([
      Order.countDocuments({ customerId: req.user._id }),
      Order.find({ customerId: req.user._id })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    orders.forEach((o) => {
      if (req.user?.name && o.shippingAddress) {
        o.shippingAddress.fullName = req.user.name;
      }
    });

    res.json({
      success: true,
      count: orders.length,
      data: orders,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Customer/Public: Track order by code
exports.getOrderByCode = async (req, res) => {
  try {
    const order = await Order.findOne({ orderCode: req.params.code })
      .populate('customerId', 'name email phone nameHistory')
      .populate('items.productId')
      .lean();
    if (!order) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });

    // Bảo mật: Ngăn chặn Guest hoặc người dùng khác xem đơn hàng của tài khoản khác
    if (order.customerId) {
      const orderOwnerId = (order.customerId._id || order.customerId).toString();
      const isStaffOrAdmin = req.user && ['STAFF', 'ADMIN', 'SUPER_ADMIN'].includes(req.user.role);
      const isOwner = req.user && req.user._id.toString() === orderOwnerId;
      if (!isStaffOrAdmin && !isOwner) {
        return res.status(403).json({ success: false, message: 'Bạn không có quyền xem đơn hàng này' });
      }
    }

    if (order.customerId?.name && order.shippingAddress) {
      order.shippingAddress.fullName = order.customerId.name;
    }
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin: Get all orders with status/search/date filter and pagination
exports.getAdminOrders = async (req, res) => {
  try {
    const { status, paymentStatus, search, page = 1, limit = 20 } = req.query;
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(Math.max(1, Number(limit) || 20), 100);
    const query = {};

    if (status && status !== 'ALL') query.orderStatus = status;
    if (paymentStatus && paymentStatus !== 'ALL') query.paymentStatus = paymentStatus;

    if (search) {
      const cleanSearch = String(search).trim();
      query.$or = [
        { orderCode: { $regex: cleanSearch, $options: 'i' } },
        { 'shippingAddress.fullName': { $regex: cleanSearch, $options: 'i' } },
        { 'shippingAddress.phone': { $regex: cleanSearch, $options: 'i' } },
      ];
    }

    // Parallelize count and query with lean projection
    const [total, orders] = await Promise.all([
      Order.countDocuments(query),
      Order.find(query)
        .populate('customerId', 'name email phone nameHistory')
        .sort({ createdAt: -1 })
        .skip((safePage - 1) * safeLimit)
        .limit(safeLimit)
        .lean(),
    ]);

    // Ensure recipient name and timeline reflect the customer's current updated name
    orders.forEach((o) => {
      if (o.customerId && o.customerId.name) {
        if (o.shippingAddress) {
          o.shippingAddress.fullName = o.customerId.name;
        }
        if (o.timeline && Array.isArray(o.timeline)) {
          const oldNames = (o.customerId.nameHistory || []).map((h) => h.oldName).filter(Boolean);
          o.timeline.forEach((step) => {
            if (oldNames.includes(step.changedBy)) {
              step.changedBy = o.customerId.name;
            }
          });
        }
      }
    });

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          total,
          page: safePage,
          pages: Math.ceil(total / safeLimit),
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin: Update order status & append timeline
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus, paymentStatus, note = '', cancelReason = '' } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });

    const previousStatus = order.orderStatus;
    const previousPayment = order.paymentStatus;

    if (orderStatus && orderStatus !== previousStatus) {
      order.orderStatus = orderStatus;
      if (orderStatus === 'CANCELLED' && cancelReason) {
        order.cancelReason = cancelReason;
      }

      order.timeline.push({
        status: orderStatus,
        changedAt: new Date(),
        changedBy: req.user?.name || 'Quản trị viên',
        note: note || `Chuyển trạng thái từ ${previousStatus} sang ${orderStatus}`,
      });

      // If CANCELLED, restore stock safely
      if (orderStatus === 'CANCELLED' && previousStatus !== 'CANCELLED') {
        const rollbackLogs = [];
        for (const it of order.items || []) {
          const updatedProd = await Product.findByIdAndUpdate(
            it.productId,
            {
              $inc: { stockQuantity: it.quantity, soldCount: -it.quantity },
              $set: { inStock: true },
            },
            { new: true }
          );

          if (updatedProd) {
            rollbackLogs.push({
              productId: updatedProd._id,
              productNameSnapshot: updatedProd.name,
              skuSnapshot: updatedProd.sku || '',
              changeType: 'IN',
              quantity: it.quantity,
              previousStock: updatedProd.stockQuantity - it.quantity,
              newStock: updatedProd.stockQuantity,
              reason: `Hoàn kho do hủy đơn hàng ${order.orderCode}: ${cancelReason || note}`,
              referenceCode: order.orderCode,
              createdBy: req.user?._id || null,
              createdByName: req.user?.name || 'Quản trị viên',
            });
          }
        }

        if (rollbackLogs.length > 0) {
          await InventoryLog.insertMany(rollbackLogs);
        }
      }
    }

    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
    }

    await order.save();

    await logAudit(req, {
      action: 'UPDATE_ORDER_STATUS',
      entity: 'ORDER',
      entityId: order._id,
      details: `Cập nhật đơn ${order.orderCode}: Trạng thái [${previousStatus} -> ${order.orderStatus}], Thanh toán [${previousPayment} -> ${order.paymentStatus}]`,
      metadata: { previousStatus, newStatus: order.orderStatus, note },
    });

    res.json({
      success: true,
      message: 'Cập nhật trạng thái đơn hàng thành công',
      data: order,
    });
  } catch (error) {
    console.error('updateOrderStatus error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
