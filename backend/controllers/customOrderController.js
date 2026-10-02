const CustomOrderRequest = require('../models/CustomOrderRequest');
const ProductTemplate = require('../models/ProductTemplate');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Notification = require('../models/Notification');

exports.createCustomOrderRequest = async (req, res) => {
  try {
    const {
      templateId,
      items,
      globalReferenceImages,
      generalNotes,
      budgetExpectation,
      contactInfo,
    } = req.body;

    if (!contactInfo || !contactInfo.fullName || !contactInfo.phone) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ họ tên và số điện thoại liên hệ',
      });
    }

    let templateSnapshot = { itemsSnapshot: [] };
    let originalTemplate = null;

    if (templateId) {
      originalTemplate = await ProductTemplate.findById(templateId).populate('items.productId');
      if (originalTemplate) {
        templateSnapshot = {
          templateName: originalTemplate.name,
          templateSlug: originalTemplate.slug,
          basePrice: originalTemplate.basePrice,
          priceType: originalTemplate.priceType,
          itemsSnapshot: originalTemplate.items.map((it) => ({
            productId: it.productId?._id || it.productId,
            productName: it.productNameSnapshot || it.productId?.name || 'Sản phẩm',
            defaultQuantity: it.defaultQuantity,
            required: it.required,
          })),
        };
      }
    }

    // Process & validate items
    const processedItems = [];
    if (items && Array.isArray(items)) {
      for (const item of items) {
        let prod = null;
        if (item.productId) {
          prod = await Product.findById(item.productId);
        }

        // Allow customer flexibility to customize or deselect any item in package
        // Changes are accurately tracked in visual diff comparison for admin quoting

        processedItems.push({
          productId: item.productId || null,
          isCustomItem: Boolean(item.isCustomItem || !item.productId),
          customImage: item.customImage || item.thumbnail || '',
          unit: item.unit || (prod ? prod.unit : 'chiếc'),
          productNameSnapshot: prod ? prod.name : item.productNameSnapshot || 'Linh phẩm lễ',
          skuSnapshot: prod ? prod.sku : '',
          unitPriceSnapshot: prod ? prod.price : item.unitPriceSnapshot || 0,
          quantity: item.quantity || 1,
          originalQuantityInTemplate: item.originalQuantityInTemplate || 0,
          selectedFromTemplate: item.selectedFromTemplate !== undefined ? item.selectedFromTemplate : true,
          addedManually: Boolean(item.addedManually),
          removedFromTemplate: Boolean(item.removedFromTemplate),
          note: item.note || '',
          referenceImages: item.referenceImages || [],
        });
      }
    }

    const requestCode = await CustomOrderRequest.generateRequestCode();

    const newRequest = await CustomOrderRequest.create({
      requestCode,
      customerId: req.user ? req.user._id : null,
      contactInfo,
      templateId: templateId || null,
      templateSnapshot,
      items: processedItems,
      globalReferenceImages: globalReferenceImages || [],
      generalNotes: generalNotes || '',
      budgetExpectation: budgetExpectation || '',
      status: 'SUBMITTED',
      statusHistory: [
        {
          status: 'SUBMITTED',
          note: 'Khách hàng gửi yêu cầu đặt mâm lễ theo mẫu',
          changedBy: req.user ? req.user._id : null,
          changedAt: new Date(),
        },
      ],
    });

    try {
      await Notification.create({
        recipient: req.user ? req.user._id : null,
        title: `Yêu cầu báo giá đàn lễ #${newRequest.requestCode}`,
        message: `Hồ sơ tùy chỉnh "${newRequest.templateSnapshot?.templateName || 'Đàn lễ'}" đã được tiếp nhận. Thợ cả sẽ liên hệ sớm.`,
        type: 'quote',
        link: `/tra-cuu-bao-gia/${newRequest.requestCode}`,
        isGlobal: !req.user,
        metadata: { requestCode: newRequest.requestCode },
      });
    } catch (notifErr) {
      console.error('Lỗi tạo notification hồ sơ đàn lễ:', notifErr);
    }

    res.status(201).json({
      success: true,
      message: 'Gửi yêu cầu đặt mâm lễ thành công! Thợ cả sẽ liên hệ và báo giá sớm nhất.',
      data: newRequest,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getRequestByCode = async (req, res) => {
  try {
    const request = await CustomOrderRequest.findOne({ requestCode: req.params.code })
      .populate('templateId')
      .populate('items.productId')
      .populate('adminQuote.quotedBy', 'name phone')
      .lean();

    if (!request) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy yêu cầu' });
    }

    res.json({ success: true, data: request });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMyRequests = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(Math.max(1, Number(req.query.limit) || 20), 100);

    const [total, requests] = await Promise.all([
      CustomOrderRequest.countDocuments({ customerId: req.user._id }),
      CustomOrderRequest.find({ customerId: req.user._id })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    res.json({
      success: true,
      count: requests.length,
      data: requests,
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

exports.getAdminRequests = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(Math.max(1, Number(limit) || 20), 100);
    const query = {};

    if (status && status !== 'ALL') query.status = status;
    if (search) {
      const cleanSearch = String(search).trim();
      query.$or = [
        { requestCode: { $regex: cleanSearch, $options: 'i' } },
        { 'contactInfo.fullName': { $regex: cleanSearch, $options: 'i' } },
        { 'contactInfo.phone': { $regex: cleanSearch, $options: 'i' } },
      ];
    }

    const skip = (safePage - 1) * safeLimit;
    const [total, requests] = await Promise.all([
      CustomOrderRequest.countDocuments(query),
      CustomOrderRequest.find(query)
        .populate('customerId', 'name email phone')
        .populate('templateId', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .lean(),
    ]);

    res.json({
      success: true,
      total,
      page: safePage,
      pages: Math.ceil(total / safeLimit),
      data: requests,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin chi tiết: Tính toán Diff giữa Mẫu Gốc và Yêu Cầu Khách (Yêu cầu XV-P)
exports.getAdminRequestDetail = async (req, res) => {
  try {
    const request = await CustomOrderRequest.findById(req.params.id)
      .populate('customerId', 'name email phone')
      .populate('templateId')
      .populate('items.productId')
      .populate('adminQuote.quotedBy', 'name');

    if (!request) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy yêu cầu' });
    }

    // Generate comparison diff
    const comparison = {
      keptItems: [],
      quantityChangedItems: [],
      removedItems: [],
      addedItems: [],
    };

    request.items.forEach((item) => {
      if (item.removedFromTemplate) {
        comparison.removedItems.push(item);
      } else if (item.addedManually) {
        comparison.addedItems.push(item);
      } else if (
        item.originalQuantityInTemplate > 0 &&
        item.quantity !== item.originalQuantityInTemplate
      ) {
        comparison.quantityChangedItems.push({
          item,
          originalQty: item.originalQuantityInTemplate,
          requestedQty: item.quantity,
          difference: item.quantity - item.originalQuantityInTemplate,
        });
      } else {
        comparison.keptItems.push(item);
      }
    });

    res.json({ success: true, data: request, comparison });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin gửi báo giá (Yêu cầu XV-Q)
exports.submitQuote = async (req, res) => {
  try {
    const { itemsTotal, craftFee, shippingFee, discount, finalQuote, validDays, internalNote, customerNote } = req.body;

    const request = await CustomOrderRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Không tìm thấy yêu cầu' });

    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + (Number(validDays) || 7));

    request.adminQuote = {
      itemsTotal: Number(itemsTotal) || 0,
      craftFee: Number(craftFee) || 0,
      shippingFee: Number(shippingFee) || 0,
      discount: Number(discount) || 0,
      finalQuote: Number(finalQuote) || 0,
      validUntil,
      internalNote: internalNote || '',
      customerNote: customerNote || '',
      quotedBy: req.user._id,
      quotedAt: new Date(),
    };

    request.status = 'QUOTED';
    request.statusHistory.push({
      status: 'QUOTED',
      note: `Thợ Cả gửi bảng báo giá: ${Number(finalQuote).toLocaleString('vi-VN')} đ`,
      changedBy: req.user._id,
      changedAt: new Date(),
    });

    await request.save();

    res.json({
      success: true,
      message: 'Đã gửi báo giá thành công tới khách hàng',
      data: request,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Khách hàng phản hồi báo giá (Xác nhận đặt / Từ chối) (Yêu cầu XV-R, XV-N)
exports.respondToQuote = async (req, res) => {
  try {
    const { action, note, paymentMethod } = req.body; // action: 'ACCEPT' or 'REJECT'
    const request = await CustomOrderRequest.findById(req.params.id);

    if (!request) return res.status(404).json({ success: false, message: 'Không tìm thấy yêu cầu' });
    if (request.status !== 'QUOTED') {
      return res.status(400).json({ success: false, message: 'Yêu cầu chưa ở trạng thái chờ duyệt báo giá' });
    }

    if (action === 'ACCEPT') {
      request.status = 'CUSTOMER_ACCEPTED';

      // Chuyển đổi thành Order thương mại chính thức (Yêu cầu XV-N)
      const orderCode = await Order.generateOrderCode();
      const activeItems = request.items
        .filter((it) => !it.removedFromTemplate)
        .map((it) => ({
          productId: it.productId || null,
          productName: it.productNameSnapshot,
          price: it.unitPriceSnapshot || 0,
          quantity: it.quantity,
          note: it.note || '',
        }));

      const newOrder = await Order.create({
        orderCode,
        customerId: request.customerId || null,
        customOrderRequestId: request._id,
        items: activeItems,
        itemsTotal: request.adminQuote.itemsTotal || 0,
        craftFee: request.adminQuote.craftFee || 0,
        shippingFee: request.adminQuote.shippingFee || 0,
        discount: request.adminQuote.discount || 0,
        totalAmount: request.adminQuote.finalQuote || 0,
        shippingAddress: {
          fullName: request.contactInfo.fullName,
          phone: request.contactInfo.phone,
          address: request.contactInfo.altarAddress || 'Nhận tại xưởng',
          city: 'Hà Nội',
          deliveryDate: request.contactInfo.eventDate || '',
          note: request.contactInfo.specialInstructions || '',
        },
        paymentMethod: paymentMethod || 'BANK_TRANSFER',
        paymentStatus: 'PENDING',
        orderStatus: 'CONFIRMED',
        orderNotes: `Đơn hàng tự động khởi tạo từ yêu cầu đặt lễ ${request.requestCode}`,
      });

      request.commercialOrderId = newOrder._id;
      request.statusHistory.push({
        status: 'CUSTOMER_ACCEPTED',
        note: `Khách hàng chấp nhận báo giá. Tạo đơn hàng thương mại ${orderCode}`,
        changedBy: req.user ? req.user._id : null,
        changedAt: new Date(),
      });

      await request.save();

      return res.json({
        success: true,
        message: `Xác nhận báo giá thành công! Đã tạo đơn hàng ${orderCode}.`,
        order: newOrder,
        data: request,
      });
    } else if (action === 'REJECT') {
      request.status = 'CUSTOMER_REJECTED';
      request.statusHistory.push({
        status: 'CUSTOMER_REJECTED',
        note: `Khách hàng từ chối báo giá: ${note || 'Không có ghi chú'}`,
        changedBy: req.user ? req.user._id : null,
        changedAt: new Date(),
      });

      await request.save();

      return res.json({
        success: true,
        message: 'Bạn đã từ chối báo giá của đơn hàng này.',
        data: request,
      });
    } else {
      return res.status(400).json({ success: false, message: 'Hành động không hợp lệ' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin thay đổi trạng thái quy trình (Yêu cầu XV-N)
exports.updateStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    const request = await CustomOrderRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Không tìm thấy yêu cầu' });

    request.status = status;
    request.statusHistory.push({
      status,
      note: note || `Cập nhật trạng thái thành ${status}`,
      changedBy: req.user._id,
      changedAt: new Date(),
    });

    await request.save();
    res.json({ success: true, message: `Đã cập nhật trạng thái: ${status}`, data: request });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Upload multiple reference images (Yêu cầu XV-J, XV-M)
exports.uploadImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'Vui lòng chọn ít nhất 1 hình ảnh' });
    }

    const host = req.get('host');
    const protocol = req.protocol;
    const { isCloudinaryConfigured, uploadToCloudinary } = require('../config/cloudinary');

    const uploadedImages = await Promise.all(
      req.files.map(async (file) => {
        let url = `${protocol}://${host}/uploads/${file.filename}`;
        let publicId = file.filename;

        if (isCloudinaryConfigured()) {
          try {
            const cloudResult = await uploadToCloudinary(file.path, 'pho-hang-ma/custom-orders');
            url = cloudResult.secure_url;
            publicId = cloudResult.public_id;
          } catch (cErr) {
            console.warn('Cloudinary upload failed for file, using local fallback:', cErr.message);
          }
        }

        return {
          publicId,
          url,
          fileName: file.originalname,
          mimeType: file.mimetype,
          fileSize: file.size,
          uploadedAt: new Date(),
        };
      })
    );

    res.json({
      success: true,
      message: `Đã tải lên ${uploadedImages.length} hình ảnh tham khảo thành công`,
      data: uploadedImages,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
