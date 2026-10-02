import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  User,
  Package,
  ArrowRight,
  CheckCircle,
  Lock,
  Key,
  Save,
  AlertCircle,
  Eye,
  EyeOff,
  History,
  Phone,
  MapPin,
  Shield,
  Loader2,
  Mail,
  SlidersHorizontal,
  Camera,
  Upload,
  Trash2,
} from 'lucide-react';
import { getRoleText } from '../utils/statusTranslations';

export default function AccountPage() {
  const { user, token, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Avatar Upload State
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarSuccess, setAvatarSuccess] = useState('');
  const [avatarError, setAvatarError] = useState('');

  // Form Đổi Thông Tin / Đổi Tên
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    address: '',
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Form Đổi Mật Khẩu
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [changingPass, setChangingPass] = useState(false);
  const [passSuccess, setPassSuccess] = useState('');
  const [passError, setPassError] = useState('');

  useEffect(() => {
    if (!token) {
      navigate('/dang-nhap');
      return;
    }

    if (user) {
      setProfileForm({
        name: user.name || '',
        phone: user.phone || '',
        address: user.address || '',
      });
    }
  }, [token, navigate, user?.name, user?.phone, user?.address]);

  // Xử lý tải ảnh đại diện lên
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input để cho phép chọn lại cùng 1 file nếu cần
    e.target.value = '';

    if (!file.type.startsWith('image/')) {
      setAvatarError('Chỉ hỗ trợ file ảnh định dạng JPEG, PNG, WEBP, GIF, AVIF.');
      setTimeout(() => setAvatarError(''), 5000);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setAvatarError('Dung lượng ảnh tối đa là 10MB.');
      setTimeout(() => setAvatarError(''), 5000);
      return;
    }

    try {
      setUploadingAvatar(true);
      setAvatarSuccess('');
      setAvatarError('');

      const formData = new FormData();
      formData.append('avatar', file);

      const res = await fetch('/api/auth/upload-avatar', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.user) {
        updateUser(data.user);
        setAvatarSuccess('Cập nhật ảnh đại diện thành công!');
        setTimeout(() => setAvatarSuccess(''), 5000);
      } else {
        setAvatarError(data.message || 'Lỗi khi tải ảnh đại diện.');
        setTimeout(() => setAvatarError(''), 5000);
      }
    } catch (err) {
      console.error(err);
      setAvatarError('Không thể kết nối máy chủ để tải ảnh.');
      setTimeout(() => setAvatarError(''), 5000);
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Xử lý gỡ ảnh đại diện
  const handleRemoveAvatar = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn gỡ ảnh đại diện hiện tại?')) return;

    try {
      setUploadingAvatar(true);
      setAvatarSuccess('');
      setAvatarError('');

      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ avatar: '' }),
      });

      const data = await res.json();
      if (data.success && data.user) {
        updateUser(data.user);
        setAvatarSuccess('Đã gỡ ảnh đại diện thành công!');
        setTimeout(() => setAvatarSuccess(''), 5000);
      } else {
        setAvatarError(data.message || 'Lỗi khi gỡ ảnh.');
        setTimeout(() => setAvatarError(''), 5000);
      }
    } catch (err) {
      console.error(err);
      setAvatarError('Không thể kết nối máy chủ để gỡ ảnh.');
      setTimeout(() => setAvatarError(''), 5000);
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Xử lý cập nhật thông tin / đổi tên
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileSuccess('');
    setProfileError('');

    if (!profileForm.name.trim()) {
      setProfileError('Vui lòng nhập họ và tên của bạn.');
      return;
    }

    try {
      setSavingProfile(true);
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileForm),
      });

      const data = await res.json();
      if (data.success && data.user) {
        updateUser(data.user);
        setProfileSuccess(data.message || 'Cập nhật hồ sơ thành công!');
        setTimeout(() => setProfileSuccess(''), 5000);
      } else {
        setProfileError(data.message || 'Lỗi khi cập nhật thông tin.');
      }
    } catch (err) {
      console.error(err);
      setProfileError('Không thể kết nối máy chủ để lưu thông tin.');
    } finally {
      setSavingProfile(false);
    }
  };

  // Xử lý đổi mật khẩu
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPassSuccess('');
    setPassError('');

    if (!passwordForm.currentPassword) {
      setPassError('Vui lòng nhập mật khẩu hiện tại.');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPassError('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPassError('Mật khẩu xác nhận không trùng khớp.');
      return;
    }

    try {
      setChangingPass(true);
      const res = await fetch('/api/auth/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setPassSuccess('Đổi mật khẩu thành công! Hãy ghi nhớ mật khẩu mới của bạn.');
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        setTimeout(() => setPassSuccess(''), 6000);
      } else {
        setPassError(data.message || 'Lỗi khi đổi mật khẩu.');
      }
    } catch (err) {
      console.error(err);
      setPassError('Không thể kết nối máy chủ để đổi mật khẩu.');
    } finally {
      setChangingPass(false);
    }
  };

  return (
    <div className="w-full bg-[#FAF7F2] min-h-screen py-10">
      <div className="max-w-[1200px] mx-auto px-4">
        {/* Hidden File Input for Avatar */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          onChange={handleAvatarChange}
          className="hidden"
        />

        {/* User Card Header with Integrated Avatar Controls */}
        <div className="bg-white border border-[#E6DFD5] p-6 rounded-[6px] shadow-antique-card mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Interactive Avatar Container */}
              <div className="relative group shrink-0">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-16 h-16 sm:w-18 sm:h-18 rounded-full border-2 border-[#D5C2A5] overflow-hidden shadow-sm bg-gradient-to-br from-[#8B1E21] to-[#A32427] text-white flex items-center justify-center font-serif text-[24px] font-bold cursor-pointer relative transition-transform hover:scale-105"
                  title="Bấm để tải hoặc đổi ảnh đại diện"
                >
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{user?.name?.charAt(0).toUpperCase()}</span>
                  )}

                  {uploadingAvatar ? (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white">
                      <Loader2 className="w-5 h-5 animate-spin text-amber-300" />
                    </div>
                  ) : (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-sans">
                      <Camera className="w-4 h-4 mb-0.5" />
                      <span>Đổi ảnh</span>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute -bottom-1 -right-1 p-1.5 bg-[#8B1E21] hover:bg-[#6A1517] text-white rounded-full shadow-md transition-all hover:scale-110 active:scale-95 border-2 border-white cursor-pointer"
                  title="Tải ảnh đại diện mới"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-serif text-[22px] font-bold text-[#262626]">{user?.name}</h1>
                  <span className="seal-badge text-[10px]">VAI TRÒ: {getRoleText(user?.role)}</span>
                </div>
                <div className="text-[13px] text-[#584140] mt-0.5">
                  {user?.email} · {user?.phone || 'Chưa cập nhật SĐT'}
                </div>

                {/* Quick Avatar Actions */}
                <div className="flex items-center gap-3 mt-1.5 text-[12px]">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="text-[#8B1E21] hover:text-[#6A1517] font-semibold inline-flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    {uploadingAvatar ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Đang tải ảnh...</span>
                      </>
                    ) : (
                      <>
                        <Camera className="w-3.5 h-3.5" />
                        <span>Tải / Đổi ảnh đại diện</span>
                      </>
                    )}
                  </button>

                  {user?.avatar && !uploadingAvatar && (
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      className="text-[#8C6D18] hover:text-red-700 font-medium inline-flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Gỡ ảnh</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'STAFF' ? (
                <Link to="/admin" className="btn-primary !text-[12.5px] !py-2">
                  <span>Vào Trang Quản Trị</span>
                </Link>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  logout();
                  navigate('/');
                }}
                className="btn-secondary !text-[12.5px] !py-2 cursor-pointer"
              >
                Đăng Xuất
              </button>
            </div>
          </div>

          {/* Feedback Alerts for Avatar */}
          {avatarSuccess && (
            <div className="mt-3 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded flex items-center gap-2 animate-fadeIn font-medium">
              <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{avatarSuccess}</span>
            </div>
          )}

          {avatarError && (
            <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded flex items-center gap-2 animate-fadeIn font-medium">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{avatarError}</span>
            </div>
          )}
        </div>

        {/* Quick Access to Order History Banner */}
        <div className="bg-[#FAF4EB] border border-[#D5C2A5] p-4 rounded-[6px] mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#8B1E21]/10 flex items-center justify-center text-[#8B1E21]">
              <Package size={20} />
            </div>
            <div>
              <div className="text-[14px] font-bold text-[#262626]">Theo dõi đơn hàng & yêu cầu đàn tràng</div>
              <div className="text-[12px] text-[#584140]">
                Xem tiến độ báo giá các bộ mẫu đàn lễ và tra cứu hóa đơn các đơn hàng linh phẩm
              </div>
            </div>
          </div>
          <Link
            to="/lich-su-don"
            className="btn-primary !text-[13px] !py-2 px-4 inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            <span>Xem Lịch Sử Đơn & Yêu Cầu</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {/* Page Content: Profile & Security Forms */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Cột Trái: Đổi Tên & Thông Tin Cá Nhân (7 Cột) */}
          <div className="lg:col-span-7 bg-white border border-[#E6DFD5] p-6 sm:p-7 rounded-[6px] shadow-sm space-y-6">
            <div className="border-b border-[#E6DFD5] pb-3 flex items-center justify-between">
              <div>
                <h2 className="font-serif text-[18px] font-bold text-[#262626] flex items-center gap-2">
                  <User className="w-5 h-5 text-[#8B1E21]" />
                  <span>Hồ Sơ Cá Nhân & Đổi Họ Tên</span>
                </h2>
                <p className="text-[12px] text-[#584140] mt-0.5">
                  Họ tên hiển thị trên đơn hàng và các văn bản báo giá đàn tràng
                </p>
              </div>
            </div>

            {profileSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2 animate-fadeIn font-medium">
                <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{profileSuccess}</span>
              </div>
            )}

            {profileError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center gap-2 animate-fadeIn font-medium">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-[12.5px] font-bold text-[#262626] mb-1">
                  Họ và Tên của bạn *
                </label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  placeholder="VD: Nguyễn Văn Thắng..."
                  className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#D5CCC1] rounded-[4px] text-[13.5px] font-semibold text-[#262626] focus:outline-none focus:border-[#8B1E21] focus:bg-white transition-all"
                  required
                />
                <span className="text-[11px] text-[#8C6D18] mt-1 block">
                  🛡️ Khi bạn đổi tên, Ban Quản Trị xưởng sẽ tự động nhận thông báo kèm nhật ký kiểm toán hệ thống để bảo vệ tính chính danh của tài khoản.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-[#262626] mb-1 flex items-center gap-1">
                    <Phone size={13} className="text-[#8B1E21]" />
                    <span>Số điện thoại liên hệ</span>
                  </label>
                  <input
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    placeholder="0988..."
                    className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#D5CCC1] rounded-[4px] text-[13px] text-[#262626] focus:outline-none focus:border-[#8B1E21] focus:bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-[#262626] mb-1 flex items-center gap-1">
                    <Mail size={13} className="text-gray-400" />
                    <span>Email đăng ký (Cố định)</span>
                  </label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full px-3.5 py-2.5 bg-gray-100 border border-gray-200 rounded-[4px] text-[13px] text-gray-500 font-mono cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#262626] mb-1 flex items-center gap-1">
                  <MapPin size={13} className="text-[#8B1E21]" />
                  <span>Địa chỉ giao đồ lễ mặc định</span>
                </label>
                <input
                  type="text"
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                  placeholder="Số nhà, tên đường, đền phủ..."
                  className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#D5CCC1] rounded-[4px] text-[13px] text-[#262626] focus:outline-none focus:border-[#8B1E21] focus:bg-white"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="btn-primary !text-[13px] !py-2.5 px-6"
                >
                  {savingProfile ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Lưu Thay Đổi Họ Tên</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Lịch sử các lần đổi tên của tài khoản */}
            {user?.nameHistory && user.nameHistory.length > 0 && (
              <div className="pt-4 border-t border-[#E6DFD5] space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
                  <History className="w-3.5 h-3.5 text-[#8B1E21]" />
                  <span>Lịch sử các lần đổi tên của bạn ({user.nameHistory.length}):</span>
                </div>
                <div className="space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar">
                  {user.nameHistory.slice().reverse().map((h, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-[#FAF7F2] border border-[#E6DFD5] rounded text-[11.5px] flex items-center justify-between text-[#584140]"
                    >
                      <div>
                        Từ: <strong className="text-gray-800 line-through mr-1">{h.oldName}</strong> ➔ Sang:{' '}
                        <strong className="text-[#8B1E21]">{h.newName}</strong>
                      </div>
                      <span className="text-[10px] text-gray-400 font-mono">
                        {new Date(h.changedAt).toLocaleString('vi-VN')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Cột Phải: Đổi Mật Khẩu An Toàn (5 Cột) */}
          <div className="lg:col-span-5 bg-white border border-[#E6DFD5] p-6 sm:p-7 rounded-[6px] shadow-sm space-y-6 flex flex-col justify-between">
            <div>
              <div className="border-b border-[#E6DFD5] pb-3">
                <h2 className="font-serif text-[18px] font-bold text-[#262626] flex items-center gap-2">
                  <Lock className="w-5 h-5 text-[#8B1E21]" />
                  <span>Đổi Mật Khẩu An Toàn</span>
                </h2>
                <p className="text-[12px] text-[#584140] mt-0.5">
                  Cập nhật mật khẩu định kỳ để bảo vệ tài khoản
                </p>
              </div>

              {passSuccess && (
                <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2 animate-fadeIn font-medium">
                  <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>{passSuccess}</span>
                </div>
              )}

              {passError && (
                <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center gap-2 animate-fadeIn font-medium">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{passError}</span>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4 mt-4">
                {/* Mật khẩu hiện tại */}
                <div>
                  <label className="block text-[12px] font-semibold text-[#262626] mb-1">
                    Mật khẩu hiện tại *
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPass ? 'text' : 'password'}
                      value={passwordForm.currentPassword}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                      }
                      placeholder="Nhập mật khẩu đang dùng..."
                      className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#D5CCC1] rounded-[4px] text-[13px] text-[#262626] focus:outline-none focus:border-[#8B1E21] focus:bg-white pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showCurrentPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Mật khẩu mới */}
                <div>
                  <label className="block text-[12px] font-semibold text-[#262626] mb-1">
                    Mật khẩu mới (Tối thiểu 6 ký tự) *
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      value={passwordForm.newPassword}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                      }
                      placeholder="Mật khẩu mới..."
                      className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#D5CCC1] rounded-[4px] text-[13px] text-[#262626] focus:outline-none focus:border-[#8B1E21] focus:bg-white pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Xác nhận mật khẩu mới */}
                <div>
                  <label className="block text-[12px] font-semibold text-[#262626] mb-1">
                    Xác nhận lại mật khẩu mới *
                  </label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                    }
                    placeholder="Gõ lại mật khẩu mới..."
                    className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#D5CCC1] rounded-[4px] text-[13px] text-[#262626] focus:outline-none focus:border-[#8B1E21] focus:bg-white"
                    required
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={changingPass}
                    className="btn-secondary w-full justify-center !text-[13px] !py-2.5"
                  >
                    {changingPass ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Đang đổi mật khẩu...</span>
                      </>
                    ) : (
                      <>
                        <Key className="w-4 h-4" />
                        <span>Cập Nhật Mật Khẩu Mới</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-[11px] text-amber-900 leading-relaxed flex items-start gap-2">
              <Shield className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
              <span>
                Mật khẩu được mã hóa an toàn bằng thuật toán chuẩn một chiều (Bcrypt). Không một ai kể cả quản trị viên có thể xem mật khẩu thô của bạn.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
