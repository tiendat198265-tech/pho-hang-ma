const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tên sản phẩm là bắt buộc'],
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    sku: {
      type: String,
      unique: true,
      trim: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: false,
      default: null,
    },
    categoryNameSnapshot: {
      type: String,
      default: '',
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    originalPrice: {
      type: Number,
      default: 0,
    },
    unit: {
      type: String,
      default: 'bộ',
    },
    description: {
      type: String,
      default: '',
    },
    details: {
      type: String,
      default: '',
    },
    images: [
      {
        type: String,
      },
    ],
    thumbnail: {
      type: String,
      default: '',
    },
    dimensions: {
      type: String,
      default: '',
    },
    material: {
      type: String,
      default: 'Giấy dó, giang nứa tự nhiên, phẩm điều cổ truyền',
    },
    isTraditional: {
      type: Boolean,
      default: true,
    },
    inStock: {
      type: Boolean,
      default: true,
    },
    stockQuantity: {
      type: Number,
      default: 50,
    },
    tags: [
      {
        type: String,
      },
    ],
    ritualType: {
      type: String,
      default: 'Đàn Tràng, Giỗ Chạp, Lễ Tiết',
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE',
    },
    soldCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    seo: {
      metaTitle: { type: String, default: '' },
      metaDescription: { type: String, default: '' },
      keywords: { type: String, default: '' },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes tối ưu query & filter sản phẩm
productSchema.index({ category: 1, status: 1 });
productSchema.index({ status: 1, createdAt: -1 });
productSchema.index({ status: 1, price: 1 });
productSchema.index({ status: 1, soldCount: -1 });

module.exports = mongoose.model('Product', productSchema);
