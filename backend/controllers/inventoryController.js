const Product = require('../models/Product');
const InventoryLog = require('../models/InventoryLog');
const { logAudit } = require('../utils/auditLogger');

// @desc    Get inventory summary & products stock
// @route   GET /api/admin/inventory
// @access  Private (Staff/Admin)
exports.getInventorySummary = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 20 } = req.query;

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
      ];
    }
    if (status === 'OUT_OF_STOCK') {
      query.stockQuantity = { $lte: 0 };
    } else if (status === 'LOW_STOCK') {
      query.stockQuantity = { $gt: 0, $lte: 10 };
    } else if (status === 'IN_STOCK') {
      query.stockQuantity = { $gt: 10 };
    }

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate('category', 'name')
      .sort({ stockQuantity: 1 }) // Low stock first
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    // Stats
    const totalProducts = await Product.countDocuments();
    const lowStockCount = await Product.countDocuments({ stockQuantity: { $gt: 0, $lte: 10 } });
    const outOfStockCount = await Product.countDocuments({ stockQuantity: { $lte: 0 } });
    const totalInventoryItems = (await Product.aggregate([
      { $group: { _id: null, total: { $sum: '$stockQuantity' } } },
    ]))[0]?.total || 0;

    res.json({
      success: true,
      data: products,
      products,
      stats: {
        totalProducts,
        lowStockCount,
        outOfStockCount,
        totalInventoryItems,
      },
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('getInventorySummary error:', error);
    res.status(500).json({ success: false, message: 'Lỗi tải danh mục kho' });
  }
};

// @desc    Adjust or In/Out inventory stock with log
// @route   POST /api/admin/inventory/adjust
// @access  Private (Staff/Admin)
exports.adjustInventory = async (req, res) => {
  try {
    const { productId, changeType, quantity, reason, note = '', referenceCode = '' } = req.body;

    if (!productId || !changeType || quantity === undefined) {
      return res.status(400).json({ success: false, message: 'Vui lòng điền đủ thông tin kho' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
    }

    const previousStock = product.stockQuantity || 0;
    const qtyNum = Math.abs(Number(quantity));
    let newStock = previousStock;

    if (changeType === 'IN') {
      newStock = previousStock + qtyNum;
    } else if (changeType === 'OUT') {
      if (previousStock < qtyNum) {
        return res.status(400).json({
          success: false,
          message: `Số lượng xuất (${qtyNum}) vượt quá tồn kho hiện tại (${previousStock})`,
        });
      }
      newStock = previousStock - qtyNum;
    } else if (changeType === 'ADJUST') {
      newStock = Number(quantity); // Direct set
    } else {
      return res.status(400).json({ success: false, message: 'Loại điều chỉnh không hợp lệ' });
    }

    product.stockQuantity = newStock;
    product.inStock = newStock > 0;
    await product.save();

    // Create InventoryLog
    const log = await InventoryLog.create({
      productId: product._id,
      productNameSnapshot: product.name,
      skuSnapshot: product.sku || '',
      changeType,
      quantity: changeType === 'ADJUST' ? Math.abs(newStock - previousStock) : qtyNum,
      previousStock,
      newStock,
      reason: reason || (changeType === 'IN' ? 'Nhập thêm kho' : changeType === 'OUT' ? 'Xuất kho sử dụng' : 'Kiểm kê kho'),
      referenceCode,
      createdBy: req.user?._id || null,
      createdByName: req.user?.name || 'Nhân viên xưởng',
    });

    await logAudit(req, {
      action: `INVENTORY_${changeType}`,
      entity: 'INVENTORY',
      entityId: product._id,
      details: `${changeType === 'IN' ? 'Nhập kho' : changeType === 'OUT' ? 'Xuất kho' : 'Điều chỉnh kho'} sản phẩm "${product.name}": ${previousStock} -> ${newStock}`,
      metadata: { previousStock, newStock, reason },
    });

    res.json({
      success: true,
      message: 'Điều chỉnh tồn kho thành công',
      data: {
        product,
        log,
      },
    });
  } catch (error) {
    console.error('adjustInventory error:', error);
    res.status(500).json({ success: false, message: 'Lỗi thực hiện điều chỉnh kho' });
  }
};

// @desc    Get inventory logs history
// @route   GET /api/admin/inventory/logs
// @access  Private (Staff/Admin)
exports.getInventoryLogs = async (req, res) => {
  try {
    const { productId, changeType, page = 1, limit = 20 } = req.query;

    const query = {};
    if (productId) query.productId = productId;
    if (changeType && changeType !== 'ALL') query.changeType = changeType;

    const total = await InventoryLog.countDocuments(query);
    const logs = await InventoryLog.find(query)
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
    console.error('getInventoryLogs error:', error);
    res.status(500).json({ success: false, message: 'Lỗi tải lịch sử kho' });
  }
};
