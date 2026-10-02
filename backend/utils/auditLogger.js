const AuditLog = require('../models/AuditLog');

/**
 * Log an administrative action to MongoDB AuditLog collection
 * @param {Object} req - Express request object (contains user, ip)
 * @param {Object} data - { action, entity, entityId, details, metadata }
 */
const logAudit = async (req, { action, entity, entityId = '', details = '', metadata = {} }) => {
  try {
    const userId = req.user?._id || null;
    const userName = req.user?.name || 'Khách vãng lai';
    const userRole = req.user?.role || 'ANONYMOUS';
    const ipAddress = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.ip || '';

    await AuditLog.create({
      userId,
      userName,
      userRole,
      action,
      entity,
      entityId: String(entityId),
      details,
      metadata,
      ipAddress,
    });
  } catch (error) {
    console.error('AuditLog logging error:', error.message);
  }
};

module.exports = { logAudit };
