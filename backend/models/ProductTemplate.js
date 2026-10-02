const mongoose = require('mongoose');

const templateItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: false,
      default: null,
    },
    productNameSnapshot: {
      type: String,
      default: '',
    },
    image: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
    defaultQuantity: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
    },
    required: {
      type: Boolean,
      default: false, // true -> khách không được bỏ
    },
    removable: {
      type: Boolean,
      default: true, // false -> tương đương required: true
    },
    editableQuantity: {
      type: Boolean,
      default: true, // false -> khách không được thay đổi số lượng
    },
    allowNotes: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    note: {
      type: String,
      default: '',
    },
  },
  { _id: true }
);

const productTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tên bộ mẫu là bắt buộc'],
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    subtitle: {
      type: String,
      default: '',
    },
    shortDescription: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
    ritualGuide: {
      type: String,
      default: '',
    },
    thumbnail: {
      type: String,
      default: '',
    },
    images: [
      {
        type: String,
      },
    ],
    category: {
      type: String,
      default: 'Đàn Tràng Tứ Phủ',
    },
    tags: [
      {
        type: String,
      },
    ],
    priceType: {
      type: String,
      enum: ['PRICE_FIXED', 'PRICE_CALCULATED', 'CONTACT_FOR_QUOTE'],
      default: 'CONTACT_FOR_QUOTE',
    },
    basePrice: {
      type: Number,
      default: 0,
    },
    discountPrice: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'ACTIVE', 'HIDDEN', 'ARCHIVED'],
      default: 'ACTIVE',
    },
    featured: {
      type: Boolean,
      default: false,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    items: [templateItemSchema],
  },
  {
    timestamps: true,
  }
);

// Indexes tối ưu lọc bộ mẫu
productTemplateSchema.index({ status: 1, sortOrder: 1 });
productTemplateSchema.index({ featured: 1, status: 1 });

module.exports = mongoose.model('ProductTemplate', productTemplateSchema);
