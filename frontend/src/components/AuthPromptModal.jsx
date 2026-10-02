import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, X, ArrowRight, ShieldCheck } from 'lucide-react';

export default function AuthPromptModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleLoginRedirect = () => {
    onClose();
    const returnUrl = location.pathname + location.search;
    navigate(`/dang-nhap?redirect=${encodeURIComponent(returnUrl)}`);
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white border border-[#E6DFD5] rounded-[6px] max-w-md w-full p-6 text-center shadow-2xl relative animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3.5 top-3.5 text-gray-400 hover:text-[#8B1E21] p-1 rounded transition-colors cursor-pointer"
          title="Đóng"
        >
          <X size={18} />
        </button>

        {/* Icon */}
        <div className="w-14 h-14 rounded-full bg-[#FAF7F2] border border-[#C59B27]/40 text-[#8B1E21] flex items-center justify-center mx-auto mb-3 shadow-xs">
          <Lock size={26} strokeWidth={2.2} />
        </div>

        {/* Badge & Title */}
        <span className="seal-badge !text-[10px] mb-1.5">YÊU CẦU ĐĂNG NHẬP</span>
        <h3 className="font-serif text-[20px] font-bold text-[#262626] mb-1.5">
          Vui Lòng Đăng Nhập
        </h3>
        <p className="text-[13.5px] text-[#584140] mb-6 leading-relaxed">
          Bạn cần đăng nhập tài khoản để thêm sản phẩm vào giỏ hàng và lưu mâm lễ đồ mã cổ truyền.
        </p>

        {/* Actions */}
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={handleLoginRedirect}
            className="btn-primary w-full !py-2.5 justify-center font-bold text-[13.5px] shadow-sm cursor-pointer"
          >
            <span>ĐĂNG NHẬP NGAY</span>
            <ArrowRight size={15} />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 text-[13px] text-[#584140] hover:text-[#8B1E21] font-medium transition-colors cursor-pointer"
          >
            Để sau
          </button>
        </div>
      </div>
    </div>
  );
}
