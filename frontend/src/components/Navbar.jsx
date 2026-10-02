import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import { ShoppingCart, Search, Phone, User, Menu, X, ShieldCheck, Flame, SlidersHorizontal, Package, Layers, Sparkles, Loader2, ArrowRight, MapPin, Home, Landmark, Gift } from 'lucide-react';
import { formatVND } from '../utils/exportUtils';
import BrandLogo from './BrandLogo';
import NotificationBell from './NotificationBell';
import GoogleMapsPin from './GoogleMapsPin';
import StoreLocationDirections from './StoreLocationDirections';

export default function Navbar() {
  const { user, logout, isStaff } = useAuth();
  const { totalCount } = useCart();
  const { logoUrl } = useSettings();
  const [searchTerm, setSearchTerm] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [suggestions, setSuggestions] = useState({ products: [], categories: [], templates: [] });
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);

  const desktopSearchRef = useRef(null);
  const mobileSearchRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;

  const isRouteActive = (path) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(path);
  };

  // Debounced Live Search
  useEffect(() => {
    const trimmed = searchTerm.trim();
    if (!trimmed) {
      setSuggestions({ products: [], categories: [], templates: [] });
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setSearchLoading(true);
        const res = await fetch(`/api/products/quick-search?q=${encodeURIComponent(trimmed)}`);
        const data = await res.json();
        if (data.success) {
          setSuggestions({
            products: data.products || [],
            categories: data.categories || [],
            templates: data.templates || [],
          });
          setShowDropdown(true);
        }
      } catch (err) {
        console.error('Quick search error:', err);
      } finally {
        setSearchLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        desktopSearchRef.current &&
        !desktopSearchRef.current.contains(e.target) &&
        mobileSearchRef.current &&
        !mobileSearchRef.current.contains(e.target)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown & modal on route change
  useEffect(() => {
    setShowDropdown(false);
    setShowLocationModal(false);
  }, [pathname]);

  // Close modal on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setShowLocationModal(false);
    };
    if (showLocationModal) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showLocationModal]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setShowDropdown(false);
      navigate(`/san-pham?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const handleSelectProduct = (slug) => {
    setShowDropdown(false);
    navigate(`/san-pham/${slug}`);
  };

  const handleSelectCategory = (catSlug) => {
    setShowDropdown(false);
    navigate(`/san-pham?category=${catSlug}`);
  };

  const handleSelectTemplate = (slug) => {
    setShowDropdown(false);
    navigate(`/bo-mau/${slug}`);
  };

  const totalResults =
    suggestions.products.length + suggestions.categories.length + suggestions.templates.length;

  return (
    <header className="w-full bg-[#FAF7F2] border-b border-[#E6DFD5] sticky top-0 z-50 shadow-sticky-nav">
      {/* 1. TOP ANNOUNCEMENT BAR */}
      <div className="bg-[#3E2723] text-[#FAF7F2] text-[11px] sm:text-[12px] py-1.5 px-3 sm:px-4">
        <div className="max-w-[1320px] mx-auto flex flex-col sm:flex-row justify-between items-center gap-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 flex-wrap">
            <span className="seal-badge !bg-amber-300 !text-black !border-amber-400 font-bold text-[9px] sm:text-[10px] py-0.5">
              NGHỆ NHÂN HÀ NỘI
            </span>
            <span className="font-light tracking-wide text-[10.5px] sm:text-[12px]">
              Xưởng thủ công truyền thống Hàng Mã · Giao xe mui kín chuyên dụng
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-white font-medium shrink-0">
            <a href="tel:0396163773" className="flex items-center gap-1 hover:underline">
              <Phone size={12} /> Hotline Thợ Cả: <strong>0396.163.773</strong>
            </a>
          </div>
        </div>
      </div>

      {/* 2. MAIN BRAND HEADER */}
      <div className="max-w-[1320px] mx-auto px-3 sm:px-4 py-2.5 sm:py-3.5 flex items-center justify-between gap-2 sm:gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0 group py-0.5" title="Về trang chủ">
          <BrandLogo variant="light" />
        </Link>

        {/* Search Bar With Live Dropdown (Desktop) */}
        <div ref={desktopSearchRef} className="hidden lg:flex flex-1 max-w-[520px] relative">
          <form onSubmit={handleSearch} className="w-full relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => {
                if (searchTerm.trim() && totalResults > 0) setShowDropdown(true);
              }}
              placeholder="Tìm kiếm đồ lễ, hình nhân, ngựa ngũ sắc, tiền vàng, nhà giấy..."
              className="w-full bg-[#FFFFFF] border border-[#D5CCC1] text-[#262626] text-[13px] rounded-[4px] pl-4 pr-10 py-2 focus:outline-none focus:border-[#8B1E21] focus:ring-1 focus:ring-[#8B1E21] transition-all"
            />
            <button
              type="submit"
              className="absolute right-0 top-0 bottom-0 px-3 flex items-center justify-center text-[#8B1E21] hover:text-[#5E1315]"
            >
              {searchLoading ? <Loader2 size={18} className="animate-spin text-amber-700" /> : <Search size={18} />}
            </button>
          </form>

          {/* Instant Search Results Dropdown */}
          {showDropdown && searchTerm.trim() && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-[#E6DFD5] rounded-lg shadow-2xl z-50 overflow-hidden max-h-[460px] flex flex-col animate-dropdown">
              <div className="overflow-y-auto p-2 space-y-3 custom-scrollbar">
                {/* 1. Category suggestions */}
                {suggestions.categories.length > 0 && (
                  <div>
                    <div className="px-2.5 py-1 text-[11px] font-bold text-[#8C6D18] uppercase tracking-wider flex items-center gap-1.5">
                      <Layers size={13} />
                      <span>Danh mục phù hợp</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 px-2 pt-1">
                      {suggestions.categories.map((c) => (
                        <button
                          key={c._id}
                          type="button"
                          onClick={() => handleSelectCategory(c.slug)}
                          className="text-xs px-2.5 py-1 bg-[#FAF7F2] hover:bg-[#8B1E21] text-[#584140] hover:text-white rounded border border-[#E6DFD5] font-medium transition-colors"
                        >
                          {c.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Product suggestions */}
                {suggestions.products.length > 0 && (
                  <div>
                    <div className="px-2.5 py-1 text-[11px] font-bold text-[#8C6D18] uppercase tracking-wider flex items-center gap-1.5">
                      <Package size={13} />
                      <span>Sản phẩm ({suggestions.products.length})</span>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {suggestions.products.map((p) => {
                        const img = p.images && p.images[0] ? p.images[0] : '/logo.svg';
                        return (
                          <div
                            key={p._id}
                            onClick={() => handleSelectProduct(p.slug)}
                            className="flex items-center gap-3 p-2 hover:bg-[#FAF7F2] rounded cursor-pointer transition-colors group"
                          >
                            <img
                              src={img}
                              alt={p.name}
                              className="w-11 h-11 object-cover rounded border border-[#E6DFD5] bg-[#FAF7F2] shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-semibold text-[#262626] group-hover:text-[#8B1E21] truncate transition-colors">
                                {p.name}
                              </h4>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs font-bold text-[#8B1E21]">
                                  {formatVND(p.price)}
                                </span>
                                {p.category && (
                                  <span className="text-[10.5px] text-gray-500 bg-gray-100 px-1.5 py-0.2 rounded truncate max-w-[120px]">
                                    {p.category.name}
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className="text-[11px] text-[#8B1E21] opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                              Xem <ArrowRight size={12} />
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 3. Template suggestions */}
                {suggestions.templates.length > 0 && (
                  <div>
                    <div className="px-2.5 py-1 text-[11px] font-bold text-[#8C6D18] uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles size={13} />
                      <span>Bộ mẫu đàn lễ ({suggestions.templates.length})</span>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {suggestions.templates.map((t) => (
                        <div
                          key={t._id}
                          onClick={() => handleSelectTemplate(t.slug)}
                          className="flex items-center gap-3 p-2 hover:bg-[#FAF7F2] rounded cursor-pointer transition-colors group"
                        >
                          <img
                            src={t.thumbnail || '/logo.svg'}
                            alt={t.name}
                            className="w-11 h-11 object-cover rounded border border-[#E6DFD5] shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-semibold text-[#262626] group-hover:text-[#8B1E21] truncate">
                              {t.name}
                            </h4>
                            <p className="text-[11px] text-gray-500 truncate">{t.subtitle || 'Bộ mẫu quy chuẩn'}</p>
                          </div>
                          <span className="text-[11px] text-[#8B1E21] opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                            Chi tiết <ArrowRight size={12} />
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Empty state */}
                {!searchLoading && totalResults === 0 && (
                  <div className="py-6 text-center text-xs text-gray-500">
                    Không tìm thấy đồ lễ nào khớp với <strong>"{searchTerm}"</strong>
                  </div>
                )}
              </div>

              {/* View all button */}
              <button
                type="button"
                onClick={handleSearch}
                className="w-full py-2.5 bg-[#FAF7F2] hover:bg-[#F3ECE0] border-t border-[#E6DFD5] text-xs font-bold text-[#8B1E21] flex items-center justify-center gap-1 transition-colors"
              >
                <span>Xem tất cả kết quả cho "{searchTerm}"</span>
                <ArrowRight size={13} />
              </button>
            </div>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3 md:gap-5 shrink-0">
          {/* Notifications Bell */}
          <NotificationBell />

          {/* Cart */}
          <Link
            to="/gio-hang"
            className="relative flex items-center gap-1.5 text-[#3E2723] hover:text-[#8B1E21] p-1.5"
            title="Giỏ hàng"
          >
            <ShoppingCart size={22} />
            <span className="hidden md:inline text-[13px] font-medium">Giỏ hàng</span>
            {totalCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#8B1E21] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {totalCount}
              </span>
            )}
          </Link>

          {/* User Account / Auth */}
          {user ? (
            <div className="relative group py-1.5">
              <button
                type="button"
                className="flex items-center gap-2 text-[13px] text-[#3E2723] hover:text-[#8B1E21] py-1 cursor-pointer"
              >
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover border border-[#8B1E21]/20 shadow-xs shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#8B1E21] text-white flex items-center justify-center text-[12.5px] font-bold shadow-xs shrink-0">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="hidden md:inline font-medium max-w-[130px] truncate text-[#262626]">
                  {user.name}
                </span>
              </button>

              {/* Dropdown Menu - Seamless Smooth Hover & Bridge */}
              <div className="absolute right-0 top-full pt-1.5 w-56 z-50 transition-all duration-200 ease-out opacity-0 pointer-events-none translate-y-1 group-hover:opacity-100 group-hover:pointer-events-auto group-hover:translate-y-0">
                <div className="bg-white border border-[#E6DFD5] shadow-lg rounded-[6px] py-1.5 overflow-hidden">
                  <div className="px-3.5 py-2 border-b border-[#E6DFD5] bg-[#FAF7F2] flex items-center gap-2.5">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-8 h-8 rounded-full object-cover border border-[#8B1E21]/20 shadow-xs shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[#8B1E21] text-white flex items-center justify-center text-[12px] font-bold shadow-xs shrink-0">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-[12px] font-semibold text-[#262626] truncate">{user.name}</div>
                      <div className="text-[11px] text-[#584140] mt-0.5 truncate">
                        Vai trò: <strong className="text-[#8B1E21]">{user.role === 'ADMIN' ? 'Quản trị viên' : user.role === 'STAFF' ? 'Thợ cả xưởng' : 'Khách hàng'}</strong>
                      </div>
                    </div>
                  </div>
                  <Link
                    to="/tai-khoan"
                    className="flex items-center gap-2 px-3.5 py-2 text-[13px] hover:bg-[#F9F4E8] text-[#262626] font-medium transition-colors border-b border-[#F4EFEB]"
                  >
                    <User size={15} className="text-[#8B1E21]" />
                    <span>Tài khoản của tôi</span>
                  </Link>
                  <Link
                    to="/lich-su-don"
                    className="flex items-center gap-2 px-3.5 py-2 text-[13px] hover:bg-[#F9F4E8] text-[#262626] font-medium transition-colors"
                  >
                    <Package size={15} className="text-[#8B1E21]" />
                    <span>Lịch sử đơn & Yêu cầu</span>
                  </Link>
                  {isStaff && (
                    <Link
                      to="/admin"
                      className="block px-3.5 py-2 text-[13px] text-[#8B1E21] font-semibold hover:bg-[#F9F4E8] transition-colors border-t border-[#F4EFEB]"
                    >
                      ✦ Quản Trị Admin
                    </Link>
                  )}
                  <div className="border-t border-[#E6DFD5]/60 mt-1 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        navigate('/');
                      }}
                      className="w-full text-left px-3.5 py-1.5 text-[13px] text-red-600 hover:bg-red-50 font-medium transition-colors cursor-pointer"
                    >
                      Đăng xuất
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <Link
              to="/dang-nhap"
              className="flex items-center gap-1 text-[13px] font-medium text-[#3E2723] hover:text-[#8B1E21]"
            >
              <User size={18} />
              <span className="hidden md:inline">Đăng nhập</span>
            </Link>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden text-[#3E2723] p-1.5"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* 3. PRIMARY NAVIGATION BAR */}
      <nav className="bg-[#FAF7F2] border-t border-[#E6DFD5] hidden lg:block">
        <div className="max-w-[1320px] mx-auto px-4 flex items-center justify-between">
          <ul className="flex items-center gap-7 text-[13.5px] font-medium text-[#262626]">
            <li>
              <Link
                to="/"
                className={`py-2.5 inline-flex items-center gap-1.5 transition-colors border-b-2 group ${
                  isRouteActive('/')
                    ? 'text-[#8B1E21] font-bold border-[#8B1E21]'
                    : 'text-[#262626] hover:text-[#8B1E21] border-transparent hover:border-[#8B1E21]'
                }`}
              >
                <Home size={16} strokeWidth={2} className="text-[#8B1E21] shrink-0 group-hover:scale-110 transition-transform" />
                <span>Trang Chủ</span>
              </Link>
            </li>
            <li>
              <Link
                to="/bo-mau"
                className={`py-2.5 inline-flex items-center gap-1.5 transition-colors border-b-2 group ${
                  isRouteActive('/bo-mau')
                    ? 'text-[#8B1E21] font-bold border-[#8B1E21]'
                    : 'text-[#262626] hover:text-[#8B1E21] border-transparent hover:border-[#8B1E21]'
                }`}
              >
                <Landmark size={16} strokeWidth={2} className="text-[#8B1E21] shrink-0 group-hover:scale-110 transition-transform" />
                <span>Đàn Phủ</span>
              </Link>
            </li>
            <li>
              <Link
                to="/san-pham"
                className={`py-2.5 inline-flex items-center gap-1.5 transition-colors border-b-2 group ${
                  isRouteActive('/san-pham')
                    ? 'text-[#8B1E21] font-bold border-[#8B1E21]'
                    : 'text-[#262626] hover:text-[#8B1E21] border-transparent hover:border-[#8B1E21]'
                }`}
              >
                <Gift size={16} strokeWidth={2} className="text-[#8B1E21] shrink-0 group-hover:scale-110 transition-transform" />
                <span>Lễ Phẩm</span>
              </Link>
            </li>
            <li>
              <Link
                to="/tuy-chinh-mau/dan-tu-phu"
                className={`py-2.5 inline-flex items-center gap-1.5 transition-colors border-b-2 group ${
                  isRouteActive('/tuy-chinh-mau')
                    ? 'text-[#8B1E21] font-bold border-[#8B1E21]'
                    : 'text-[#262626] hover:text-[#8B1E21] border-transparent hover:border-[#8B1E21]'
                }`}
              >
                <SlidersHorizontal size={16} strokeWidth={2} className="text-[#8B1E21] shrink-0 group-hover:scale-110 transition-transform" />
                <span>Đặt Theo Yêu Cầu</span>
              </Link>
            </li>
            {/* CHỨC NĂNG VỊ TRÍ CỬA HÀNG VỚI ICON GIỐNG CHÂN TRANG */}
            <li>
              <button
                type="button"
                id="menu-store-location-btn"
                onClick={() => setShowLocationModal(true)}
                className="py-2.5 inline-flex items-center gap-1.5 transition-colors border-b-2 text-[#262626] hover:text-[#8B1E21] border-transparent hover:border-[#8B1E21] cursor-pointer group"
                title="Xem vị trí xưởng & chỉ đường Google Maps"
              >
                <MapPin size={17} strokeWidth={2.2} className="text-[#8B1E21] fill-[#8B1E21]/15 group-hover:scale-115 transition-all shrink-0" />
                <span className="font-semibold">Vị Trí Cửa Hàng</span>
              </button>
            </li>
            {isStaff && (
              <li>
                <Link
                  to="/admin"
                  className={`py-2.5 inline-flex items-center gap-1.5 transition-colors border-b-2 group ${
                    isRouteActive('/admin')
                      ? 'text-[#8B1E21] font-bold border-[#8B1E21]'
                      : 'text-[#584140] hover:text-[#8B1E21] border-transparent hover:border-[#8B1E21]'
                  }`}
                >
                  <ShieldCheck size={16} strokeWidth={2} className="text-[#8B1E21] shrink-0 group-hover:scale-110 transition-transform" />
                  <span>Quản Trị Admin</span>
                </Link>
              </li>
            )}
          </ul>

          <div className="text-[12px] text-[#584140] flex items-center gap-1.5">
            <Flame size={14} className="text-[#8B1E21]" />
            <span>Khai Đàn Mở Phủ · Tứ Phủ Vạn Linh</span>
          </div>
        </div>
      </nav>

      {/* MOBILE DRAWER */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-[#E6DFD5] px-4 py-3 space-y-3 animate-drawer-down max-h-[82vh] overflow-y-auto custom-scrollbar">
          <div ref={mobileSearchRef} className="relative">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => {
                  if (searchTerm.trim() && totalResults > 0) setShowDropdown(true);
                }}
                placeholder="Tìm kiếm đồ mã, mâm lễ..."
                className="w-full bg-[#FAF7F2] border border-[#D5CCC1] text-[13px] rounded-[4px] px-3 py-2 pr-9"
              />
              <button type="submit" className="absolute right-2 top-2.5 text-[#8B1E21]">
                {searchLoading ? <Loader2 size={16} className="animate-spin text-amber-700" /> : <Search size={16} />}
              </button>
            </form>

            {/* Mobile search dropdown */}
            {showDropdown && searchTerm.trim() && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#E6DFD5] rounded-lg shadow-xl z-50 overflow-hidden max-h-[350px] flex flex-col animate-dropdown">
                <div className="overflow-y-auto p-2 space-y-2.5 custom-scrollbar">
                  {suggestions.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1 px-1">
                      {suggestions.categories.map((c) => (
                        <button
                          key={c._id}
                          type="button"
                          onClick={() => {
                            setMobileMenuOpen(false);
                            handleSelectCategory(c.slug);
                          }}
                          className="text-[11px] px-2 py-0.5 bg-[#FAF7F2] text-[#8B1E21] rounded border border-[#E6DFD5] font-medium"
                        >
                          {c.name}
                        </button>
                      ))}
                    </div>
                  )}

                  {suggestions.products.length > 0 && (
                    <div className="divide-y divide-gray-100">
                      {suggestions.products.map((p) => (
                        <div
                          key={p._id}
                          onClick={() => {
                            setMobileMenuOpen(false);
                            handleSelectProduct(p.slug);
                          }}
                          className="flex items-center gap-2.5 py-1.5 px-1 cursor-pointer"
                        >
                          <img
                            src={p.images && p.images[0] ? p.images[0] : '/logo.svg'}
                            alt={p.name}
                            className="w-9 h-9 object-cover rounded border border-[#E6DFD5] shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-[#262626] truncate">{p.name}</div>
                            <div className="text-[11px] font-bold text-[#8B1E21]">{formatVND(p.price)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {!searchLoading && totalResults === 0 && (
                    <div className="py-4 text-center text-xs text-gray-500">
                      Không tìm thấy đồ lễ khớp
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    setMobileMenuOpen(false);
                    handleSearch(e);
                  }}
                  className="py-2 bg-[#FAF7F2] text-center text-xs font-bold text-[#8B1E21] border-t border-[#E6DFD5]"
                >
                  Xem tất cả kết quả
                </button>
              </div>
            )}
          </div>
          <div className="flex flex-col space-y-2 text-[14px]">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`py-2 flex items-center gap-2 border-b border-[#F4EFEB] ${
                isRouteActive('/') ? 'text-[#8B1E21] font-bold' : 'text-[#262626]'
              }`}
            >
              <Home size={16} strokeWidth={2} className="text-[#8B1E21] shrink-0" />
              <span>Trang Chủ</span>
            </Link>
            <Link
              to="/bo-mau"
              onClick={() => setMobileMenuOpen(false)}
              className={`py-2 flex items-center gap-2 border-b border-[#F4EFEB] ${
                isRouteActive('/bo-mau') ? 'text-[#8B1E21] font-bold' : 'text-[#262626]'
              }`}
            >
              <Landmark size={16} strokeWidth={2} className="text-[#8B1E21] shrink-0" />
              <span>Đàn Phủ</span>
            </Link>
            <Link
              to="/san-pham"
              onClick={() => setMobileMenuOpen(false)}
              className={`py-2 flex items-center gap-2 border-b border-[#F4EFEB] ${
                isRouteActive('/san-pham') ? 'text-[#8B1E21] font-bold' : 'text-[#262626]'
              }`}
            >
              <Gift size={16} strokeWidth={2} className="text-[#8B1E21] shrink-0" />
              <span>Lễ Phẩm</span>
            </Link>
            <Link
              to="/tuy-chinh-mau/dan-tu-phu"
              onClick={() => setMobileMenuOpen(false)}
              className={`py-2 flex items-center gap-2 border-b border-[#F4EFEB] ${
                isRouteActive('/tuy-chinh-mau') ? 'text-[#8B1E21] font-bold' : 'text-[#262626]'
              }`}
            >
              <SlidersHorizontal size={16} strokeWidth={2} className="text-[#8B1E21] shrink-0" />
              <span>Đặt Theo Yêu Cầu</span>
            </Link>
            {/* CHỨC NĂNG VỊ TRÍ TRÊN MOBILE MENU */}
            <button
              type="button"
              id="mobile-menu-store-location-btn"
              onClick={() => {
                setMobileMenuOpen(false);
                setShowLocationModal(true);
              }}
              className="py-2.5 flex items-center gap-2 border-b border-[#F4EFEB] text-[#262626] hover:text-[#8B1E21] font-semibold text-left cursor-pointer group"
            >
              <MapPin size={17} strokeWidth={2.2} className="text-[#8B1E21] fill-[#8B1E21]/15 transition-all shrink-0" />
              <span>Vị Trí Cửa Hàng & Chỉ Đường</span>
            </button>
            {isStaff && (
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className={`py-2 flex items-center gap-2 border-b border-[#F4EFEB] ${
                  isRouteActive('/admin') ? 'text-[#8B1E21] font-bold' : 'text-[#584140]'
                }`}
              >
                <ShieldCheck size={16} strokeWidth={2} className="text-[#8B1E21] shrink-0" />
                <span>Quản Trị Admin</span>
              </Link>
            )}
          </div>

            {user ? (
              <div className="pt-2 border-t border-[#E6DFD5] space-y-1.5">
                <div className="flex items-center gap-2.5 py-1">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-8 h-8 rounded-full object-cover border border-[#8B1E21]/20 shadow-xs shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[#8B1E21] text-white flex items-center justify-center text-[12px] font-bold shadow-xs shrink-0">
                      {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-[12px] text-[#584140] font-medium">
                      Xin chào, <strong className="text-[#8B1E21]">{user.name}</strong>
                    </div>
                  </div>
                </div>
                <Link
                  to="/tai-khoan"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 py-1.5 text-[13.5px] ${
                    isRouteActive('/tai-khoan') ? 'text-[#8B1E21] font-bold' : 'text-[#262626]'
                  }`}
                >
                  <User size={15} className="text-[#8B1E21]" />
                  <span>Tài khoản của tôi</span>
                </Link>
                <Link
                  to="/lich-su-don"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 py-1.5 text-[13.5px] ${
                    isRouteActive('/lich-su-don') ? 'text-[#8B1E21] font-bold' : 'text-[#262626]'
                  }`}
                >
                  <Package size={15} className="text-[#8B1E21]" />
                  <span>Lịch sử đơn & Yêu cầu</span>
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                    navigate('/');
                  }}
                  className="w-full text-left py-1.5 text-[13px] text-red-600 font-medium cursor-pointer"
                >
                  Đăng xuất
                </button>
              </div>
            ) : (
              <div className="pt-2 border-t border-[#E6DFD5]">
                <Link
                  to="/dang-nhap"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 py-2 text-[13.5px] font-semibold text-[#8B1E21]"
                >
                  <User size={16} />
                  <span>Đăng nhập / Đăng ký</span>
                </Link>
              </div>
            )}
          </div>
        )}

      {/* 4. MODAL VỊ TRÍ CỬA HÀNG & CHỈ ĐƯỜNG TRÊN THANH MENU */}
      {showLocationModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setShowLocationModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-5xl xl:max-w-6xl w-full max-h-[94vh] overflow-y-auto relative shadow-2xl border border-[#E6DFD5] animate-in zoom-in-95 duration-150 custom-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 flex items-center justify-between border-b border-[#E6DFD5] bg-[#FAF7F2] sticky top-0 z-20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white border border-[#E6DFD5] shadow-xs flex items-center justify-center shrink-0">
                  <GoogleMapsPin className="w-5 h-[26px]" />
                </div>
                <div>
                  <h3 className="font-serif text-[17px] sm:text-[20px] font-bold text-[#262626] leading-tight">
                    Vị Trí Cửa Hàng & Chỉ Đường Google Maps
                  </h3>
                  <p className="text-[11.5px] text-[#7A6260]">
                    Thông tin địa chỉ xưởng nghệ nhân, bản đồ GPS tương tác & hướng dẫn tuyến đường di chuyển
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowLocationModal(false)}
                className="text-gray-400 hover:text-[#8B1E21] p-2 rounded-xl hover:bg-white border border-transparent hover:border-[#E6DFD5] transition-all cursor-pointer"
                title="Đóng cửa sổ (ESC)"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 space-y-4">
              <StoreLocationDirections variant="card" className="!p-0 !border-0 !shadow-none" />

              <div className="pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500">
                <span>* Chỉ đường kết nối trực tiếp với ứng dụng Google Maps trên điện thoại hoặc trình duyệt máy tính.</span>
                <button
                  type="button"
                  onClick={() => {
                    setShowLocationModal(false);
                    if (pathname === '/') {
                      const el = document.getElementById('vi-tri-cua-hang');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    } else {
                      navigate('/#vi-tri-cua-hang');
                    }
                  }}
                  className="text-[#8B1E21] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <span>Xem khối xưởng trên Trang Chủ</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
