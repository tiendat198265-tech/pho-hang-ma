import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Sparkles,
  CheckCircle2,
  SlidersHorizontal,
  Shield,
  Phone,
  Truck,
  Flame,
  ChevronLeft,
  ChevronRight,
  Package,
} from 'lucide-react';
import ProductCard from '../components/ProductCard';
import ConsultationSection from '../components/ConsultationSection';
import StoreLocationDirections from '../components/StoreLocationDirections';
import BannerDisplay from '../components/BannerDisplay';

export default function HomePage() {
  const [heroBanners, setHeroBanners] = useState([]);
  const [middleBanners, setMiddleBanners] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [templates, setTemplates] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [heroRes, middleRes, templatesRes, productsRes, categoriesRes] = await Promise.all([
          fetch('/api/banners?position=HOME_HERO'),
          fetch('/api/banners?position=HOME_MIDDLE'),
          fetch('/api/templates?limit=8'),
          fetch('/api/products?limit=8'),
          fetch('/api/categories'),
        ]);

        const [heroData, middleData, templatesData, productsData, categoriesData] = await Promise.all([
          heroRes.json(),
          middleRes.json(),
          templatesRes.json(),
          productsRes.json(),
          categoriesRes.json(),
        ]);

        if (heroData.success && heroData.data.length > 0) setHeroBanners(heroData.data);
        if (middleData.success && middleData.data.length > 0) setMiddleBanners(middleData.data);
        if (templatesData.success) setTemplates(templatesData.data);
        if (productsData.success) setProducts(productsData.data);
        if (categoriesData.success) setCategories(categoriesData.data);
      } catch (err) {
        console.error('Error fetching homepage data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Auto rotate hero banner
  useEffect(() => {
    if (heroBanners.length <= 1 || isPaused) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroBanners.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [heroBanners.length, isPaused]);

  const activeBanner = heroBanners[currentSlide] || {
    title: 'Đặt Bộ Mẫu Đàn Tràng – Tiết Kiệm Đến 25%',
    subtitle: 'Di Sản Thủ Công Thăng Long · Chuẩn Khoa Nghi Cổ',
    description:
      'Tuyển tập các bộ mẫu đàn tràng quy chuẩn: Đàn Tứ Phủ, Lễ Tiết Bốn Mùa, Lễ Gia Tiên Bản Thổ. Được chế tác kỳ công bởi nghệ nhân phố Hàng Mã bằng nan giang già và giấy dó cổ truyền, giao hàng an tâm bằng xe mui kín chuyên biệt.',
    imageUrl:
      'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&w=1000&q=80',
    linkUrl: '/bo-mau',
    linkText: 'Xem Các Bộ Mẫu Chuẩn',
    secondaryLinkUrl: '/tuy-chinh-mau/dan-tu-phu',
    secondaryLinkText: 'Tùy Biến Đàn Tứ Phủ',
    badge: 'MẪU NỔI BẬT NĂM NAY',
    cardTitle: 'Trọn Bộ Đàn Tứ Phủ Thượng Hạng',
    cardSubtitle: '5 Ngựa Ngũ Sắc · Thuyền Rồng · Mão Châu Sa · Nàng Chầu',
    cardPriceNote: 'Báo giá trực tiếp theo cấu hình',
  };

  return (
    <div className="w-full bg-[#FAF7F2] min-h-screen">
      {/* 1. HERO SLIDER SECTION (TRÀN VIỀN - TỐI GIẢN - TÔN VINH ẢNH BANNER NGUYÊN BẢN) */}
      <section
        className="w-full relative overflow-hidden bg-[#1E120D] transition-all duration-700 select-none group"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <BannerDisplay
          banner={activeBanner}
          isInteractive={false}
          isLivePreview={false}
        />

        {/* Floating Left/Right Arrows on Screen Edges */}
        {heroBanners.length > 1 && (
          <>
            <button
              onClick={() =>
                setCurrentSlide((prev) => (prev === 0 ? heroBanners.length - 1 : prev - 1))
              }
              className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-black/40 hover:bg-[#8B1E21] text-white border border-white/20 backdrop-blur-md flex items-center justify-center transition-all hover:scale-110 shadow-2xl"
              title="Banner trước"
              aria-label="Previous slide"
            >
              <ChevronLeft size={22} />
            </button>

            <button
              onClick={() => setCurrentSlide((prev) => (prev + 1) % heroBanners.length)}
              className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-black/40 hover:bg-[#8B1E21] text-white border border-white/20 backdrop-blur-md flex items-center justify-center transition-all hover:scale-110 shadow-2xl"
              title="Banner tiếp"
              aria-label="Next slide"
            >
              <ChevronRight size={22} />
            </button>

            {/* Bottom Slider Indicators */}
            <div className="absolute bottom-5 sm:bottom-7 inset-x-0 z-30 flex items-center justify-center gap-2.5">
              {heroBanners.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-2 transition-all duration-300 rounded-full ${
                    currentSlide === idx
                      ? 'w-10 sm:w-12 bg-[#C59B27] shadow-lg'
                      : 'w-2.5 bg-white/40 hover:bg-white/70'
                  }`}
                  aria-label={`Chuyển đến Slide ${idx + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </section>

      {/* 2. DANH MỤC SẢN PHẨM TRUYỀN THỐNG */}
      <section className="py-14 border-b border-[#E6DFD5] bg-[#FAF7F2]">
        <div className="max-w-[1320px] mx-auto px-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 border-b border-[#E6DFD5] pb-3">
            <div>
              <h2 className="font-serif text-[26px] sm:text-[30px] font-bold text-[#262626]">
                Danh Mục Sản Phẩm Truyền Thống
              </h2>
            </div>
            <Link
              to="/san-pham"
              className="text-[13px] text-[#8B1E21] font-semibold hover:underline flex items-center gap-1 mt-2 sm:mt-0"
            >
              <span>Xem toàn bộ lễ phẩm</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-5">
            {categories.map((cat) => (
              <Link
                key={cat._id}
                to={`/san-pham?category=${cat.slug}`}
                className="bg-white border border-[#E6DFD5] rounded-[6px] overflow-hidden hover:border-[#8B1E21] hover:shadow-lg transition-all group flex flex-col shadow-xs"
              >
                {/* Khung ảnh to hết không bo tròn tròn */}
                <div className="w-full aspect-[4/3] bg-[#FAF7F2] border-b border-[#E6DFD5] overflow-hidden relative">
                  <img
                    src={cat.image || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=400&q=80'}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                {/* Thông tin danh mục */}
                <div className="p-3.5 flex flex-col justify-between flex-1 bg-white text-left">
                  <div>
                    <h3 className="font-serif text-[14.5px] font-bold text-[#262626] group-hover:text-[#8B1E21] transition-colors line-clamp-1" title={cat.name}>
                      {cat.name}
                    </h3>
                    <p className="text-[11.5px] text-[#584140] mt-1 line-clamp-1">
                      {cat.description || (cat.productCount ? `${cat.productCount} sản phẩm sẵn có` : 'Linh phẩm thủ công')}
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-[#F4EFEB] flex items-center justify-between text-[11.5px] text-[#8B1E21] font-semibold">
                    <span>Xem chi tiết</span>
                    <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 3. BỘ MẪU HÀNG MÃ / ĐÀN TRÀNG TIÊU BIỂU */}
      <section className="py-16 border-b border-[#E6DFD5] bg-[#F4EFEB]">
        <div className="max-w-[1320px] mx-auto px-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 border-b border-[#E6DFD5] pb-3">
            <div>
              <h2 className="font-serif text-[26px] sm:text-[30px] font-bold text-[#262626]">
                Đàn Phủ Theo Khóa Lễ
              </h2>
            </div>
            <Link
              to="/bo-mau"
              className="text-[13px] text-[#8B1E21] font-semibold hover:underline flex items-center gap-1 mt-2 sm:mt-0"
            >
              <span>Xem tất cả đàn phủ ({templates.length})</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {templates.map((tpl) => (
              <div
                key={tpl._id}
                className="card-frame flex flex-col h-full bg-white group overflow-hidden shadow-sm hover:shadow-md transition-all"
              >
                {/* Image Container with 0.5rem inset */}
                <div className="p-2 bg-[#FAF7F2] relative overflow-hidden aspect-[4/3]">
                  <img
                    src={tpl.thumbnail || 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&w=600&q=80'}
                    alt={tpl.name}
                    className="w-full h-full object-cover rounded-[2px] transition-transform duration-300 group-hover:scale-[1.03]"
                    loading="lazy"
                  />
                  <span className="absolute top-3 left-3 seal-badge text-[10px]">
                    {tpl.category || 'QUY CHUẨN'}
                  </span>
                  <span className="absolute bottom-3 right-3 bg-black/75 backdrop-blur-xs text-white text-[10.5px] px-2 py-0.5 rounded font-mono font-medium">
                    {tpl.items?.length || 0} linh phẩm
                  </span>
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="text-[11px] font-semibold text-[#8C6D18] tracking-wider uppercase mb-1">
                      {tpl.subtitle || 'Bộ Mẫu Khóa Lễ Cổ Truyền'}
                    </div>
                    <Link to={`/bo-mau/${tpl.slug}`} className="block">
                      <h3 className="font-serif text-[16px] font-semibold text-[#262626] line-clamp-1 group-hover:text-[#8B1E21] transition-colors">
                        {tpl.name}
                      </h3>
                    </Link>
                    <p className="text-[12px] text-[#584140] mt-1 line-clamp-2 leading-relaxed">
                      {tpl.shortDescription || tpl.description || 'Chế tác nghiêm trang, thanh sạch, đúng lễ nghi cổ truyền.'}
                    </p>
                  </div>

                  <div className="pt-3 mt-3 border-t border-[#E6DFD5] flex items-center justify-between">
                    <div>
                      <div className="text-[11px] text-gray-500">Ước tính kinh phí</div>
                      <div className="flex items-baseline gap-1.5 mt-0.5">
                        {tpl.discountPrice && tpl.discountPrice > 0 ? (
                          <>
                            <span className="text-[15px] font-bold text-[#8B1E21]">
                              {Number(tpl.discountPrice).toLocaleString('vi-VN')} đ
                            </span>
                            {tpl.basePrice && tpl.basePrice > tpl.discountPrice && (
                              <span className="text-[11px] text-gray-400 line-through">
                                {Number(tpl.basePrice).toLocaleString('vi-VN')} đ
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-[15px] font-bold text-[#8B1E21]">
                            {tpl.basePrice && tpl.basePrice > 0
                              ? `${Number(tpl.basePrice).toLocaleString('vi-VN')} đ`
                              : 'Báo giá theo mẫu'}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Link
                        to={`/bo-mau/${tpl.slug}`}
                        className="px-2.5 py-1.5 border border-[#E6DFD5] rounded-[3px] text-[12px] font-medium text-[#3E2723] hover:bg-[#F9F4E8] hover:text-[#8B1E21] hover:border-[#8B1E21] transition-colors"
                        title="Xem chi tiết bộ mẫu"
                      >
                        Chi tiết
                      </Link>
                      <Link
                        to={`/tuy-chinh-mau/${tpl.slug}`}
                        className="px-2.5 py-1.5 bg-[#8B1E21] hover:bg-[#9E2A2B] text-white text-[12px] font-semibold rounded-[3px] flex items-center gap-1 transition-colors"
                        title="Tùy chỉnh bộ mẫu"
                      >
                        <SlidersHorizontal size={13} />
                        <span>Tùy Chỉnh</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link to="/bo-mau" className="btn-secondary px-8 py-3 text-[14px]">
              <span>Khám Phá Tất Cả Đàn Phủ</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* BANNER GIỮA TRANG (HOME_MIDDLE - Được quản lý bởi Admin) */}
      {middleBanners.length > 0 && (
        <section className="py-12 bg-[#FAF7F2] border-b border-[#E6DFD5]">
          <div className="max-w-[1320px] mx-auto px-4">
            {middleBanners.map((mb) => (
              <div
                key={mb._id}
                className="relative rounded-lg overflow-hidden bg-gradient-to-r from-[#3E2723] to-[#5E1315] text-white p-8 sm:p-12 shadow-lg flex flex-col md:flex-row items-center justify-between gap-8"
              >
                <div className="space-y-4 max-w-[700px]">
                  <div className="inline-block bg-[#C59B27] text-[#262626] font-bold text-xs uppercase px-3 py-1 rounded">
                    {mb.badge || 'XƯỞNG NGHỆ NHÂN HÀNG MÃ'}
                  </div>
                  <h3 className="font-serif text-2xl sm:text-3xl font-bold leading-tight">
                    {mb.title}
                  </h3>
                  <p className="text-gray-200 text-sm sm:text-base leading-relaxed">
                    {mb.description}
                  </p>
                  <div className="pt-2">
                    <Link
                      to={mb.linkUrl || '/tuy-chinh-mau/dan-tu-phu'}
                      className="inline-flex items-center gap-2 bg-[#C59B27] hover:bg-[#D8AF3B] text-[#262626] font-semibold text-sm px-6 py-3 rounded transition-all shadow hover:shadow-md"
                    >
                      <span>{mb.linkText || 'Gửi Yêu Cầu Chế Tác'}</span>
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>

                {mb.imageUrl && (
                  <div className="w-full md:w-80 h-52 rounded-md overflow-hidden border-2 border-[#C59B27]/60 shadow-md flex-shrink-0">
                    <img
                      src={mb.imageUrl}
                      alt={mb.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. SẢN PHẨM LẺ TIÊU BIỂU */}
      <section className="py-16 border-b border-[#E6DFD5]">
        <div className="max-w-[1320px] mx-auto px-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 border-b border-[#E6DFD5] pb-3">
            <div>
              <h2 className="font-serif text-[26px] sm:text-[30px] font-bold text-[#262626]">
                Lễ Phẩm Tiêu Biểu
              </h2>
            </div>
            <Link
              to="/san-pham"
              className="text-[13px] text-[#8B1E21] font-semibold hover:underline flex items-center gap-1 mt-2 sm:mt-0"
            >
              <span>Xem toàn bộ kho sản phẩm</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((prod) => (
              <ProductCard key={prod._id} product={prod} />
            ))}
          </div>
        </div>
      </section>

      {/* 5. ĐỊNH VỊ VỊ TRÍ XƯỞNG & CHỈ ĐƯỜNG GHÉ THĂM */}
      <section id="vi-tri-cua-hang" className="py-12 bg-[#FAF7F2] border-b border-[#E6DFD5] scroll-mt-16">
        <div className="max-w-[1320px] mx-auto px-4">
          <StoreLocationDirections variant="card" />
        </div>
      </section>

      {/* 6. BẢNG ĐĂNG KÝ TƯ VẤN & BÁO GIÁ ĐỒ MÃ TRỰC TIẾP TRÊN TRANG */}
      <ConsultationSection />
    </div>
  );
}
