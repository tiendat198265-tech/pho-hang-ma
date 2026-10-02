import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Trash2, ShoppingCart, ArrowRight, ShieldCheck, ArrowLeft } from 'lucide-react';

export default function CartPage() {
  const { cartItems, updateQuantity, removeFromCart, clearCart, totalPrice } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const shippingFee = totalPrice >= 2000000 || totalPrice === 0 ? 0 : 50000;
  const finalTotal = totalPrice + shippingFee;

  if (!user) {
    return (
      <div className="w-full bg-[#FAF7F2] min-h-[65vh] py-20 flex items-center justify-center">
        <div className="text-center bg-white border border-[#E6DFD5] p-8 sm:p-10 rounded-[4px] shadow-antique-card max-w-md w-full mx-4">
          <div className="w-16 h-16 rounded-full bg-[#FAF7F2] text-[#8B1E21] flex items-center justify-center mx-auto mb-4 border border-[#C59B27]/40 shadow-xs">
            <ShoppingCart size={30} />
          </div>
          <span className="seal-badge !text-[10px] mb-2">QUẢN LÝ MÂM LỄ</span>
          <h2 className="font-serif text-[22px] font-bold text-[#262626]">
            Vui Lòng Đăng Nhập
          </h2>
          <p className="text-[13.5px] text-[#584140] mt-2 mb-6">
            Bạn cần đăng nhập để sử dụng giỏ hàng và theo dõi các vật phẩm đồ lễ.
          </p>
          <div className="space-y-2.5">
            <Link
              to="/dang-nhap?redirect=/gio-hang"
              className="btn-primary w-full justify-center text-[14px] !py-2.5 font-bold shadow-sm"
            >
              <span>ĐĂNG NHẬP NGAY</span>
              <ArrowRight size={16} />
            </Link>
            <Link to="/san-pham" className="btn-secondary w-full justify-center text-[14px]">
              Tiếp tục xem sản phẩm
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="w-full bg-[#FAF7F2] min-h-[60vh] py-20 flex items-center justify-center">
        <div className="text-center bg-white border border-[#E6DFD5] p-10 rounded-[4px] shadow-antique-card max-w-md w-full mx-4">
          <div className="w-16 h-16 rounded-full bg-[#F4EFEB] text-[#8B1E21] flex items-center justify-center mx-auto mb-4">
            <ShoppingCart size={30} />
          </div>
          <h2 className="font-serif text-[22px] font-bold text-[#262626]">
            Giỏ Đồ Lễ Đang Trống
          </h2>
          <p className="text-[13.5px] text-[#584140] mt-1 mb-6">
            Quý khách chưa chọn linh phẩm hoặc đồ mã nào vào giỏ.
          </p>
          <div className="space-y-2">
            <Link to="/san-pham" className="btn-primary w-full justify-center text-[14px]">
              Xem Kho Linh Phẩm
            </Link>
            <Link to="/bo-mau" className="btn-secondary w-full justify-center text-[14px]">
              Xem Các Bộ Mẫu Đàn Tràng
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#FAF7F2] min-h-screen py-10">
      <div className="max-w-[1200px] mx-auto px-4">
        {/* Header */}
        <div className="border-b border-[#E6DFD5] pb-4 mb-8 flex justify-between items-end">
          <div>
            <span className="seal-badge mb-1">GIỎ HÀNG THƯƠNG MẠI</span>
            <h1 className="font-serif text-[28px] font-bold text-[#262626]">
              Giỏ Đồ Lễ Cổ Truyền
            </h1>
          </div>
          <button
            onClick={clearCart}
            className="text-[13px] text-red-600 hover:underline flex items-center gap-1"
          >
            <Trash2 size={14} /> Xóa sạch giỏ
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Cart Items List */}
          <div className="lg:col-span-8 bg-white border border-[#E6DFD5] rounded-[4px] p-6 shadow-antique-card">
            <div className="divide-y divide-[#E6DFD5]">
              {cartItems.map((item) => (
                <div key={item.productId} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  {/* Image & Title */}
                  <div className="flex items-center gap-4 flex-1">
                    <img
                      src={item.thumbnail || 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&w=120&q=80'}
                      alt={item.name}
                      className="w-16 h-16 rounded object-cover border border-[#E6DFD5] flex-shrink-0"
                    />
                    <div>
                      <h3 className="font-serif text-[16px] font-semibold text-[#262626]">
                        {item.name}
                      </h3>
                      <div className="text-[13px] text-[#8B1E21] font-semibold mt-0.5">
                        {Number(item.price).toLocaleString('vi-VN')} đ / {item.unit}
                      </div>
                      {item.note && (
                        <div className="text-[11.5px] text-[#584140] italic mt-0.5">
                          Ghi chú: {item.note}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quantity & Delete */}
                  <div className="flex items-center gap-5">
                    <div className="flex items-center border border-[#D5CCC1] rounded-[3px] bg-[#FAF7F2] overflow-hidden">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center text-[#262626] hover:bg-white"
                      >
                        -
                      </button>
                      <span className="w-10 text-center font-bold text-[14px] text-[#8B1E21]">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center text-[#262626] hover:bg-white"
                      >
                        +
                      </button>
                    </div>

                    <div className="text-right min-w-[100px]">
                      <div className="text-[15px] font-bold text-[#8B1E21]">
                        {Number(item.price * item.quantity).toLocaleString('vi-VN')} đ
                      </div>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.productId)}
                      className="text-gray-400 hover:text-red-600 p-1"
                      title="Xóa khỏi giỏ"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-[#E6DFD5] flex items-center justify-between">
              <Link to="/san-pham" className="text-[13.5px] text-[#8B1E21] font-medium hover:underline flex items-center gap-1">
                <ArrowLeft size={16} /> Tiếp tục chọn đồ lễ
              </Link>
            </div>
          </div>

          {/* Checkout Summary Box */}
          <div className="lg:col-span-4 bg-white border-2 border-[#C59B27] p-6 rounded-[4px] shadow-antique-card space-y-4">
            <h3 className="font-serif text-[18px] font-bold text-[#262626] pb-3 border-b border-[#E6DFD5]">
              Tóm Tắt Đơn Hàng
            </h3>

            <div className="space-y-2.5 text-[13.5px] pb-3 border-b border-[#E6DFD5]">
              <div className="flex justify-between text-[#584140]">
                <span>Tổng tiền linh phẩm:</span>
                <span className="font-semibold text-[#262626]">
                  {Number(totalPrice).toLocaleString('vi-VN')} đ
                </span>
              </div>
              <div className="flex justify-between text-[#584140]">
                <span>Cước vận chuyển xe mui kín:</span>
                <span className="font-semibold text-[#262626]">
                  {shippingFee === 0 ? (
                    <span className="text-green-700">Miễn phí (Đơn &gt; 2 triệu)</span>
                  ) : (
                    `${Number(shippingFee).toLocaleString('vi-VN')} đ`
                  )}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center text-[16px] font-bold pt-1">
              <span className="text-[#262626]">Tổng thanh toán:</span>
              <span className="text-[22px] text-[#8B1E21]">
                {Number(finalTotal).toLocaleString('vi-VN')} đ
              </span>
            </div>

            <button
              onClick={() => navigate('/thanh-toan')}
              className="btn-primary w-full !text-[15px] !py-3.5 justify-center mt-2"
            >
              <span>Tiến Hành Đặt Hàng</span>
              <ArrowRight size={18} />
            </button>

            <div className="p-3 bg-[#FAF7F2] rounded-[3px] text-[12px] text-[#584140] space-y-1">
              <div className="font-semibold text-[#8B1E21]">An tâm tuyệt đối:</div>
              <div>• Kiểm tra đồ lễ trước khi thanh toán.</div>
              <div>• Xe chuyên dụng mui kín không ướt bụi.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
