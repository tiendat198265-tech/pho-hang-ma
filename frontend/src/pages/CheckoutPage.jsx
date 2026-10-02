import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, ShieldCheck, Truck, ArrowRight, AlertCircle } from 'lucide-react';

export default function CheckoutPage() {
  const { cartItems, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    city: 'Hà Nội',
    deliveryDate: '',
    note: '',
    paymentMethod: 'BANK_TRANSFER',
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const shippingFee = totalPrice >= 2000000 || totalPrice === 0 ? 0 : 50000;
  const finalTotal = totalPrice + shippingFee;

  if (!user) {
    return (
      <div className="w-full bg-[#FAF7F2] min-h-[65vh] py-20 flex items-center justify-center">
        <div className="text-center bg-white border border-[#E6DFD5] p-8 sm:p-10 rounded-[4px] shadow-antique-card max-w-md w-full mx-4">
          <div className="w-16 h-16 rounded-full bg-[#FAF7F2] text-[#8B1E21] flex items-center justify-center mx-auto mb-4 border border-[#C59B27]/40 shadow-xs">
            <ShieldCheck size={30} />
          </div>
          <span className="seal-badge !text-[10px] mb-2">XÁC THỰC THANH TOÁN</span>
          <h2 className="font-serif text-[22px] font-bold text-[#262626]">
            Vui Lòng Đăng Nhập
          </h2>
          <p className="text-[13.5px] text-[#584140] mt-2 mb-6">
            Bạn cần đăng nhập tài khoản để tiến hành đặt hàng và thanh toán mâm lễ.
          </p>
          <div className="space-y-2.5">
            <Link
              to="/dang-nhap?redirect=/thanh-toan"
              className="btn-primary w-full justify-center text-[14px] !py-2.5 font-bold shadow-sm"
            >
              <span>ĐĂNG NHẬP ĐỂ THANH TOÁN</span>
              <ArrowRight size={16} />
            </Link>
            <Link to="/san-pham" className="btn-secondary w-full justify-center text-[14px]">
              Quay lại kho đồ lễ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="max-w-[800px] mx-auto px-4 py-20 text-center">
        <h2 className="font-serif text-[22px] font-bold text-[#262626]">Giỏ hàng đang trống</h2>
        <Link to="/san-pham" className="btn-primary mt-4">
          Quay lại kho đồ lễ
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.phone.trim() || !formData.address.trim()) {
      setErrorMsg('Vui lòng điền đầy đủ họ tên, số điện thoại và địa chỉ nhận hàng');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const token = localStorage.getItem('pho_hang_ma_token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const payload = {
        items: cartItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          note: item.note,
        })),
        shippingAddress: {
          fullName: formData.fullName,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          deliveryDate: formData.deliveryDate,
          note: formData.note,
        },
        paymentMethod: formData.paymentMethod,
        orderNotes: formData.note,
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success && data.data) {
        clearCart();
        try {
          sessionStorage.setItem(`order_just_placed_${data.data.orderCode}`, 'true');
        } catch (e) {}
        navigate(`/don-hang/${data.data.orderCode}`, {
          state: {
            justPlaced: true,
            phone: formData.phone,
            fullName: formData.fullName,
          },
        });
      } else {
        setErrorMsg(data.message || 'Lỗi khi tạo đơn hàng');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Không thể kết nối máy chủ');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-[#FAF7F2] min-h-screen py-10">
      <div className="max-w-[1200px] mx-auto px-4">
        {/* Header */}
        <div className="border-b border-[#E6DFD5] pb-4 mb-8">
          <span className="seal-badge mb-1">XÁC NHẬN THANH TOÁN</span>
          <h1 className="font-serif text-[28px] font-bold text-[#262626]">
            Đặt Mua Đồ Lễ Trực Tiếp
          </h1>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded flex items-center gap-2 text-[14px]">
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Shipping Form */}
          <div className="lg:col-span-7 bg-white border border-[#E6DFD5] p-6 rounded-[4px] shadow-antique-card space-y-6">
            <h2 className="font-serif text-[20px] font-bold text-[#262626] pb-3 border-b border-[#E6DFD5]">
              Thông Tin Giao Hàng Bằng Xe Mui Kín
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-semibold text-[#3E2723] uppercase mb-1">
                  Họ và tên người nhận *
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full bg-[#FAF7F2] border border-[#D5CCC1] text-[13.5px] rounded px-3 py-2 focus:border-[#8B1E21] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#3E2723] uppercase mb-1">
                  Số điện thoại *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-[#FAF7F2] border border-[#D5CCC1] text-[13.5px] rounded px-3 py-2 focus:border-[#8B1E21] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-[#3E2723] uppercase mb-1">
                Địa chỉ nhận đồ lễ (Gia thất / Bản đền / Bản phủ) *
              </label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Số nhà, ngõ ngách, tên đền phủ..."
                className="w-full bg-[#FAF7F2] border border-[#D5CCC1] text-[13.5px] rounded px-3 py-2 focus:border-[#8B1E21] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-semibold text-[#3E2723] uppercase mb-1">
                  Tỉnh / Thành phố
                </label>
                <select
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full bg-[#FAF7F2] border border-[#D5CCC1] text-[13.5px] rounded px-3 py-2 focus:border-[#8B1E21] focus:outline-none"
                >
                  <option value="Hà Nội">Hà Nội</option>
                  <option value="Bắc Ninh">Bắc Ninh</option>
                  <option value="Hưng Yên">Hưng Yên</option>
                  <option value="Hải Phòng">Hải Phòng</option>
                  <option value="Quảng Ninh">Quảng Ninh</option>
                  <option value="Nam Định">Nam Định</option>
                  <option value="Ninh Bình">Ninh Bình</option>
                  <option value="Tỉnh khác">Tỉnh khác (Xe chuyên dụng liên tỉnh)</option>
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#3E2723] uppercase mb-1">
                  Ngày & Giờ hoàng đạo giao đồ lễ
                </label>
                <input
                  type="text"
                  value={formData.deliveryDate}
                  onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                  placeholder="VD: Sáng sớm ngày 15 âm lịch"
                  className="w-full bg-[#FAF7F2] border border-[#D5CCC1] text-[13.5px] rounded px-3 py-2 focus:border-[#8B1E21] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-[#3E2723] uppercase mb-1">
                Ghi chú phụ cho bác tài & thợ cả
              </label>
              <textarea
                rows={2}
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                placeholder="Lời dặn riêng về đường vào, người mở cổng điện thờ..."
                className="w-full bg-[#FAF7F2] border border-[#D5CCC1] text-[13px] rounded p-2.5 focus:border-[#8B1E21] focus:outline-none"
              ></textarea>
            </div>

            {/* Payment options */}
            <div className="pt-2">
              <label className="block text-[12px] font-semibold text-[#3E2723] uppercase mb-3">
                Hình thức thanh toán
              </label>
              <div className="space-y-2.5">
                <label className="flex items-center gap-3 p-3 border border-[#E6DFD5] rounded-[3px] cursor-pointer hover:bg-[#FAF7F2]">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="BANK_TRANSFER"
                    checked={formData.paymentMethod === 'BANK_TRANSFER'}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="w-4 h-4 accent-[#8B1E21]"
                  />
                  <div>
                    <div className="font-semibold text-[13.5px] text-[#262626]">
                      Chuyển khoản Ngân hàng (Quét mã VietQR)
                    </div>
                    <div className="text-[12px] text-[#584140]">
                      Tự động xác nhận giao dịch, ưu tiên đóng khung giang sớm.
                    </div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 border border-[#E6DFD5] rounded-[3px] cursor-pointer hover:bg-[#FAF7F2]">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="COD"
                    checked={formData.paymentMethod === 'COD'}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="w-4 h-4 accent-[#8B1E21]"
                  />
                  <div>
                    <div className="font-semibold text-[13.5px] text-[#262626]">
                      Thanh toán khi nhận đồ lễ (COD)
                    </div>
                    <div className="text-[12px] text-[#584140]">
                      Kiểm tra đồ lễ cẩn trọng trên xe mui kín trước khi thanh toán cho bác tài.
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Right Summary */}
          <div className="lg:col-span-5 bg-white border-2 border-[#C59B27] p-6 rounded-[4px] shadow-antique-card space-y-4">
            <h3 className="font-serif text-[18px] font-bold text-[#262626] pb-3 border-b border-[#E6DFD5]">
              Đồ Lễ Trong Đơn ({cartItems.length})
            </h3>

            <div className="max-h-60 overflow-y-auto divide-y divide-[#E6DFD5] pr-1">
              {cartItems.map((item) => (
                <div key={item.productId} className="py-2.5 flex items-center justify-between gap-3 text-[13px]">
                  <div className="truncate flex-1">
                    <span className="font-medium text-[#262626]">{item.name}</span>
                    <span className="text-[#8B1E21] ml-2">x{item.quantity}</span>
                  </div>
                  <div className="font-semibold text-[#8B1E21] flex-shrink-0">
                    {Number(item.price * item.quantity).toLocaleString('vi-VN')} đ
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2 pt-3 border-t border-[#E6DFD5] text-[13.5px]">
              <div className="flex justify-between text-[#584140]">
                <span>Tiền hàng:</span>
                <span>{Number(totalPrice).toLocaleString('vi-VN')} đ</span>
              </div>
              <div className="flex justify-between text-[#584140]">
                <span>Cước xe mui kín:</span>
                <span>{shippingFee === 0 ? 'Miễn phí' : `${Number(shippingFee).toLocaleString('vi-VN')} đ`}</span>
              </div>
              <div className="flex justify-between text-[16px] font-bold text-[#8B1E21] pt-2 border-t border-[#E6DFD5]">
                <span>Tổng cộng:</span>
                <span>{Number(finalTotal).toLocaleString('vi-VN')} đ</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full !text-[15px] !py-3.5 justify-center mt-3 shadow-md disabled:opacity-50 cursor-pointer"
            >
              <span>{submitting ? 'Đang Khởi Tạo Đơn...' : 'XÁC NHẬN ĐẶT HÀNG'}</span>
              <ArrowRight size={18} />
            </button>

            <div className="p-3 bg-[#FAF7F2] border border-[#E6DFD5] rounded text-xs text-[#584140] flex items-start gap-2 leading-relaxed mt-2">
              <ShieldCheck size={16} className="text-[#8B1E21] shrink-0 mt-0.5" />
              <span>
                Sau khi gửi đơn, <strong>Thợ Cả / Ban quản trị xưởng</strong> sẽ tự động liên hệ qua số điện thoại của quý khách để xác thực chi tiết quy cách và hẹn lịch giao đồ lễ cẩn thận.
              </span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
