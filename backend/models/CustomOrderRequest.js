const mongoose = require('mongoose');

const imageRefSchema = new mongoose.Schema(
  {
    publicId: {
      type: String,
      default: '',
    },
    url: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      default: '',
    },
    mimeType: {
      type: String,
      default: 'image/jpeg',
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const customOrderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: false,
      default: null,
    },
    isCustomItem: {
      type: Boolean,
      default: false,
    },
    customImage: {
      type: String,
      default: '',
    },
    unit: {
      type: String,
      default: 'bộ',
    },
    productNameSnapshot: {
      type: String,
      required: true,
    },
    skuSnapshot: {
      type: String,
      default: '',
    },
    unitPriceSnapshot: {
      type: Number,
      default: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    // So sánh với mẫu gốc
    originalQuantityInTemplate: {
      type: Number,
      default: 0,
    },
    selectedFromTemplate: {
      type: Boolean,
      default: true,
    },
    addedManually: {
      type: Boolean,
      default: false,
    },
    removedFromTemplate: {
      type: Boolean,
      default: false,
    },
    note: {
      type: String,
      default: '',
    },
    referenceImages: [imageRefSchema],
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  { _id: true }
);

const customOrderRequestSchema = new mongoose.Schema(
  {
    requestCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // Cho phép khách chưa đăng nhập hoặc đã đăng nhập
    },
    contactInfo: {
      fullName: {
        type: String,
        required: [true, 'Họ tên người đặt là bắt buộc'],
        trim: true,
      },
      phone: {
        type: String,
        required: [true, 'Số điện thoại liên hệ là bắt buộc'],
        trim: true,
      },
      email: {
        type: String,
        trim: true,
        default: '',
      },
      eventDate: {
        type: String,
        default: '', // Ngày lễ / ngày cần hàng
      },
      altarAddress: {
        type: String,
        default: '', // Địa chỉ gia thất / bản đền / bản phủ
      },
      specialInstructions: {
        type: String,
        default: '',
      },
    },
    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProductTemplate',
      default: null,
    },
    templateSnapshot: {
      templateName: { type: String, default: '' },
      templateSlug: { type: String, default: '' },
      basePrice: { type: Number, default: 0 },
      priceType: { type: String, default: 'CONTACT_FOR_QUOTE' },
      itemsSnapshot: [
        {
          productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
          productName: String,
          defaultQuantity: Number,
          required: Boolean,
        },
      ],
    },
    items: [customOrderItemSchema],
    globalReferenceImages: [imageRefSchema],
    generalNotes: {
      type: String,
      default: '',
    },
    budgetExpectation: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: [
        'DRAFT',
        'SUBMITTED',
        'UNDER_REVIEW',
        'QUOTED',
        'CUSTOMER_ACCEPTED',
        'CUSTOMER_REJECTED',
        'IN_PRODUCTION',
        'COMPLETED',
        'CANCELLED',
      ],
      default: 'SUBMITTED',
    },
    adminQuote: {
      itemsTotal: { type: Number, default: 0 },
      craftFee: { type: Number, default: 0 },
      shippingFee: { type: Number, default: 0 },
      discount: { type: Number, default: 0 },
      finalQuote: { type: Number, default: 0 },
      validUntil: { type: Date },
      internalNote: { type: String, default: '' },
      customerNote: { type: String, default: '' },
      quotedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      quotedAt: { type: Date },
    },
    commercialOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
    },
    assignedStaff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    statusHistory: [
      {
        status: { type: String, required: true },
        note: { type: String, default: '' },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        changedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Tạo mã yêu cầu tự động YC-YYYYMMDD-XXXX
customOrderRequestSchema.statics.generateRequestCode = async function () {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `YC-${dateStr}-${randomSuffix}`;
};

// Indexes tối ưu tra cứu & quản lý yêu cầu đặt hàng riêng
customOrderRequestSchema.index({ customerId: 1, createdAt: -1 });
customOrderRequestSchema.index({ status: 1, createdAt: -1 });
customOrderRequestSchema.index({ customerPhone: 1, createdAt: -1 });
customOrderRequestSchema.index({ createdAt: -1 });

module.exports = mongoose.model('CustomOrderRequest', customOrderRequestSchema);
