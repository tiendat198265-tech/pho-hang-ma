const mongoose = require('mongoose');

const consultationSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Vui lòng nhập họ và tên'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Vui lòng nhập số điện thoại'],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      default: '',
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    ritualType: {
      type: String,
      default: 'Chưa xác định',
      trim: true,
    },
    budget: {
      type: String,
      default: '',
      trim: true,
    },
    preferredCallTime: {
      type: String,
      default: 'Càng sớm càng tốt',
      trim: true,
    },
    note: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'CALLED', 'CONFIRMED', 'CANCELLED'],
      default: 'PENDING',
    },
    adminNote: {
      type: String,
      default: '',
      trim: true,
    },
    handledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    source: {
      type: String,
      default: 'WEBSITE_FORM',
    },
  },
  {
    timestamps: true,
  }
);

consultationSchema.index({ phone: 1 });
consultationSchema.index({ status: 1 });
consultationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Consultation', consultationSchema);
