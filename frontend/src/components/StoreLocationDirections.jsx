import React, { useState } from 'react';
import {
  MapPin,
  Compass,
  Navigation,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Clock,
  Phone,
  Store,
  Copy,
  Check,
  Truck,
  Car,
  ShieldCheck,
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import GoogleMapsPin from './GoogleMapsPin';
import GoogleRedPin from './GoogleRedPin';

export default function StoreLocationDirections({ variant = 'card', className = '' }) {
  const { settings } = useSettings();

  // Lấy địa chỉ xưởng/cửa hàng thực tế từ cấu hình hệ thống
  const storeAddress =
    settings?.address ||
    settings?.site_info?.address ||
    settings?.site_info?.workshopAddress ||
    'Xóm Miễu, Duyên Thái, Thường Tín, Hà Nội';

  const storeName =
    settings?.store_name ||
    settings?.site_info?.siteName ||
    'Tuyết Mã - Di Sản Thủ Công Thường Tín';

  const hotline = settings?.hotline || settings?.site_info?.hotline || '0396.163.773';
  const openHours = settings?.opening_hours || settings?.site_info?.openHours || '07:30 - 21:30 hàng ngày (Cả ngày rằm, mùng một và Lễ tết)';

  // Lấy tọa độ GPS cửa hàng do Admin cấu hình (nếu có)
  const storeLat = settings?.latitude
    ? String(settings.latitude).trim()
    : settings?.site_info?.latitude
    ? String(settings.site_info.latitude).trim()
    : '20.884508';

  const storeLng = settings?.longitude
    ? String(settings.longitude).trim()
    : settings?.site_info?.longitude
    ? String(settings.site_info.longitude).trim()
    : '105.869808';

  const hasStoreCoordinates = Boolean(
    storeLat &&
    storeLng &&
    !isNaN(Number(storeLat)) &&
    !isNaN(Number(storeLng))
  );

  // State vị trí người dùng
  const [userLocation, setUserLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const [copiedField, setCopiedField] = useState(null); // 'address' | 'gps' | null

  // Copy to clipboard helper
  const handleCopy = (text, field) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2500);
  };

  // Xử lý nút: 📍 Vị trí của tôi
  const handleGetMyLocation = () => {
    if (typeof window === 'undefined' || !navigator?.geolocation) {
      setStatusType('error');
      setStatusMessage('Trình duyệt của bạn không hỗ trợ định vị vị trí (Geolocation API).');
      return;
    }

    setLocating(true);
    setStatusType('loading');
    setStatusMessage('Đang xin quyền và xác định vị trí của bạn...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setUserLocation({
          lat: latitude,
          lng: longitude,
          accuracy: Math.round(accuracy || 0),
        });
        setLocating(false);
        setStatusType('success');
        setStatusMessage(
          `Đã định vị thành công vị trí của bạn (${latitude.toFixed(4)}, ${longitude.toFixed(4)}). Bấm "Chỉ đường" để mở ngay lộ trình nhanh nhất tới xưởng!`
        );
      },
      (error) => {
        setLocating(false);
        setStatusType('error');
        let errMsg = '';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errMsg =
              'Bạn chưa cấp quyền vị trí. Vui lòng cho phép quyền vị trí trên trình duyệt, hoặc bấm "Chỉ đường" để Google Maps tự định tuyến.';
            break;
          case error.POSITION_UNAVAILABLE:
            errMsg =
              'Không thể nhận tín hiệu GPS hiện tại. Quý khách có thể bấm trực tiếp "Chỉ đường" để mở Google Maps.';
            break;
          case error.TIMEOUT:
            errMsg =
              'Quá thời gian chờ lấy vị trí. Quý khách có thể bấm trực tiếp "Chỉ đường" để mở Google Maps.';
            break;
          default:
            errMsg =
              'Không thể xác định vị trí lúc này. Quý khách vẫn có thể bấm "Chỉ đường" để mở bản đồ bình thường.';
        }
        setStatusMessage(errMsg);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  // Xử lý nút: 🧭 Chỉ đường
  const handleGetDirections = () => {
    const destination = hasStoreCoordinates
      ? `${storeLat},${storeLng}`
      : encodeURIComponent(storeAddress);

    let mapsUrl = '';
    if (userLocation && userLocation.lat && userLocation.lng) {
      mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${destination}`;
    } else {
      mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
    }

    window.open(mapsUrl, '_blank', 'noopener,noreferrer');
  };

  // Google Maps Embed Iframe URL
  const embedMapUrl = hasStoreCoordinates
    ? `https://maps.google.com/maps?q=${storeLat},${storeLng}&hl=vi&z=15&output=embed`
    : `https://maps.google.com/maps?q=${encodeURIComponent(storeAddress)}&hl=vi&z=15&output=embed`;

  // --- 1. VARIANT COMPACT: Dành cho Footer / Contact row ---
  if (variant === 'compact') {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            id="btn-my-location-compact"
            type="button"
            onClick={handleGetMyLocation}
            disabled={locating}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF7F2]/10 hover:bg-[#FAF7F2]/20 text-[#E5B54F] border border-[#E5B54F]/40 hover:border-[#E5B54F] rounded text-[12px] font-semibold transition-all cursor-pointer shadow-2xs disabled:opacity-50"
            title="Xác định vị trí hiện tại của bạn"
          >
            {locating ? (
              <>
                <Loader2 size={13} className="animate-spin text-[#E5B54F]" />
                <span>Đang định vị...</span>
              </>
            ) : (
              <>
                <GoogleRedPin className="w-3.5 h-[17px]" />
                <span>Vị trí của tôi</span>
              </>
            )}
          </button>

          <button
            id="btn-get-directions-compact"
            type="button"
            onClick={handleGetDirections}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#8B1E21] hover:bg-[#A32427] text-white border border-[#A32427] rounded text-[12px] font-semibold transition-all cursor-pointer shadow-2xs hover:shadow-xs"
            title="Mở Google Maps chỉ đường tới xưởng"
          >
            <GoogleMapsPin className="w-3.5 h-3.5" />
            <span>Chỉ đường</span>
          </button>
        </div>

        {statusMessage && (
          <div
            className={`text-[11px] p-2 rounded flex items-start gap-1.5 leading-relaxed animate-fadeIn ${
              statusType === 'success'
                ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
                : statusType === 'error'
                ? 'bg-amber-950/60 border border-amber-500/40 text-amber-200'
                : 'bg-stone-900/60 border border-stone-600/40 text-stone-300'
            }`}
          >
            {statusType === 'success' ? (
              <CheckCircle2 size={13} className="shrink-0 mt-0.5 text-emerald-400" />
            ) : statusType === 'error' ? (
              <AlertCircle size={13} className="shrink-0 mt-0.5 text-amber-400" />
            ) : (
              <Loader2 size={13} className="shrink-0 mt-0.5 animate-spin text-stone-400" />
            )}
            <span>{statusMessage}</span>
          </div>
        )}
      </div>
    );
  }

  // --- 2. VARIANT CARD: KHỐI VỊ TRÍ & CHỈ ĐƯỜNG TO LỚN, ĐẲNG CẤP, KÈM BẢN ĐỒ GOOGLE MAPS TƯƠNG TÁC ---
  return (
    <div
      className={`bg-white border border-[#E6DFD5] rounded-2xl shadow-antique-card p-4 sm:p-6 lg:p-7 relative overflow-hidden ${className}`}
    >
      {/* Họa tiết trang trí góc mạ vàng đồng Di sản */}
      <div className="absolute top-0 right-0 w-44 h-44 bg-gradient-to-bl from-[#C59B27]/12 via-[#C59B27]/5 to-transparent pointer-events-none rounded-bl-full" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-stretch relative z-10">
        {/* ========================================================
            CỘT TRÁI: THÔNG TIN CHI TIẾT XƯỞNG & CÁC NÚT THAO TÁC
           ======================================================== */}
        <div className="lg:col-span-6 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            {/* Huy hiệu nghệ nhân */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="seal-badge !text-[10px] inline-flex items-center gap-1.5 shadow-2xs">
                <GoogleMapsPin className="w-3 h-4" />
                <span>ĐỊNH VỊ XƯỞNG NGHỆ NHÂN HÀ NỘI</span>
              </span>
              <span className="text-[12px] text-[#8C6D18] font-bold flex items-center gap-1 bg-[#FAF7F2] border border-[#E6DFD5] px-2.5 py-0.5 rounded-full">
                <Store size={13} className="text-[#8C6D18]" />
                <span>Ghé Thăm Trực Tiếp</span>
              </span>
            </div>

            {/* Tên xưởng / cơ sở */}
            <div>
              <h3 className="font-serif text-[24px] sm:text-[27px] font-bold text-[#262626] leading-tight">
                {storeName}
              </h3>
              <p className="text-[12px] text-[#7A6260] mt-1 font-medium">
                Kế thừa tinh hoa nghề vàng mã thủ công truyền thống làng Duyên Thái – Thường Tín
              </p>
            </div>

            {/* Khối thẻ thông tin địa chỉ & GPS */}
            <div className="space-y-3 bg-[#FAF7F2] p-4 rounded-xl border border-[#E6DFD5]">
              {/* Địa chỉ xưởng */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-white border border-[#E6DFD5] shadow-xs flex items-center justify-center shrink-0 mt-0.5 text-[#8B1E21]">
                    <MapPin size={17} />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-[#8C6D18] uppercase tracking-wider block">
                      Địa chỉ xưởng chế tác
                    </span>
                    <span className="text-[13.5px] font-semibold text-[#262626] leading-relaxed block mt-0.5">
                      {storeAddress}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopy(storeAddress, 'address')}
                  className="px-2 py-1 text-[11px] font-semibold text-[#8B1E21] hover:bg-white rounded-md border border-transparent hover:border-[#E6DFD5] transition-all flex items-center gap-1 shrink-0"
                  title="Sao chép địa chỉ"
                >
                  {copiedField === 'address' ? (
                    <>
                      <Check size={12} className="text-emerald-600" />
                      <span className="text-emerald-700">Đã chép</span>
                    </>
                  ) : (
                    <>
                      <Copy size={12} />
                      <span>Sao chép</span>
                    </>
                  )}
                </button>
              </div>

              {/* Tọa độ GPS */}
              {hasStoreCoordinates && (
                <div className="pt-2.5 border-t border-[#E6DFD5]/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-gray-500 font-medium">Tọa độ GPS:</span>
                    <span className="font-mono font-bold text-[#262626] bg-white px-2 py-0.5 rounded border border-[#E6DFD5]">
                      {storeLat}, {storeLng}
                    </span>
                    <span className="text-[10px] text-emerald-800 bg-emerald-100/70 px-1.5 py-0.5 rounded font-bold">
                      Tọa độ chuẩn
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopy(`${storeLat}, ${storeLng}`, 'gps')}
                    className="text-[11px] text-gray-500 hover:text-[#8B1E21] font-semibold flex items-center gap-1"
                  >
                    {copiedField === 'gps' ? (
                      <span className="text-emerald-600 font-bold">Đã chép GPS</span>
                    ) : (
                      <span>Sao chép GPS</span>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Giờ mở cửa & Hotline */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-[12.5px]">
              <div className="flex items-center gap-2.5 p-3 bg-white rounded-xl border border-[#E6DFD5] shadow-2xs">
                <Clock size={16} className="text-[#8C6D18] shrink-0" />
                <div>
                  <span className="text-[10.5px] text-gray-400 font-bold uppercase block">Tiếp đón trực tiếp</span>
                  <span className="font-semibold text-gray-800 text-[12px]">{openHours}</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-3 bg-white rounded-xl border border-[#E6DFD5] shadow-2xs">
                <Phone size={16} className="text-[#8B1E21] shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-[10.5px] text-gray-400 font-bold uppercase block">Hotline Thợ Cả</span>
                  <a
                    href={`tel:${hotline.replace(/\D/g, '')}`}
                    className="font-bold text-[#8B1E21] hover:underline text-[13px] block"
                  >
                    {hotline}
                  </a>
                </div>
                <a
                  href={`tel:${hotline.replace(/\D/g, '')}`}
                  className="px-2 py-1 bg-[#8B1E21]/10 hover:bg-[#8B1E21] text-[#8B1E21] hover:text-white rounded-lg text-[10.5px] font-bold transition-colors"
                >
                  Gọi ngay
                </a>
              </div>
            </div>

            {/* Tiện ích vận chuyển & Đỗ xe */}
            <div className="flex flex-wrap items-center gap-y-2 gap-x-5 text-[11.5px] text-gray-600 pt-1">
              <div className="flex items-center gap-1.5">
                <Truck size={14} className="text-emerald-700 shrink-0" />
                <span>Giao hàng mui kín chuyên dụng</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Car size={14} className="text-blue-700 shrink-0" />
                <span>Bãi đỗ ô tô, xe máy rộng rãi</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-amber-700 shrink-0" />
                <span>Đón tiếp chu đáo, tư vấn khoa nghi</span>
              </div>
            </div>
          </div>

          {/* Hàng nút bấm Hành Động Lớn (Vị trí của tôi & Chỉ đường Google Maps) */}
          <div className="space-y-3 pt-3 border-t border-[#E6DFD5]">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              {/* Nút 1: 📍 Vị trí của tôi */}
              <button
                id="btn-my-location"
                type="button"
                onClick={handleGetMyLocation}
                disabled={locating}
                className="w-full sm:flex-1 py-3 px-4 bg-white hover:bg-[#FAF7F2] text-[#8B1E21] border-2 border-[#8B1E21]/30 hover:border-[#8B1E21] rounded-xl text-xs sm:text-[13px] font-bold inline-flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-all active:scale-98 disabled:opacity-50"
                title="Xác định vị trí GPS thiết bị của bạn"
              >
                {locating ? (
                  <>
                    <Loader2 size={16} className="animate-spin text-[#8B1E21]" />
                    <span>Đang xác định GPS...</span>
                  </>
                ) : (
                  <>
                    <GoogleRedPin className="w-4 h-[19px]" />
                    <span>Vị trí của tôi</span>
                  </>
                )}
              </button>

              {/* Nút 2: 🧭 Chỉ đường Google Maps */}
              <button
                id="btn-get-directions"
                type="button"
                onClick={handleGetDirections}
                className="w-full sm:flex-1 py-3 px-5 bg-[#8B1E21] hover:bg-[#A32427] text-white border border-[#A32427] rounded-xl text-xs sm:text-[13px] font-bold inline-flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-lg transition-all active:scale-98"
                title="Mở Google Maps chỉ đường lộ trình nhanh nhất tới xưởng"
              >
                <GoogleMapsPin className="w-4 h-[20px]" />
                <span>Chỉ đường Google Maps</span>
                <ExternalLink size={13} className="opacity-90" />
              </button>
            </div>

            <p className="text-[11px] text-gray-500 text-center italic">
              * Tự động kết nối Google Maps trên điện thoại hoặc trình duyệt để dẫn đường chính xác
            </p>
          </div>

          {/* Thông báo trạng thái định vị */}
          {statusMessage && (
            <div
              className={`p-3 rounded-xl border text-[12px] flex items-start gap-2 leading-relaxed animate-fadeIn ${
                statusType === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : statusType === 'error'
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : 'bg-stone-50 border-stone-200 text-stone-700'
              }`}
            >
              {statusType === 'success' ? (
                <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-600" />
              ) : statusType === 'error' ? (
                <AlertCircle size={16} className="shrink-0 mt-0.5 text-amber-700" />
              ) : (
                <Loader2 size={16} className="shrink-0 mt-0.5 animate-spin text-stone-500" />
              )}
              <div className="flex-1 font-medium">{statusMessage}</div>
            </div>
          )}
        </div>

        {/* ========================================================
            CỘT PHẢI: BẢN ĐỒ GOOGLE MAPS TƯƠNG TÁC THỜI GIAN THỰC
           ======================================================== */}
        <div className="lg:col-span-6 flex flex-col">
          <div className="relative w-full h-[280px] sm:h-[360px] lg:h-full min-h-[260px] sm:min-h-[360px] rounded-2xl overflow-hidden border border-[#E6DFD5] shadow-lg bg-gray-100 flex flex-col">
            {/* Iframe Google Maps tương tác */}
            <iframe
              title="Bản đồ vị trí xưởng Tuyết Mã"
              src={embedMapUrl}
              className="w-full h-full border-0 absolute inset-0"
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />

            {/* Badge nổi góc trên bản đồ */}
            <div className="absolute top-3 left-3 right-3 sm:right-auto z-10 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl shadow-lg border border-[#E6DFD5] flex items-center gap-2.5">
              <GoogleMapsPin className="w-4 h-5 shrink-0" />
              <div className="truncate">
                <div className="text-xs font-bold text-gray-900 leading-tight truncate">
                  Xưởng Tuyết Mã
                </div>
                <div className="text-[10.5px] text-gray-500 truncate">
                  Duyên Thái, Thường Tín, Hà Nội
                </div>
              </div>
            </div>

            {/* Nút nổi góc dưới mở to Google Maps */}
            <button
              type="button"
              onClick={handleGetDirections}
              className="absolute bottom-3 right-3 z-10 bg-[#8B1E21] hover:bg-[#A32427] text-white px-3.5 py-2 rounded-xl shadow-xl text-xs font-bold flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Navigation size={13} />
              <span>Dẫn đường ↗</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
