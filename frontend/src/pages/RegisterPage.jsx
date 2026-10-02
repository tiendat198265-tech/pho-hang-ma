import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Lock, Phone, Mail, ArrowRight, AlertCircle } from 'lucide-react';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    address: '',
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect');

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success && data.token) {
        login(data.token, data.user);
        if (redirectUrl && redirectUrl.startsWith('/') && !redirectUrl.startsWith('//')) {
          navigate(redirectUrl);
        } else {
          navigate('/tai-khoan');
        }
      } else {
        setErrorMsg(data.message || 'Đăng ký không thành công');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-[#FAF7F2] min-h-[80vh] py-14 flex items-center justify-center">
      <div className="max-w-md w-full mx-4 bg-white border border-[#E6DFD5] p-8 rounded-[4px] shadow-antique-card">
        <div className="text-center mb-6">
          <span className="seal-badge mb-2">TẠO TÀI KHOẢN MỚI</span>
          <h1 className="font-serif text-[26px] font-bold text-[#262626]">
            Đăng Ký Tài Khoản
          </h1>
          <p className="text-[13px] text-[#584140] mt-1">
            Lưu trữ mâm lễ tùy chỉnh, theo dõi báo giá và đơn hàng nhanh chóng.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-[13px] flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-3.5">
          <div>
            <label className="block text-[12px] font-semibold text-[#3E2723] uppercase mb-1">
              Họ và tên *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nguyễn Văn A"
              className="w-full bg-[#FAF7F2] border border-[#D5CCC1] text-[13.5px] rounded px-3 py-2 focus:border-[#8B1E21] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-[#3E2723] uppercase mb-1">
              Email *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="ten@vidu.com"
              className="w-full bg-[#FAF7F2] border border-[#D5CCC1] text-[13.5px] rounded px-3 py-2 focus:border-[#8B1E21] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-[#3E2723] uppercase mb-1">
              Số điện thoại
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="0912 345 678"
              className="w-full bg-[#FAF7F2] border border-[#D5CCC1] text-[13.5px] rounded px-3 py-2 focus:border-[#8B1E21] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-[#3E2723] uppercase mb-1">
              Mật khẩu (Tối thiểu 6 ký tự) *
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              className="w-full bg-[#FAF7F2] border border-[#D5CCC1] text-[13.5px] rounded px-3 py-2 focus:border-[#8B1E21] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-[#3E2723] uppercase mb-1">
              Địa chỉ gia thất / Bản đền
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Quận / Huyện, Hà Nội..."
              className="w-full bg-[#FAF7F2] border border-[#D5CCC1] text-[13.5px] rounded px-3 py-2 focus:border-[#8B1E21] focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full !py-2.5 justify-center mt-3 disabled:opacity-50"
          >
            <span>{loading ? 'Đang khởi tạo tài khoản...' : 'TẠO TÀI KHOẢN'}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        <div className="mt-5 text-center text-[13px] text-[#584140]">
          Đã có tài khoản?{' '}
          <Link to="/dang-nhap" className="text-[#8B1E21] font-semibold hover:underline">
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    </div>
  );
}
