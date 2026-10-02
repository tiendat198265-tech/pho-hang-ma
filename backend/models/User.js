const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tên người dùng là bắt buộc'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email là bắt buộc'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Mật khẩu là bắt buộc'],
      minlength: 6,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    role: {
      type: String,
      enum: ['GUEST', 'CUSTOMER', 'STAFF', 'ADMIN', 'SUPER_ADMIN'],
      default: 'CUSTOMER',
    },
    permissions: [
      {
        type: String,
        trim: true,
      },
    ],
    avatar: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    nameHistory: [
      {
        oldName: { type: String, default: '' },
        newName: { type: String, default: '' },
        changedAt: { type: Date, default: Date.now },
        ipAddress: { type: String, default: '' },
      },
    ],
  },
  {
    timestamps: true,
  }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12;
  const salt = await bcrypt.genSalt(saltRounds);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Indexes tối ưu tìm kiếm và phân quyền User
userSchema.index({ role: 1, createdAt: -1 });
userSchema.index({ phone: 1 });
userSchema.index({ createdAt: -1 });

module.exports = mongoose.model('User', userSchema);
