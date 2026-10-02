const Review = require('../models/Review');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { logAudit } = require('../utils/auditLogger');

// @desc    Public: Get reviews for a product
// @route   GET /api/reviews/product/:productId
// @access  Public
exports.getProductReviews = async (req, res) => {
  try {
    const reviews = await Review.find({
      productId: req.params.productId,
      status: 'APPROVED',
    }).sort({ createdAt: -1 });

    const total = reviews.length;
    const avgRating = total > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / total).toFixed(1) : 5.0;

    res.json({
      success: true,
      data: {
        reviews,
        stats: {
          total,
          avgRating: Number(avgRating),
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi tải đánh giá sản phẩm' });
  }
};

// @desc    Public/Customer: Submit a review
// @route   POST /api/reviews
// @access  Public / Optional Auth
exports.submitReview = async (req, res) => {
  try {
    const { productId, rating, comment, userName, userEmail, images = [] } = req.body;
    const userId = req.user?._id;

    if (!productId || !rating || !comment || !userName) {
      return res.status(400).json({ success: false, message: 'Vui lòng điền đủ họ tên, điểm số và nhận xét' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
    }

    // Check verified purchase
    let isVerifiedPurchase = false;
    if (userId || userEmail) {
      const purchaseMatch = {
        'items.productId': productId,
        orderStatus: { $in: ['DELIVERED', 'COMPLETED', 'CONFIRMED'] },
      };
      if (userId) purchaseMatch.customerId = userId;
      else if (userEmail) purchaseMatch['shippingAddress.phone'] = { $exists: true };

      const orderFound = await Order.findOne(purchaseMatch);
      if (orderFound) isVerifiedPurchase = true;
    }

    const review = await Review.create({
      productId,
      productNameSnapshot: product.name,
      userId: userId || null,
      userName,
      userEmail: userEmail || req.user?.email || '',
      rating: Number(rating),
      comment,
      images,
      isVerifiedPurchase,
      status: 'APPROVED', // Default approve or pending based on system
    });

    res.status(201).json({
      success: true,
      message: 'Cảm ơn quý khách đã gửi đánh giá linh phẩm!',
      data: review,
    });
  } catch (error) {
    console.error('submitReview error:', error);
    res.status(500).json({ success: false, message: 'Lỗi gửi đánh giá' });
  }
};

// @desc    Admin: Get all reviews with status filter
// @route   GET /api/admin/reviews
// @access  Private (Staff/Admin)
exports.getAllReviews = async (req, res) => {
  try {
    const { status, rating, search, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status && status !== 'ALL') query.status = status;
    if (rating && rating !== 'ALL') query.rating = Number(rating);
    if (search) {
      query.$or = [
        { userName: { $regex: search, $options: 'i' } },
        { comment: { $regex: search, $options: 'i' } },
        { productNameSnapshot: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Review.countDocuments(query);
    const reviews = await Review.find(query)
      .populate('productId', 'name thumbnail price')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.json({
      success: true,
      total,
      data: reviews,
      reviews,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi tải danh sách đánh giá' });
  }
};

// @desc    Admin: Update review status (approve, hide, reply)
// @route   PUT /api/admin/reviews/:id
// @access  Private (Staff/Admin)
exports.updateReviewStatus = async (req, res) => {
  try {
    const { status, adminReply } = req.body;
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đánh giá' });
    }

    if (status) review.status = status;
    if (adminReply !== undefined) {
      review.adminReply = adminReply;
      review.adminRepliedAt = new Date();
    }
    await review.save();

    await logAudit(req, {
      action: 'UPDATE_REVIEW',
      entity: 'REVIEW',
      entityId: review._id,
      details: `Cập nhật trạng thái đánh giá thành: ${review.status}`,
    });

    res.json({ success: true, message: 'Cập nhật đánh giá thành công', data: review });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi cập nhật đánh giá' });
  }
};

// @desc    Admin: Delete review
// @route   DELETE /api/admin/reviews/:id
// @access  Private (Admin)
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đánh giá' });
    }

    await logAudit(req, {
      action: 'DELETE_REVIEW',
      entity: 'REVIEW',
      entityId: review._id,
      details: `Xóa vĩnh viễn đánh giá của ${review.userName}`,
    });

    res.json({ success: true, message: 'Xóa đánh giá thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi xóa đánh giá' });
  }
};
