const Order = require('../models/Order');

// Helper to calculate grouping and date bounds
const parseReportPeriod = (period, customStart, customEnd) => {
  const now = new Date();
  let startDate = new Date();
  let endDate = new Date();
  let groupBy = 'day';

  switch (period) {
    case 'day':
      startDate.setDate(now.getDate() - 14); // Last 14 days
      startDate.setHours(0, 0, 0, 0);
      groupBy = 'day';
      break;
    case 'week':
      startDate.setDate(now.getDate() - 70); // Last 10 weeks
      startDate.setHours(0, 0, 0, 0);
      groupBy = 'week';
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1); // Last 12 months
      groupBy = 'month';
      break;
    case 'quarter':
      startDate = new Date(now.getFullYear() - 1, 0, 1); // Last 8 quarters
      groupBy = 'quarter';
      break;
    case 'year':
      startDate = new Date(now.getFullYear() - 4, 0, 1); // Last 5 years
      groupBy = 'year';
      break;
    case 'custom':
      if (customStart) startDate = new Date(customStart);
      if (customEnd) {
        endDate = new Date(customEnd);
        endDate.setHours(23, 59, 59, 999);
      }
      groupBy = 'day';
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      groupBy = 'day';
  }

  return { startDate, endDate, groupBy };
};

// @desc    Get detailed revenue report
// @route   GET /api/admin/reports/revenue
// @access  Private (Staff/Admin)
exports.getRevenueReport = async (req, res) => {
  try {
    const { period = 'month', startDate: cStart, endDate: cEnd, orderStatus, paymentStatus } = req.query;
    const { startDate, endDate, groupBy } = parseReportPeriod(period, cStart, cEnd);

    const matchQuery = {
      createdAt: { $gte: startDate, $lte: endDate },
      orderStatus: orderStatus && orderStatus !== 'ALL' ? orderStatus : { $ne: 'CANCELLED' },
      paymentStatus: paymentStatus && paymentStatus !== 'ALL' ? paymentStatus : { $ne: 'REFUNDED' },
    };

    // Configure aggregation date grouping
    let groupDateExpr = {};
    if (groupBy === 'day') {
      groupDateExpr = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
    } else if (groupBy === 'month') {
      groupDateExpr = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
    } else if (groupBy === 'year') {
      groupDateExpr = { $dateToString: { format: '%Y', date: '$createdAt' } };
    } else if (groupBy === 'week') {
      groupDateExpr = { $dateToString: { format: '%Y-W%V', date: '$createdAt' } };
    } else {
      groupDateExpr = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
    }

    const [summaryAgg, groupedAgg, cancelledCount, detailedOrders] = await Promise.all([
      // 1. Overall Summary
      Order.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totalAmount' },
            totalOrders: { $sum: 1 },
          },
        },
      ]),

      // 2. Grouped metrics
      Order.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: groupDateExpr,
            ordersCount: { $sum: 1 },
            revenue: { $sum: '$totalAmount' },
            itemsCount: {
              $sum: {
                $reduce: {
                  input: '$items',
                  initialValue: 0,
                  in: { $add: ['$$value', { $ifNull: ['$$this.quantity', 1] }] },
                },
              },
            },
          },
        },
        { $sort: { _id: -1 } },
      ]),

      // 3. Cancelled Count
      Order.countDocuments({
        createdAt: { $gte: startDate, $lte: endDate },
        $or: [{ orderStatus: 'CANCELLED' }, { paymentStatus: 'REFUNDED' }],
      }),

      // 4. Detailed Orders (capped to 100 with projection to prevent memory leaks)
      Order.find(matchQuery)
        .select('orderCode shippingAddress totalAmount discount orderStatus paymentStatus createdAt')
        .sort({ createdAt: -1 })
        .limit(100)
        .lean(),
    ]);

    const totalRevenue = summaryAgg.length > 0 ? summaryAgg[0].totalRevenue : 0;
    const totalOrders = summaryAgg.length > 0 ? summaryAgg[0].totalOrders : 0;
    const aov = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    const reportRows = groupedAgg.map((item) => {
      const key = item._id;
      let label = key;
      if (groupBy === 'day' && key) {
        const parts = key.split('-');
        if (parts.length === 3) label = `Ngày ${parts[2]}/${parts[1]}/${parts[0]}`;
      } else if (groupBy === 'month' && key) {
        const parts = key.split('-');
        if (parts.length === 2) label = `Tháng ${parts[1]}/${parts[0]}`;
      } else if (groupBy === 'year') {
        label = `Năm ${key}`;
      }

      return {
        periodKey: key,
        periodLabel: label,
        ordersCount: item.ordersCount,
        revenue: item.revenue,
        itemsCount: item.itemsCount,
        aov: item.ordersCount > 0 ? Math.round(item.revenue / item.ordersCount) : 0,
      };
    });

    const timeline = reportRows.map((r) => ({
      period: r.periodLabel,
      periodKey: r.periodKey,
      revenue: r.revenue,
      orders: r.ordersCount,
      aov: r.aov,
    }));

    res.json({
      success: true,
      data: {
        period,
        dateRange: { startDate, endDate },
        summary: {
          totalRevenue,
          totalOrders,
          averageOrderValue: aov,
          cancelledOrders: cancelledCount,
        },
        timeline,
        reportRows,
        totalRevenue,
        totalOrders,
        aov,
        detailedOrders: detailedOrders.map((o) => ({
          _id: o._id,
          orderCode: o.orderCode,
          shippingAddress: o.shippingAddress,
          customerName: o.shippingAddress?.fullName || 'Khách vãng lai',
          customerPhone: o.shippingAddress?.phone || '',
          totalAmount: o.totalAmount,
          discount: o.discount || 0,
          orderStatus: o.orderStatus,
          paymentStatus: o.paymentStatus,
          createdAt: o.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error('getRevenueReport error:', error);
    res.status(500).json({ success: false, message: 'Lỗi tạo báo cáo doanh thu' });
  }
};
