const Banner = require('../models/Banner');

// Lấy danh sách banner đang hoạt động cho trang khách
exports.getBanners = async (req, res) => {
  try {
    const { position = 'HOME_HERO' } = req.query;
    const now = new Date();

    const query = {
      isActive: true,
      position,
      $and: [
        { $or: [{ startDate: null }, { startDate: { $lte: now } }] },
        { $or: [{ endDate: null }, { endDate: { $gte: now } }] },
      ],
    };

    const banners = await Banner.find(query).sort({ sortOrder: 1, createdAt: -1 });

    res.json({
      success: true,
      count: banners.length,
      data: banners,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Lấy toàn bộ danh sách banner (kể cả đang ẩn)
exports.getAdminBanners = async (req, res) => {
  try {
    const { search, position } = req.query;
    const query = {};

    if (position && position !== 'ALL') {
      query.position = position;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { subtitle: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const banners = await Banner.find(query).sort({ sortOrder: 1, createdAt: -1 });

    res.json({
      success: true,
      count: banners.length,
      data: banners,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Lấy chi tiết banner
exports.getBannerById = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy banner' });
    }
    res.json({ success: true, data: banner });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Tạo banner mới
exports.createBanner = async (req, res) => {
  try {
    const {
      title,
      subtitle,
      description,
      imageUrl,
      linkUrl,
      linkText,
      secondaryLinkUrl,
      secondaryLinkText,
      position,
      badge,
      cardTitle,
      cardSubtitle,
      cardPriceNote,
      isActive,
      sortOrder,
      startDate,
      endDate,
    } = req.body;

    const banner = await Banner.create({
      title,
      subtitle,
      description,
      imageUrl,
      linkUrl: linkUrl || '/bo-mau',
      linkText: linkText || 'Xem Ngay',
      secondaryLinkUrl,
      secondaryLinkText,
      position: position || 'HOME_HERO',
      badge: badge || 'DI SẢN THỦ CÔNG THĂNG LONG',
      cardTitle,
      cardSubtitle,
      cardPriceNote,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      sortOrder: Number(sortOrder) || 0,
      startDate: startDate || null,
      endDate: endDate || null,
      mobileImageUrl: req.body.mobileImageUrl || '',
      overlay: req.body.overlay !== undefined ? Boolean(req.body.overlay) : false,
      overlayOpacity: req.body.overlayOpacity !== undefined ? Number(req.body.overlayOpacity) : 30,
      isPureImage: req.body.isPureImage !== undefined ? Boolean(req.body.isPureImage) : false,
      scheduleType: req.body.scheduleType || 'NOW',
      aspectRatio: req.body.aspectRatio !== undefined ? Number(req.body.aspectRatio) : 2.63,
      customRatioWidth: req.body.customRatioWidth ? Number(req.body.customRatioWidth) : 0,
      customRatioHeight: req.body.customRatioHeight ? Number(req.body.customRatioHeight) : 0,
      heightSize: req.body.heightSize || 'LARGE',
      customHeight: req.body.customHeight || '',
      zoomX: req.body.zoomX !== undefined ? Number(req.body.zoomX) : 100,
      zoomY: req.body.zoomY !== undefined ? Number(req.body.zoomY) : 100,
      positionX: req.body.positionX !== undefined ? Number(req.body.positionX) : 0,
      positionY: req.body.positionY !== undefined ? Number(req.body.positionY) : 0,
      focalPoint: req.body.focalPoint || 'center',
      fitMode: req.body.fitMode || 'cover',
      bgStyle: req.body.bgStyle || 'blur',
      deviceSettings: req.body.deviceSettings || undefined,
    });

    res.status(201).json({
      success: true,
      message: 'Tạo banner mới thành công',
      data: banner,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Cập nhật banner
exports.updateBanner = async (req, res) => {
  try {
    const banner = await Banner.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true, runValidators: true }
    );

    if (!banner) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy banner' });
    }

    res.json({
      success: true,
      message: 'Cập nhật banner thành công',
      data: banner,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Bật/Tắt nhanh trạng thái hiển thị
exports.toggleBannerStatus = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy banner' });
    }

    banner.isActive = !banner.isActive;
    await banner.save();

    res.json({
      success: true,
      message: `Banner đã được ${banner.isActive ? 'kích hoạt hiển thị' : 'tạm ẩn'}`,
      data: banner,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Xóa banner
exports.deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findByIdAndDelete(req.params.id);
    if (!banner) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy banner' });
    }

    res.json({
      success: true,
      message: 'Đã xóa banner thành công',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Tải ảnh banner/sản phẩm từ máy tính lên máy chủ
exports.uploadBannerImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Vui lòng chọn file ảnh để tải lên' });
    }

    let fileUrl = `/uploads/${req.file.filename}`;
    const { isCloudinaryConfigured, uploadToCloudinary } = require('../config/cloudinary');

    if (isCloudinaryConfigured()) {
      try {
        const cloudResult = await uploadToCloudinary(req.file.path, 'pho-hang-ma/banners');
        fileUrl = cloudResult.secure_url;
      } catch (cErr) {
        console.warn('Cloudinary upload warning, falling back to local file:', cErr.message);
      }
    }

    res.json({
      success: true,
      message: 'Tải ảnh lên thành công',
      url: fileUrl,
      imageUrl: fileUrl,
      data: {
        url: fileUrl,
        imageUrl: fileUrl,
        filename: req.file.filename,
      },
      filename: req.file.filename,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
