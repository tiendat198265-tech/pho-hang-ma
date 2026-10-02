const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: false,
      default: null,
    },
    productName: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    note: {
      type: String,
      default: '',
    },
  },
  { _id: true }
);

const orderSchema = new mongoose.Schema(
  {
    orderCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    customOrderRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CustomOrderRequest',
      default: null,
    },
    items: [orderItemSchema],
    itemsTotal: {
      type: Number,
      required: true,
      default: 0,
    },
    craftFee: {
      type: Number,
      default: 0,
    },
    shippingFee: {
      type: Number,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    shippingAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String, default: 'Hà Nội' },
      note: { type: String, default: '' },
      deliveryDate: { type: String, default: '' },
    },
    paymentMethod: {
      type: String,
      enum: ['COD', 'BANK_TRANSFER', 'VNPAY'],
      default: 'BANK_TRANSFER',
    },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'],
      default: 'PENDING',
    },
    orderStatus: {
      type: String,
      enum: ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPING', 'DELIVERED', 'CANCELLED'],
      default: 'PENDING',
    },
    orderNotes: {
      type: String,
      default: '',
    },
    couponCode: {
      type: String,
      default: '',
      trim: true,
    },
    cancelReason: {
      type: String,
      default: '',
      trim: true,
    },
    timeline: [
      {
        status: {
          type: String,
          required: true,
        },
        changedAt: {
          type: Date,
          default: Date.now,
        },
        changedBy: {
          type: String,
          default: 'Hệ thống',
        },
        note: {
          type: String,
          default: '',
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

orderSchema.statics.generateOrderCode = async function () {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `DH-${dateStr}-${randomSuffix}`;
};

// Indexes tối ưu truy vấn đơn hàng & báo cáo
orderSchema.index({ customerId: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1, createdAt: -1 });
orderSchema.index({ paymentStatus: 1, createdAt: -1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'shippingAddress.phone': 1 });

module.exports = mongoose.model('Order', orderSchema);
