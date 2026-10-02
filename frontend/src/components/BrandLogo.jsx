import React from 'react';
import { useSettings } from '../context/SettingsContext';

/**
 * BrandLogo: Component hiển thị Logo linh hoạt dạng CHỮ (Text) hoặc HÌNH ẢNH (Image)
 * Cho phép Quản trị viên tùy biến trực tiếp trong Admin Settings.
 *
 * @param {string} variant - 'light' (Navbar sáng) | 'dark' (Footer tối) | 'admin' (Admin sidebar)
 * @param {string} className - Các lớp CSS tùy biến thêm
 * @param {object} customData - (Tùy chọn) Truyền dữ liệu để xem trước (Preview) trong Admin
 */
export default function BrandLogo({ variant = 'light', className = '', customData = null }) {
  const settingsContext = useSettings();

  const logoType = customData?.logo_type || settingsContext.logoType || 'TEXT';
  const logoText = customData?.logo_text ?? settingsContext.logoText ?? 'TUYẾT MÃ';
  const logoHighlight = customData?.logo_highlight ?? settingsContext.logoHighlight ?? '';
  const logoTagline = customData?.logo_tagline ?? settingsContext.logoTagline ?? 'LÀNG NGHỀ THƯỜNG TÍN';
  const logoUrl = customData?.logo_url || settingsContext.logoUrl || '/logo.png';

  // 1. CHẾ ĐỘ HÌNH ẢNH (IMAGE LOGO)
  if (logoType === 'IMAGE') {
    const imgHeight =
      variant === 'admin'
        ? 'h-10'
        : variant === 'dark'
        ? 'h-13'
        : 'h-[48px] sm:h-[54px]';

    return (
      <div className={`flex items-center gap-2.5 flex-shrink-0 ${className}`}>
        <img
          src={logoUrl || '/logo.png'}
          alt={logoText || 'Logo'}
          className={`${imgHeight} w-auto object-contain rounded-[3px] shadow-xs`}
          onError={(e) => {
            e.target.src = '/logo.png';
          }}
        />
      </div>
    );
  }

  // 2. CHẾ ĐỘ DẠNG CHỮ (TEXT TYPOGRAPHY LOGO - PHONG CÁCH CELLPHONES & TRIỆN CỔ TRUYỀN)
  const isDark = variant === 'dark';
  const isAdmin = variant === 'admin';

  // Lấy chữ cái đầu tiên làm ký tự triện nếu không có icon riêng
  const firstLetter = (logoText || 'T').trim().charAt(0).toUpperCase();

  return (
    <div className={`flex items-center gap-2.5 select-none transition-transform duration-200 group-hover:scale-[1.02] flex-shrink-0 ${className}`}>
      {/* Biểu tượng Dấu Triện Son cách điệu */}
      <div
        className={`flex items-center justify-center rounded-[5px] font-bold shadow-xs transition-colors flex-shrink-0 ${
          isAdmin
            ? 'w-8 h-8 text-[14px] bg-[#8B1E21] text-amber-200 border border-amber-500/40'
            : isDark
            ? 'w-10 h-10 text-[18px] bg-gradient-to-br from-[#8B1E21] to-[#601214] text-[#E5B54F] border border-[#C59B27]/50 shadow-md'
            : 'w-10 h-10 sm:w-11 sm:h-11 text-[17px] sm:text-[19px] bg-gradient-to-br from-[#8B1E21] to-[#A32427] text-white border-2 border-[#C59B27] shadow-sm'
        }`}
        style={{ fontFamily: "'Playfair Display', serif" }}
      >
        <span>{firstLetter}</span>
      </div>

      {/* Khối Typography: Tên thương hiệu + Chữ Highlight + Khẩu hiệu */}
      <div className="flex flex-col justify-center leading-none">
        <div className="flex items-center gap-1.5">
          <span
            className={`font-serif tracking-tight font-extrabold uppercase ${
              isAdmin
                ? 'text-[15px] text-[#8B1E21]'
                : isDark
                ? 'text-[20px] sm:text-[22px] text-[#FAF7F2]'
                : 'text-[20px] sm:text-[23px] text-[#8B1E21]'
            }`}
          >
            {logoText}
          </span>

          {/* Ô chữ Highlight (Phong cách chữ nổi bật giống CellphoneS) */}
          {logoHighlight && (
            <span
              className={`px-1.5 py-0.5 rounded-[3px] text-[11px] sm:text-[12px] font-bold tracking-wider uppercase flex items-center justify-center ${
                isDark
                  ? 'bg-[#E5B54F] text-[#241712]'
                  : 'bg-[#8B1E21] text-white shadow-xs'
              }`}
            >
              {logoHighlight}
            </span>
          )}
        </div>

        {/* Tagline / Khẩu hiệu phụ bên dưới */}
        {logoTagline && !isAdmin && (
          <span
            className={`text-[9.5px] sm:text-[10px] font-sans tracking-[0.18em] uppercase font-semibold mt-1 ${
              isDark ? 'text-[#C59B27]' : 'text-[#8C6D18]'
            }`}
          >
            {logoTagline}
          </span>
        )}

        {isAdmin && (
          <span className="text-[10px] text-gray-500 font-sans tracking-normal font-medium mt-0.5">
            Quản Trị Hệ Thống
          </span>
        )}
      </div>
    </div>
  );
}
