import React from 'react';
import { useLocation } from 'react-router-dom';
import { ChevronUp } from 'lucide-react';

export default function ZaloFloatingButton() {
  const location = useLocation();

  // Ẩn trên trang admin để tránh che khuất bảng điều khiển và thao tác
  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  const phoneNumber = '0396163773';
  const zaloUrl = `https://zalo.me/${phoneNumber}`;

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <aside
      aria-label="Liên hệ Zalo và Lên đầu trang"
      className="fixed bottom-6 right-6 z-40 flex flex-col items-center gap-3 print:hidden select-none"
    >
      {/* 1. NÚT TRÒN ZALO (CHỮ TRẮNG NỀN XANH CHUẨN NHẬN DIỆN) */}
      <a
        href={zaloUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="relative w-12 h-12 flex items-center justify-center rounded-full hover:scale-110 active:scale-95 transition-transform duration-200 group"
        title="Nhấn để chat trực tiếp qua Zalo với xưởng: 0396.163.773"
      >
        {/* Vòng hiệu ứng sóng lan toả nhẹ */}
        <span className="absolute -inset-1 rounded-full bg-[#0068FF]/25 animate-ping pointer-events-none" />

        {/* Biểu tượng logo Zalo chuẩn bong bóng thoại */}
        <svg
          viewBox="0 0 54 54"
          className="w-12 h-12 filter drop-shadow-md"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Nền xanh Zalo */}
          <circle cx="27" cy="27" r="26" fill="#0068FF" />
          {/* Bong bóng trắng */}
          <path
            d="M27 10C17.6 10 10 17 10 25.6c0 4.6 2.1 8.7 5.5 11.6l-1.8 6.2c-.3.9.7 1.7 1.5 1.2l7-3.1c1.5.5 3.1.7 4.8.7 9.4 0 17-7 17-15.6C44 17 36.4 10 27 10z"
            fill="#FFFFFF"
          />
          {/* Chữ Zalo màu xanh */}
          <text
            x="26.5"
            y="29.5"
            textAnchor="middle"
            fill="#0068FF"
            fontSize="11.5"
            fontWeight="900"
            fontFamily="Arial, -apple-system, sans-serif"
            letterSpacing="-0.3px"
          >
            Zalo
          </text>
        </svg>
      </a>

      {/* 2. NÚT TRÒN LÊN ĐẦU TRANG (MŨI TÊN ^) */}
      <button
        type="button"
        onClick={scrollToTop}
        className="w-11 h-11 rounded-full bg-white text-gray-800 hover:text-black hover:bg-gray-50 flex items-center justify-center shadow-lg border border-gray-100/90 transition-all duration-200 active:scale-90"
        title="Cuộn lên đầu trang"
      >
        <ChevronUp size={22} className="stroke-[2.5]" />
      </button>
    </aside>
  );
}
