import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Lock, ArrowRight, AlertCircle, Shield } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success && data.token) {
        login(data.token, data.user);
        if (redirectUrl && redirectUrl.startsWith('/') && !redirectUrl.startsWith('//')) {
          navigate(redirectUrl);
        } else if (data.user.role === 'ADMIN' || data.user.role === 'STAFF') {
          navigate('/admin');
        } else {
          navigate('/tai-khoan');
        }
      } else {
        setErrorMsg(data.message || 'Đăng nhập không thành công');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  const setPresetUser = (role) => {
    if (role === 'ADMIN') {
      setEmail('admin@phohangma.vn');
      setPassword('admin123');
    } else if (role === 'STAFF') {
      setEmail('thoca@phohangma.vn');
      setPassword('thoca123');
    } else {
      setEmail('khachhang@gmail.com');
      setPassword('khach123');
    }
  };

  return (
    <div className="w-full bg-[#FAF7F2] min-h-[75vh] py-14 flex items-center justify-center">
      <div className="max-w-md w-full mx-4 bg-white border border-[#E6DFD5] p-8 rounded-[4px] shadow-antique-card">
        <div className="text-center mb-6">
          <span className="seal-badge mb-2">HỆ THỐNG XÁC THỰC RBAC</span>
          <h1 className="font-serif text-[26px] font-bold text-[#262626]">
            Đăng Nhập Tài Khoản
          </h1>
          <p className="text-[13px] text-[#584140] mt-1">
            Đăng nhập để theo dõi đàn lễ, báo giá và quản lý xưởng đồ mã.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-[13px] flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[12px] font-semibold text-[#3E2723] uppercase mb-1">
              Email đăng ký
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ten@vidu.com"
                className="w-full bg-[#FAF7F2] border border-[#D5CCC1] text-[13.5px] rounded px-3 py-2 pl-9 focus:border-[#8B1E21] focus:outline-none"
              />
              <User size={16} className="absolute left-3 top-2.5 text-gray-400" />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-[#3E2723] uppercase mb-1">
              Mật khẩu
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#FAF7F2] border border-[#D5CCC1] text-[13.5px] rounded px-3 py-2 pl-9 focus:border-[#8B1E21] focus:outline-none"
              />
              <Lock size={16} className="absolute left-3 top-2.5 text-gray-400" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full !py-2.5 justify-center mt-2 disabled:opacity-50"
          >
            <span>{loading ? 'Đang xác thực...' : 'ĐĂNG NHẬP'}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Demo Fast Login Buttons */}
        <div className="mt-6 pt-4 border-t border-[#E6DFD5]">
          <div className="text-[11.5px] font-semibold text-[#8C6D18] uppercase tracking-wider mb-2 text-center">
            Tài Khoản Phân Quyền Thử Nghiệm:
          </div>
          <div className="grid grid-cols-3 gap-2 text-[11.5px]">
            <button
              type="button"
              onClick={() => setPresetUser('ADMIN')}
              className="p-1.5 border border-[#8B1E21] text-[#8B1E21] rounded hover:bg-[#8B1E21] hover:text-white transition-colors"
            >
              Quản Trị Viên
            </button>
            <button
              type="button"
              onClick={() => setPresetUser('STAFF')}
              className="p-1.5 border border-[#C59B27] text-[#775a00] rounded hover:bg-[#C59B27] hover:text-white transition-colors"
            >
              Thợ Cả Nghệ Nhân
            </button>
            <button
              type="button"
              onClick={() => setPresetUser('CUSTOMER')}
              className="p-1.5 border border-[#D5CCC1] text-[#262626] rounded hover:bg-[#FAF7F2] transition-colors"
            >
              Khách Hàng
            </button>
          </div>
        </div>

        <div className="mt-5 text-center text-[13px] text-[#584140]">
          Chưa có tài khoản?{' '}
          <Link
            to={redirectUrl ? `/dang-ky?redirect=${encodeURIComponent(redirectUrl)}` : '/dang-ky'}
            className="text-[#8B1E21] font-semibold hover:underline"
          >
            Đăng ký ngay
          </Link>
        </div>
      </div>
    </div>
  );
}
