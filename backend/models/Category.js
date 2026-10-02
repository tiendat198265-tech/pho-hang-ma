const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tên thư mục/danh mục là bắt buộc'],
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
      index: true,
    },
    description: {
      type: String,
      default: '',
    },
    icon: {
      type: String,
      default: 'folder',
    },
    image: {
      type: String,
      default: '',
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
categorySchema.index({ parent: 1, sortOrder: 1, createdAt: 1 });
categorySchema.index({ isActive: 1, sortOrder: 1 });
categorySchema.index({ slug: 1 });

module.exports = mongoose.model('Category', categorySchema);
