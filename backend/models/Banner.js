const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Tiêu đề banner là bắt buộc'],
      trim: true,
    },
    subtitle: {
      type: String,
      trim: true,
      default: '',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    imageUrl: {
      type: String,
      required: [true, 'Hình ảnh banner là bắt buộc'],
      trim: true,
    },
    linkUrl: {
      type: String,
      trim: true,
      default: '/bo-mau',
    },
    linkText: {
      type: String,
      trim: true,
      default: 'Xem Ngay',
    },
    secondaryLinkUrl: {
      type: String,
      trim: true,
      default: '',
    },
    secondaryLinkText: {
      type: String,
      trim: true,
      default: '',
    },
    position: {
      type: String,
      enum: ['HOME_HERO', 'HOME_MIDDLE', 'TOP_BAR', 'CATEGORY_TOP'],
      default: 'HOME_HERO',
      index: true,
    },
    badge: {
      type: String,
      trim: true,
      default: 'DI SẢN THỦ CÔNG THĂNG LONG',
    },
    cardTitle: {
      type: String,
      trim: true,
      default: '',
    },
    cardSubtitle: {
      type: String,
      trim: true,
      default: '',
    },
    cardPriceNote: {
      type: String,
      trim: true,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },
    mobileImageUrl: {
      type: String,
      trim: true,
      default: '',
    },
    overlay: {
      type: Boolean,
      default: false,
    },
    overlayOpacity: {
      type: Number,
      default: 30,
      min: 0,
      max: 100,
    },
    isPureImage: {
      type: Boolean,
      default: false,
    },
    scheduleType: {
      type: String,
      enum: ['NOW', 'FROM_DATE', 'TO_DATE', 'DATE_RANGE'],
      default: 'NOW',
    },
    aspectRatio: {
      type: Number,
      default: 2.63,
    },
    customRatioWidth: {
      type: Number,
      default: 0,
    },
    customRatioHeight: {
      type: Number,
      default: 0,
    },
    heightSize: {
      type: String,
      enum: ['STANDARD', 'LARGE', 'XLARGE', 'FULL', 'CUSTOM'],
      default: 'LARGE',
    },
    customHeight: {
      type: String,
      default: '',
    },
    zoomX: {
      type: Number,
      default: 100,
    },
    zoomY: {
      type: Number,
      default: 100,
    },
    positionX: {
      type: Number,
      default: 0,
    },
    positionY: {
      type: Number,
      default: 0,
    },
    focalPoint: {
      type: String,
      default: 'center',
    },
    fitMode: {
      type: String,
      enum: ['cover', 'contain', 'fill'],
      default: 'cover',
    },
    bgStyle: {
      type: String,
      enum: ['blur', 'black', 'dark'],
      default: 'blur',
    },
    deviceSettings: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({
        desktop: { aspectRatio: 2.63, zoomX: 100, zoomY: 100, positionX: 0, positionY: 0, focalPoint: 'center' },
        laptop: { aspectRatio: 2.4, zoomX: 100, zoomY: 100, positionX: 0, positionY: 0, focalPoint: 'center' },
        tablet: { aspectRatio: 1.8, zoomX: 100, zoomY: 100, positionX: 0, positionY: 0, focalPoint: 'center' },
        mobile: { aspectRatio: 1.2, zoomX: 100, zoomY: 100, positionX: 0, positionY: 0, focalPoint: 'center' },
      }),
    },
  },
  {
    timestamps: true,
  }
);

bannerSchema.index({ position: 1, isActive: 1, sortOrder: 1 });

module.exports = mongoose.model('Banner', bannerSchema);
