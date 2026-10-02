const Consultation = require('../models/Consultation');
const AuditLog = require('../models/AuditLog');

// 1. Tạo yêu cầu tư vấn mới (Khách hàng gửi - Công khai)
exports.createConsultation = async (req, res) => {
  try {
    const { fullName, phone, email, address, ritualType, budget, preferredCallTime, note, source } = req.body;

    if (!fullName || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ Họ tên và Số điện thoại để xưởng liên hệ',
      });
    }

    // Validate phone number format cơ bản
    const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
    const cleanPhone = phone.replace(/[\s.-]/g, '');
    if (!phoneRegex.test(cleanPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Số điện thoại không đúng định dạng. Vui lòng kiểm tra lại',
      });
    }

    const consultation = await Consultation.create({
      fullName: fullName.trim(),
      phone: cleanPhone,
      email: email ? email.trim() : '',
      address: address ? address.trim() : '',
      ritualType: ritualType || 'Chưa xác định',
      budget: budget || '',
      preferredCallTime: preferredCallTime || 'Càng sớm càng tốt',
      note: note ? note.trim() : '',
      source: source || 'WEBSITE_FORM',
      status: 'PENDING',
    });

    res.status(201).json({
      success: true,
      message: 'Đã gửi thông tin thành công! Thợ cả Phố Hàng Mã sẽ liên hệ tư vấn chu toàn cho quý khách trong thời gian sớm nhất.',
      data: consultation,
    });
  } catch (error) {
    console.error('Error creating consultation:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi gửi yêu cầu tư vấn: ' + error.message,
    });
  }
};

// 2. Lấy danh sách yêu cầu tư vấn (Admin / Staff)
exports.getConsultations = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status && status !== 'ALL') {
      query.status = status;
    }

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ fullName: searchRegex }, { phone: searchRegex }, { ritualType: searchRegex }];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const skip = (pageNum - 1) * limitNum;

    const [total, consultations] = await Promise.all([
      Consultation.countDocuments(query),
      Consultation.find(query)
        .populate('handledBy', 'name email phone role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
    ]);

    res.json({
      success: true,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
      data: consultations,
    });
  } catch (error) {
    console.error('Error fetching consultations:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể tải danh sách yêu cầu tư vấn',
    });
  }
};

// 3. Thống kê nhanh các yêu cầu tư vấn (Dùng 1 pipeline aggregate thay vì 5 count queries)
exports.getConsultationStats = async (req, res) => {
  try {
    const [statusAgg, total] = await Promise.all([
      Consultation.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Consultation.countDocuments(),
    ]);

    const stats = {
      total,
      pending: 0,
      called: 0,
      confirmed: 0,
      cancelled: 0,
    };

    statusAgg.forEach((item) => {
      if (item._id === 'PENDING') stats.pending = item.count;
      else if (item._id === 'CALLED') stats.called = item.count;
      else if (item._id === 'CONFIRMED') stats.confirmed = item.count;
      else if (item._id === 'CANCELLED') stats.cancelled = item.count;
    });

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Cập nhật trạng thái và ghi chú tư vấn (Admin / Staff)
exports.updateConsultation = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNote } = req.body;

    const consultation = await Consultation.findById(id);
    if (!consultation) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy yêu cầu tư vấn' });
    }

    if (status) consultation.status = status;
    if (adminNote !== undefined) consultation.adminNote = adminNote;

    // Ghi nhận nhân viên/admin vừa thực hiện cập nhật
    if (req.user && req.user._id) {
      consultation.handledBy = req.user._id;
    }

    await consultation.save();

    // Ghi audit log
    if (AuditLog) {
      await AuditLog.create({
        userId: req.user._id,
        action: 'UPDATE_CONSULTATION',
        details: `Cập nhật yêu cầu tư vấn của khách ${consultation.fullName} (${consultation.phone}) sang trạng thái ${consultation.status}`,
      }).catch(() => {});
    }

    const updated = await Consultation.findById(id).populate('handledBy', 'name email phone role');

    res.json({
      success: true,
      message: 'Đã cập nhật yêu cầu tư vấn thành công',
      data: updated,
    });
  } catch (error) {
    console.error('Error updating consultation:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Xóa yêu cầu tư vấn (Admin/Super Admin)
exports.deleteConsultation = async (req, res) => {
  try {
    const { id } = req.params;
    const consultation = await Consultation.findByIdAndDelete(id);
    if (!consultation) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy yêu cầu tư vấn' });
    }

    res.json({
      success: true,
      message: 'Đã xóa yêu cầu tư vấn thành công',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
