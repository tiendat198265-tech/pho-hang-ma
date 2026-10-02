const mongoose = require('mongoose');

const inventoryLogSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    productNameSnapshot: {
      type: String,
      default: '',
    },
    skuSnapshot: {
      type: String,
      default: '',
    },
    changeType: {
      type: String,
      enum: ['IN', 'OUT', 'ADJUST'],
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    previousStock: {
      type: Number,
      required: true,
    },
    newStock: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    referenceCode: {
      type: String,
      default: '', // e.g. Order Code or Import Code
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    createdByName: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

inventoryLogSchema.index({ productId: 1, createdAt: -1 });
inventoryLogSchema.index({ changeType: 1, createdAt: -1 });
inventoryLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('InventoryLog', inventoryLogSchema);
