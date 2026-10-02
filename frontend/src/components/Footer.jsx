import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Truck, Clock, Award, Phone, MapPin } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import BrandLogo from './BrandLogo';

export default function Footer() {
  const { logoUrl, settings } = useSettings();
  const storeAddress = settings?.address || 'Xóm Miễu, Duyên Thái, Thường Tín, Hà Nội';
  const hotline = settings?.hotline || '0396.163.773';
  const openHours = settings?.opening_hours || 'luôn mở';

  return (
    <footer className="w-full bg-[#FAF7F2]">
      {/* 1. KHỐI 4 CAM KẾT / BRAND PILLARS NỀN SÁNG */}
      <div className="border-t border-[#E6DFD5] bg-[#FAF7F2] py-8">
        <div className="max-w-[1320px] mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Nghệ Nhân Lão Thành */}
            <div className="bg-white border border-[#E5DFD7] rounded-sm p-4 flex items-start gap-3 shadow-xs">
              <div className="w-9 h-9 rounded-sm border border-[#C59B27] flex items-center justify-center text-[#B38728] flex-shrink-0 mt-0.5">
                <Award size={18} />
              </div>
              <div>
                <h4 className="font-serif text-[14px] font-bold text-[#262626] leading-tight">
                  Nghệ Nhân Lão Thành
                </h4>
                <p className="text-[12px] text-[#666] mt-1 leading-snug">
                  Thợ cả Phố Hàng Mã trực tiếp bồi dán khung gọng gát, tuân thủ khoa nghi cổ.
                </p>
              </div>
            </div>

            {/* Card 2: Xe Mui Kín Chuyên Biệt */}
            <div className="bg-white border border-[#E5DFD7] rounded-sm p-4 flex items-start gap-3 shadow-xs">
              <div className="w-9 h-9 rounded-sm border border-[#C59B27] flex items-center justify-center text-[#B38728] flex-shrink-0 mt-0.5">
                <Truck size={18} />
              </div>
              <div>
                <h4 className="font-serif text-[14px] font-bold text-[#262626] leading-tight">
                  Xe Mui Kín Chuyên Biệt
                </h4>
                <p className="text-[12px] text-[#666] mt-1 leading-snug">
                  Vận chuyển tôn nghiêm, không để đồ lễ dính mưa bụi, cam kết nguyên vẹn tận đền phủ.
                </p>
              </div>
            </div>

            {/* Card 3: Bảo Chứng Tôn Nghiêm */}
            <div className="bg-white border border-[#E5DFD7] rounded-sm p-4 flex items-start gap-3 shadow-xs">
              <div className="w-9 h-9 rounded-sm border border-[#C59B27] flex items-center justify-center text-[#B38728] flex-shrink-0 mt-0.5">
                <ShieldCheck size={18} />
              </div>
              <div>
                <h4 className="font-serif text-[14px] font-bold text-[#262626] leading-tight">
                  Bảo Chứng Tôn Nghiêm
                </h4>
                <p className="text-[12px] text-[#666] mt-1 leading-snug">
                  Mỗi mâm lễ đều có dấu ấn triện son xác nhận chất lượng và sự chu toàn thành kính.
                </p>
              </div>
            </div>

            {/* Card 4: Giao Kịp Giờ Hoàng Đạo */}
            <div className="bg-white border border-[#E5DFD7] rounded-sm p-4 flex items-start gap-3 shadow-xs">
              <div className="w-9 h-9 rounded-sm border border-[#C59B27] flex items-center justify-center text-[#B38728] flex-shrink-0 mt-0.5">
                <Clock size={18} />
              </div>
              <div>
                <h4 className="font-serif text-[14px] font-bold text-[#262626] leading-tight">
                  Giao Kịp Giờ Hoàng Đạo
                </h4>
                <p className="text-[12px] text-[#666] mt-1 leading-snug">
                  Chính xác từng giờ hành lễ, sẵn sàng hỗ trợ sắp đặt linh mâm trước khóa đàn.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN FOOTER NỀN NÂU ĐẬM TRẦM TỐI */}
      <div className="bg-[#241712] text-[#D2C4B9] pt-12 pb-10">
        <div className="max-w-[1320px] mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
            {/* Cột 1: PHỐ HÀNG MÃ (Chiếm 4/12 cột) */}
            <div className="lg:col-span-4 space-y-4">
              <div className="flex items-center gap-3">
                <BrandLogo variant="dark" />
              </div>
              <p className="text-[13px] leading-relaxed text-[#D2C4B9]/90 max-w-[340px]">
                Gìn giữ và lưu truyền nét văn hoá tâm linh cổ truyền Thăng Long – Hà Nội. Đồ mã phẩm chất cao, trang nghiêm, đúng điển tích tập tục ngàn đời của người Việt.
              </p>
              <div className="pt-2 space-y-2.5 text-[12.5px] text-[#D2C4B9]">
                <div className="flex items-start gap-2.5">
                  <MapPin size={15} className="text-[#E5B54F] flex-shrink-0 mt-0.5" />
                  <span>Địa chỉ: {storeAddress}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Phone size={15} className="text-[#E5B54F] flex-shrink-0" />
                  <span>
                    Hotline Thợ Cả:{' '}
                    <a
                      href={`tel:${hotline.replace(/\D/g, '')}`}
                      className="font-semibold text-white hover:text-[#E5B54F] hover:underline"
                    >
                      {hotline}
                    </a>
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Clock size={15} className="text-[#E5B54F] flex-shrink-0" />
                  <span>Mở cửa: {openHours}</span>
                </div>
              </div>
            </div>

            {/* Cột 2: DANH MỤC ĐỒ MÃ (Chiếm 3/12 cột) */}
            <div className="lg:col-span-3">
              <h3 className="font-serif text-[14px] font-bold text-[#E5B54F] tracking-wider uppercase mb-4">
                DANH MỤC ĐỒ MÃ
              </h3>
              <ul className="space-y-2.5 text-[13px] text-[#D2C4B9]">
                <li>
                  <Link to="/san-pham" className="hover:text-white hover:underline transition-colors block">
                    Tiền vàng & Thỏi vàng tâm linh
                  </Link>
                </li>
                <li>
                  <Link to="/san-pham" className="hover:text-white hover:underline transition-colors block">
                    Quần áo, Mũ hia & Bào quan
                  </Link>
                </li>
                <li>
                  <Link to="/san-pham" className="hover:text-white hover:underline transition-colors block">
                    Ngựa giấy & Linh vật thần linh
                  </Link>
                </li>
                <li>
                  <Link to="/san-pham" className="hover:text-white hover:underline transition-colors block">
                    Hình nhân thế mạng bản mệnh
                  </Link>
                </li>
                <li>
                  <Link to="/san-pham" className="hover:text-white hover:underline transition-colors block">
                    Nhà lầu, Biệt thự & Xe mã thủ công
                  </Link>
                </li>
                <li>
                  <Link to="/bo-mau" className="hover:text-white hover:underline transition-colors block">
                    Trọn bộ đàn lễ Tứ Phủ & Giỗ Chạp
                  </Link>
                </li>
              </ul>
            </div>

            {/* Cột 3: CHÍNH SÁCH & HƯỚNG DẪN (Chiếm 3/12 cột) */}
            <div className="lg:col-span-3">
              <h3 className="font-serif text-[14px] font-bold text-[#E5B54F] tracking-wider uppercase mb-4">
                CHÍNH SÁCH & HƯỚNG DẪN
              </h3>
              <ul className="space-y-2.5 text-[13px] text-[#D2C4B9]">
                <li>
                  <span className="hover:text-white hover:underline transition-colors cursor-pointer block">
                    Hướng dẫn sắm lễ phong tục cổ truyền
                  </span>
                </li>
                <li>
                  <span className="hover:text-white hover:underline transition-colors cursor-pointer block">
                    Chính sách vận chuyển xe mui kín bảo toàn
                  </span>
                </li>
                <li>
                  <Link to="/tuy-chinh-mau" className="hover:text-white hover:underline transition-colors block">
                    Quy trình đặt làm bộ lễ đại lễ – đàn tràng
                  </Link>
                </li>
                <li>
                  <span className="hover:text-white hover:underline transition-colors cursor-pointer block">
                    Cam kết phẩm chất & Đổi trả linh phẩm
                  </span>
                </li>
                <li>
                  <span className="hover:text-white hover:underline transition-colors cursor-pointer block">
                    Hỏi đáp lịch nghi lễ & Ngày tiệc Tứ Phủ
                  </span>
                </li>
              </ul>
            </div>

            {/* Cột 4: THANH TOÁN & CHỨNG THỰC (Chiếm 2/12 hoặc mở rộng linh hoạt) */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="font-serif text-[14px] font-bold text-[#E5B54F] tracking-wider uppercase mb-2">
                THANH TOÁN & CHỨNG THỰC
              </h3>
              <p className="text-[12.5px] text-[#D2C4B9]/90 leading-relaxed">
                Hỗ trợ thanh toán linh hoạt, tiện lợi và kín đáo cho quý gia chủ:
              </p>

              {/* Tags thanh toán & vận chuyển */}
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  <span className="px-2.5 py-1 bg-[#1A100C] border border-[#59392B] rounded text-[11px] text-[#E5B54F] font-medium whitespace-nowrap">
                    Giao Toàn quốc
                  </span>
                  <span className="px-2.5 py-1 bg-[#1A100C] border border-[#59392B] rounded text-[11px] text-[#E5B54F] font-medium whitespace-nowrap">
                    Chuyển khoản ngân hàng
                  </span>
                </div>
                <div>
                  <span className="inline-block px-2.5 py-1 bg-[#1A100C] border border-[#59392B] rounded text-[11px] text-[#E5B54F] font-medium whitespace-nowrap">
                    Giao hỏa tốc 2h Hà Nội
                  </span>
                </div>
              </div>

              {/* Khung Cam Kết Tâm Đức Nghề Cổ */}
              <div className="p-3 bg-[#1A100C]/90 border border-[#59392B] rounded-[4px] space-y-1.5 mt-3">
                <div className="flex items-center gap-1.5 text-[#E5B54F] text-[12px] font-bold">
                  <ShieldCheck size={14} className="flex-shrink-0 text-[#E5B54F]" />
                  <span>Cam Kết Tâm Đức Nghề Cổ</span>
                </div>
                <p className="text-[11px] text-[#B8A99E] leading-relaxed">
                  Giấy cúng nguyên chất, màu sắc sắc nét chuẩn truyền thống, không rách vỡ khi di chuyển.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. DÒNG BẢN QUYỀN CHÂN TRANG (BOTTOM COPYRIGHT BAR) */}
      <div className="bg-[#1C120D] border-t border-[#34221A] py-4 text-[#A8988C] text-[12px]">
        <div className="max-w-[1320px] mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <div>
            © Tuyệt mã Thường Tín. Bảo lưu mọi quyền văn hoá và thương hiệu truyền thống.
          </div>
          <div className="flex items-center gap-1.5 text-[#E5B54F] font-medium">
            <Award size={14} />
            <span>Tinh hoa nghề thủ công mã Thường Tín – Hà Nội</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
