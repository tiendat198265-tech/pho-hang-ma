const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const CustomOrderRequest = require('../models/CustomOrderRequest');

// Helper to calculate date range based on filter
const getDateRange = (filter, customStart, customEnd) => {
  const now = new Date();
  let startDate = new Date();
  let endDate = new Date();

  switch (filter) {
    case 'today':
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    case '7days':
      startDate.setDate(now.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
      break;
    case '30days':
      startDate.setDate(now.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'this_month':
    case 'thisMonth':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      break;
    case 'this_year':
    case 'thisYear':
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      break;
    case 'custom':
      if (customStart) startDate = new Date(customStart);
      if (customEnd) {
        endDate = new Date(customEnd);
        endDate.setHours(23, 59, 59, 999);
      }
      break;
    default:
      startDate.setDate(now.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
  }

  return { startDate, endDate };
};

// @desc    Get dashboard metrics & visual chart data
// @route   GET /api/admin/dashboard/stats
// @access  Private (Staff / Admin)
exports.getDashboardStats = async (req, res) => {
  try {
    const { timeRange, period = '30days', startDate: cStart, endDate: cEnd } = req.query;
    const filter = period || timeRange || '30days';
    const { startDate, endDate } = getDateRange(filter, cStart, cEnd);

    // Filter criteria: valid orders exclude CANCELLED and REFUNDED
    const validOrdersMatch = {
      createdAt: { $gte: startDate, $lte: endDate },
      orderStatus: { $ne: 'CANCELLED' },
      paymentStatus: { $ne: 'REFUNDED' },
    };

    const periodMatch = {
      createdAt: { $gte: startDate, $lte: endDate },
    };

    // Run all aggregations in parallel without loading documents into RAM
    const [
      summaryAgg,
      newCustomersCount,
      orderStatusAgg,
      customStatusAgg,
      bestSellers,
      timelineAgg,
    ] = await Promise.all([
      // 1. Total revenue & orders count
      Order.aggregate([
        { $match: validOrdersMatch },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totalAmount' },
            totalOrders: { $sum: 1 },
          },
        },
      ]),

      // 2. New customers count
      User.countDocuments({
        role: 'CUSTOMER',
        createdAt: { $gte: startDate, $lte: endDate },
      }),

      // 3. Orders by Status
      Order.aggregate([
        { $match: periodMatch },
        { $group: { _id: '$orderStatus', count: { $sum: 1 } } },
      ]),

      // 4. Custom orders by status
      CustomOrderRequest.aggregate([
        { $match: periodMatch },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),

      // 5. Best sellers (top 5 by quantity)
      Order.aggregate([
        { $match: validOrdersMatch },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.productId',
            name: { $first: '$items.productName' },
            quantity: { $sum: '$items.quantity' },
            revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          },
        },
        { $sort: { quantity: -1 } },
        { $limit: 5 },
        {
          $project: {
            productId: '$_id',
            name: 1,
            quantity: 1,
            revenue: 1,
            _id: 0,
          },
        },
      ]),

      // 6. Revenue by Day for visual charts
      Order.aggregate([
        { $match: validOrdersMatch },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            revenue: { $sum: '$totalAmount' },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    // Parse summary
    const totalRevenue = summaryAgg.length > 0 ? summaryAgg[0].totalRevenue : 0;
    const totalOrders = summaryAgg.length > 0 ? summaryAgg[0].totalOrders : 0;
    const aov = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    // Parse order status map
    const ordersByStatus = {
      PENDING: 0,
      CONFIRMED: 0,
      PROCESSING: 0,
      SHIPPING: 0,
      DELIVERED: 0,
      CANCELLED: 0,
    };
    orderStatusAgg.forEach((s) => {
      if (ordersByStatus[s._id] !== undefined) {
        ordersByStatus[s._id] = s.count;
      }
    });

    const statusBreakdown = Object.entries(ordersByStatus).map(([status, count]) => ({
      status,
      count,
    }));

    // Parse custom order status map
    const customOrdersByStatus = {
      SUBMITTED: 0,
      QUOTED: 0,
      CUSTOMER_ACCEPTED: 0,
      IN_PRODUCTION: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    };
    customStatusAgg.forEach((c) => {
      if (customOrdersByStatus[c._id] !== undefined) {
        customOrdersByStatus[c._id] = c.count;
      }
    });

    // Populate day buckets for consistent chart timeline
    const revenueByDayMap = {};
    const cur = new Date(startDate);
    while (cur <= endDate) {
      const dateKey = cur.toISOString().slice(0, 10);
      revenueByDayMap[dateKey] = { date: dateKey, revenue: 0, orders: 0 };
      cur.setDate(cur.getDate() + 1);
    }
    timelineAgg.forEach((t) => {
      if (revenueByDayMap[t._id]) {
        revenueByDayMap[t._id].revenue = t.revenue;
        revenueByDayMap[t._id].orders = t.orders;
      }
    });

    const revenueTimeline = Object.values(revenueByDayMap).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    res.json({
      success: true,
      data: {
        filter: timeRange,
        dateRange: { startDate, endDate },
        summary: {
          totalRevenue,
          totalOrders,
          averageOrderValue: aov,
          newCustomers: newCustomersCount,
        },
        totalRevenue,
        totalOrders,
        aov,
        newCustomersCount,
        ordersByStatus,
        statusBreakdown,
        customOrdersByStatus,
        bestSellers,
        topSellingProducts: bestSellers,
        revenueTimeline: revenueTimeline.map((item) => ({
          ...item,
          period: item.date,
        })),
      },
    });
  } catch (error) {
    console.error('getDashboardStats error:', error);
    res.status(500).json({ success: false, message: 'Lỗi tải dữ liệu bảng tổng quan' });
  }
};
