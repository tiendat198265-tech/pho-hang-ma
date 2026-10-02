const AuditLog = require('../models/AuditLog');

// @desc    Admin: Get audit logs with filter & pagination
// @route   GET /api/admin/audit-logs
// @access  Private (Admin / Super Admin)
exports.getAuditLogs = async (req, res) => {
  try {
    const { entity, action, search, page = 1, limit = 25 } = req.query;

    const query = {};
    if (entity && entity !== 'ALL') query.entity = entity;
    if (action && action !== 'ALL') query.action = action;
    if (search) {
      query.$or = [
        { userName: { $regex: search, $options: 'i' } },
        { details: { $regex: search, $options: 'i' } },
        { entityId: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.json({
      success: true,
      data: logs,
      logs,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('getAuditLogs error:', error);
    res.status(500).json({ success: false, message: 'Lỗi tải nhật ký hoạt động' });
  }
};
