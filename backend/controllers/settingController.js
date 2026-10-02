const Setting = require('../models/Setting');
const { logAudit } = require('../utils/auditLogger');

// Default initial settings
const DEFAULT_SETTINGS = [
  {
    key: 'site_info',
    group: 'GENERAL',
    description: 'Thông tin chung website',
    value: {
      siteName: 'Phố Hàng Mã - Đồ Lễ Truyền Thống Thăng Long',
      slogan: 'Nghệ nhân Hà Nội - Xưởng thủ công truyền thống Hàng Mã',
      address: 'Số 48 Phố Hàng Mã, Hoàn Kiếm, Hà Nội',
      workshopAddress: 'Khu xưởng thủ công mỹ nghệ Hàng Mã, Hoàn Kiếm, Hà Nội',
      hotline: '0396.163.773',
      zalo: '0396.163.773',
      email: 'lienhe@phohangma.vn',
      facebook: 'https://facebook.com/phohangma.chinhgoc',
      openHours: '07:30 - 21:30 hàng ngày (Cả ngày rằm, mùng một và lễ tết)',
    },
  },
  {
    key: 'bank_transfer_info',
    group: 'PAYMENT',
    description: 'Thông tin chuyển khoản ngân hàng VietQR',
    value: {
      bankName: 'MB Bank (Ngân hàng Quân Đội)',
      accountNumber: '98866889988',
      accountHolder: 'BUI DUC THANG - PHO HANG MA',
      branch: 'Chi nhánh Hoàn Kiếm - Hà Nội',
      qrTemplate: 'compact2',
    },
  },
  {
    key: 'shipping_policy',
    group: 'SHIPPING',
    description: 'Chính sách vận chuyển xe mui kín chuyên dụng',
    value: {
      deliveryNotice: 'Toàn bộ đồ mã đàn tràng được bọc nilon 3 lớp & vận chuyển bằng xe mui kín chuyên dụng, chống mưa gió và bảo quản nguyên vẹn linh khí đồ lễ.',
      innerCityFee: 150000,
      outerCityFee: 350000,
    },
  },
  {
    key: 'logo_url',
    group: 'GENERAL',
    description: 'Logo chính thức của website',
    value: '/logo.png',
  },
];

// @desc    Public: Get public website settings
// @route   GET /api/settings and GET /api/settings/public
// @access  Public
exports.getPublicSettings = async (req, res) => {
  try {
    let settings = await Setting.find();
    if (settings.length === 0) {
      // Seed default
      settings = await Setting.insertMany(DEFAULT_SETTINGS);
    }

    const settingsMap = {};
    settings.forEach((s) => {
      settingsMap[s.key] = s.value;
      if (typeof s.value === 'object' && s.value !== null) {
        if (s.value.siteName && !settingsMap.store_name) settingsMap.store_name = s.value.siteName;
        if (s.value.hotline && !settingsMap.hotline) settingsMap.hotline = s.value.hotline;
        if (s.value.email && !settingsMap.email) settingsMap.email = s.value.email;
        if (s.value.address && !settingsMap.address) settingsMap.address = s.value.address;
        if (s.value.latitude && !settingsMap.latitude) settingsMap.latitude = s.value.latitude;
        if (s.value.longitude && !settingsMap.longitude) settingsMap.longitude = s.value.longitude;
        if (s.value.openHours && !settingsMap.opening_hours) settingsMap.opening_hours = s.value.openHours;
        if (s.value.bankName && !settingsMap.bank_name) settingsMap.bank_name = s.value.bankName;
        if (s.value.accountNumber && !settingsMap.bank_account) settingsMap.bank_account = s.value.accountNumber;
        if (s.value.accountHolder && !settingsMap.bank_owner) settingsMap.bank_owner = s.value.accountHolder;
        if (s.value.deliveryNotice && !settingsMap.shipping_policy) settingsMap.shipping_policy = s.value.deliveryNotice;
      }
    });

    if (!settingsMap.logo_type) settingsMap.logo_type = 'TEXT';
    if (!settingsMap.logo_text) settingsMap.logo_text = 'TUYẾT MÃ';
    if (!settingsMap.logo_tagline) settingsMap.logo_tagline = 'LÀNG NGHỀ THƯỜNG TÍN';
    if (!settingsMap.logo_url) settingsMap.logo_url = '/logo.png';
    if (!settingsMap.hotline) settingsMap.hotline = '0396.163.773';

    res.json({ success: true, data: settingsMap });
  } catch (error) {
    console.error('getPublicSettings error:', error);
    res.status(500).json({ success: false, message: 'Lỗi tải cấu hình website' });
  }
};

// @desc    Admin: Get all settings with groups
// @route   GET /api/admin/settings
// @access  Private (Staff/Admin)
exports.getAllSettings = async (req, res) => {
  try {
    let settings = await Setting.find();
    if (settings.length === 0) {
      settings = await Setting.insertMany(DEFAULT_SETTINGS);
    }
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi tải cấu hình hệ thống' });
  }
};

// @desc    Admin: Update setting by key
// @route   PUT /api/admin/settings/:key
// @access  Private (Admin)
exports.updateSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const { value, description, group } = req.body;

    let setting = await Setting.findOne({ key });
    if (!setting) {
      setting = new Setting({ key, value, description, group: group || 'GENERAL' });
    } else {
      setting.value = value;
      if (description) setting.description = description;
      if (group) setting.group = group;
    }

    await setting.save();

    await logAudit(req, {
      action: 'UPDATE_SETTING',
      entity: 'SETTING',
      entityId: key,
      details: `Cập nhật cấu hình website [${key}]`,
      metadata: { key, value },
    });

    res.json({ success: true, message: 'Cập nhật cấu hình thành công', data: setting });
  } catch (error) {
    console.error('updateSetting error:', error);
    res.status(500).json({ success: false, message: 'Lỗi lưu cấu hình' });
  }
};

// @desc    Admin: Batch update settings
// @route   POST or PUT /api/settings/admin/batch
// @access  Private (Admin)
exports.updateSettingsBatch = async (req, res) => {
  try {
    const settingsObj = req.body.settings || req.body;
    if (!settingsObj || typeof settingsObj !== 'object') {
      return res.status(400).json({ success: false, message: 'Dữ liệu cấu hình không hợp lệ' });
    }

    const updated = {};
    for (const [key, value] of Object.entries(settingsObj)) {
      if (key === 'settings') continue;
      let setting = await Setting.findOne({ key });
      if (!setting) {
        setting = new Setting({ key, value, group: 'GENERAL', description: `Cấu hình ${key}` });
      } else {
        setting.value = value;
      }
      await setting.save();
      updated[key] = value;
    }

    await logAudit(req, {
      action: 'BATCH_UPDATE_SETTINGS',
      entity: 'SETTING',
      entityId: 'BATCH',
      details: `Cập nhật hàng loạt ${Object.keys(updated).length} thông số cấu hình cửa hàng`,
      metadata: updated,
    });

    res.json({
      success: true,
      message: 'Cập nhật cấu hình cửa hàng thành công!',
      data: updated,
    });
  } catch (error) {
    console.error('updateSettingsBatch error:', error);
    res.status(500).json({ success: false, message: 'Lỗi cập nhật hàng loạt cấu hình' });
  }
};
