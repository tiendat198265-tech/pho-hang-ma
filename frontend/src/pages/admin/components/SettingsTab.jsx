import React, { useState, useEffect, useRef } from 'react';
import {
  Settings,
  Save,
  Loader2,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Shield,
  Upload,
  RotateCcw,
  Image as ImageIcon,
  CheckCircle,
  Type,
  Sparkles,
  Navigation,
  Compass,
} from 'lucide-react';
import { useSettings } from '../../../context/SettingsContext';
import BrandLogo from '../../../components/BrandLogo';
import GoogleRedPin from '../../../components/GoogleRedPin';
import GoogleMapsPin from '../../../components/GoogleMapsPin';

export default function SettingsTab({ token }) {
  const { refreshSettings: refreshGlobalSettings, setSettingsOptimistic } = useSettings();

  const [settings, setSettings] = useState({
    logo_type: 'TEXT',
    logo_text: 'TUYẾT MÃ',
    logo_highlight: '',
    logo_tagline: 'LÀNG NGHỀ THƯỜNG TÍN',
    logo_url: '/logo.png',
    store_name: 'Tuyết Mã - Di Sản Thủ Công Thường Tín',
    hotline: '0396.163.773',
    email: 'lienhe@phohangma.vn',
    address: 'Xóm Miễu, Duyên Thái, Thường Tín, Hà Nội',
    latitude: '',
    longitude: '',
    opening_hours: '08:00 - 21:30 hàng ngày (Cả ngày Rằm và Mùng 1)',
    bank_name: 'Ngân hàng TMCP Ngoại Thương Việt Nam (Vietcombank)',
    bank_account: '0011004868888',
    bank_owner: 'BÙI ĐỨC THẮNG',
    shipping_policy: 'Vận chuyển bằng ô tô tải mui kín chuyên biệt bảo vệ đồ mã nguyên vẹn',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [detectingGps, setDetectingGps] = useState(false);
  const [gpsMsg, setGpsMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const logoInputRef = useRef(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.success && data.data) {
        setSettings((prev) => ({
          ...prev,
          ...data.data,
          latitude: data.data.latitude !== undefined && data.data.latitude !== null ? String(data.data.latitude) : prev.latitude || '',
          longitude: data.data.longitude !== undefined && data.data.longitude !== null ? String(data.data.longitude) : prev.longitude || '',
          logo_type: data.data.logo_type || prev.logo_type || 'TEXT',
          logo_text: data.data.logo_text || prev.logo_text || 'TUYẾT MÃ',
          logo_highlight: data.data.logo_highlight || prev.logo_highlight || '',
          logo_tagline: data.data.logo_tagline || prev.logo_tagline || 'LÀNG NGHỀ THƯỜNG TÍN',
          logo_url: data.data.logo_url || prev.logo_url || '/logo.png',
        }));
      }
    } catch (err) {
      console.error('Lỗi tải cài đặt:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleUploadLogoFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingLogo(true);
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch('/api/banners/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      const uploadedUrl = data.imageUrl || data.url || data.data?.imageUrl || data.data?.url;

      if (data.success && uploadedUrl) {
        const updated = { ...settings, logo_url: uploadedUrl, logo_type: 'IMAGE' };
        setSettings(updated);
        if (setSettingsOptimistic) setSettingsOptimistic(updated);
      } else {
        alert(data.message || 'Lỗi tải ảnh logo lên máy chủ.');
      }
    } catch (err) {
      console.error('Lỗi upload logo:', err);
      alert('Không thể kết nối tải file logo.');
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const handleResetDefaultLogo = () => {
    const updated = { ...settings, logo_url: '/logo.png' };
    setSettings(updated);
    if (setSettingsOptimistic) setSettingsOptimistic(updated);
  };

  const handleQuickPreset = (text, highlight, tagline) => {
    const updated = {
      ...settings,
      logo_type: 'TEXT',
      logo_text: text,
      logo_highlight: highlight,
      logo_tagline: tagline,
    };
    setSettings(updated);
    if (setSettingsOptimistic) setSettingsOptimistic(updated);
  };

  const handleDetectAdminLocation = () => {
    if (typeof window === 'undefined' || !navigator?.geolocation) {
      alert('Trình duyệt của bạn không hỗ trợ định vị vị trí (Geolocation API).');
      return;
    }
    setDetectingGps(true);
    setGpsMsg('Đang lấy tọa độ GPS từ thiết bị Admin...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        setSettings((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lng,
        }));
        setDetectingGps(false);
        setGpsMsg(`Đã lấy tọa độ GPS thiết bị: ${lat}, ${lng}`);
        setTimeout(() => setGpsMsg(''), 4000);
      },
      (err) => {
        setDetectingGps(false);
        setGpsMsg('Không thể lấy tọa độ: ' + (err.message || 'Bị từ chối quyền truy cập'));
        setTimeout(() => setGpsMsg(''), 4000);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleTestGoogleMapsPreview = () => {
    const lat = settings.latitude ? String(settings.latitude).trim() : '';
    const lng = settings.longitude ? String(settings.longitude).trim() : '';
    const addr = settings.address ? String(settings.address).trim() : '';
    let target = '';
    if (lat && lng && !isNaN(Number(lat)) && !isNaN(Number(lng))) {
      target = `${lat},${lng}`;
    } else if (addr) {
      target = encodeURIComponent(addr);
    } else {
      alert('Vui lòng nhập địa chỉ hoặc tọa độ Latitude / Longitude trước khi kiểm tra.');
      return;
    }
    window.open(`https://www.google.com/maps/search/?api=1&query=${target}`, '_blank', 'noopener,noreferrer');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setSuccessMsg('');
      const res = await fetch('/api/settings/admin/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ settings }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg('Cập nhật logo và cấu hình website thành công!');
        if (setSettingsOptimistic) setSettingsOptimistic(settings);
        if (refreshGlobalSettings) refreshGlobalSettings();
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        alert(data.message || 'Lỗi khi lưu cài đặt');
      }
    } catch (err) {
      console.error('Lỗi lưu settings:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Cài Đặt Hệ Thống & Nhận Diện Thương Hiệu</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Tùy biến Logo dạng Chữ hoặc Hình ảnh hiển thị toàn trang web, thông tin hotline, địa chỉ xưởng và tài khoản
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin text-amber-600 mx-auto mb-2" />
          <span>Đang nạp cài đặt...</span>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-800 animate-fadeIn flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Group 0: LOGO & BRAND ASSETS (DẠNG CHỮ / HÌNH ẢNH) */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-3 gap-2">
              <div className="flex items-center gap-2">
                <Type className="w-5 h-5 text-[#8B1E21]" />
                <h3 className="text-sm font-bold text-gray-900 uppercase">
                  Kiểu Logo Thương Hiệu Website
                </h3>
              </div>
              <span className="text-[11px] text-gray-500">
                Hiển thị đồng bộ tại Header Navbar, Chân trang Footer & Menu Admin
              </span>
            </div>

            {/* Chọn Chế độ Logo: TEXT vs IMAGE */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  const updated = { ...settings, logo_type: 'TEXT' };
                  setSettings(updated);
                  if (setSettingsOptimistic) setSettingsOptimistic(updated);
                }}
                className={`p-3.5 rounded-lg border-2 text-left flex items-start gap-3 transition-all ${
                  settings.logo_type === 'TEXT'
                    ? 'border-[#8B1E21] bg-[#FAF7F2] shadow-xs'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0 ${
                    settings.logo_type === 'TEXT'
                      ? 'bg-[#8B1E21] text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <Type className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                    <span>1. Logo Dạng Chữ (Text Typography)</span>
                    <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.2 rounded font-semibold">
                      Đang dùng
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                    Sắc nét tuyệt đối trên mọi màn hình, tải tức thì 0ms, phong cách chữ ấn tượng như CellphoneS / Triện son cổ truyền.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  const updated = { ...settings, logo_type: 'IMAGE' };
                  setSettings(updated);
                  if (setSettingsOptimistic) setSettingsOptimistic(updated);
                }}
                className={`p-3.5 rounded-lg border-2 text-left flex items-start gap-3 transition-all ${
                  settings.logo_type === 'IMAGE'
                    ? 'border-[#8B1E21] bg-[#FAF7F2] shadow-xs'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0 ${
                    settings.logo_type === 'IMAGE'
                      ? 'bg-[#8B1E21] text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-900">
                    2. Logo Dạng Hình Ảnh (Image File)
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                    Sử dụng file ảnh PNG, SVG, JPG (như bức phù điêu gỗ hoa văn hoặc ảnh logo thiết kế sẵn).
                  </p>
                </div>
              </button>
            </div>

            {/* Chi Tiết Cấu Hình & Live Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
              {/* Cột Trái: LIVE PREVIEW (5 Cột) */}
              <div className="lg:col-span-5 space-y-3">
                <label className="block text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Xem trước trực tiếp (Live Preview):</span>
                </label>

                {/* Preview 1: Header Navbar (Nền sáng #FAF7F2) */}
                <div className="p-3.5 bg-[#FAF7F2] border border-[#E6DFD5] rounded-lg">
                  <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-2">
                    Thanh điều hướng (Header Navbar)
                  </span>
                  <div className="py-1">
                    <BrandLogo customData={settings} variant="light" />
                  </div>
                </div>

                {/* Preview 2: Footer (Nền tối #241712) */}
                <div className="p-3.5 bg-[#241712] border border-[#3D2920] rounded-lg">
                  <span className="text-[10px] font-bold text-[#E5B54F] uppercase tracking-wider block mb-2">
                    Chân trang (Footer Nền Tối)
                  </span>
                  <div className="py-1">
                    <BrandLogo customData={settings} variant="dark" />
                  </div>
                </div>
              </div>

              {/* Cột Phải: Các Ô Nhập Liệu (7 Cột) */}
              <div className="lg:col-span-7 space-y-4">
                {settings.logo_type === 'TEXT' ? (
                  /* Form cấu hình Logo dạng CHỮ */
                  <div className="space-y-3.5 bg-gray-50/70 p-4 rounded-lg border border-gray-200">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Tên logo thương hiệu (Chữ chính) *
                      </label>
                      <input
                        type="text"
                        value={settings.logo_text || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          const updated = { ...settings, logo_text: val };
                          setSettings(updated);
                          if (setSettingsOptimistic) setSettingsOptimistic(updated);
                        }}
                        placeholder="VD: TUYẾT MÃ hoặc PHỐ HÀNG MÃ..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-serif font-bold uppercase focus:outline-none focus:border-[#8B1E21]"
                        required
                      />
                      <span className="text-[11px] text-gray-500 mt-1 block">
                        Ký tự đầu tiên sẽ được tự động lồng vào con triện son truyền thống bên cạnh.
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Chữ nhấn mạnh (Phong cách CellphoneS)
                        </label>
                        <input
                          type="text"
                          value={settings.logo_highlight || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            const updated = { ...settings, logo_highlight: val };
                            setSettings(updated);
                            if (setSettingsOptimistic) setSettingsOptimistic(updated);
                          }}
                          placeholder="VD: MÃ, S, TM..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-bold uppercase focus:outline-none focus:border-[#8B1E21]"
                        />
                        <span className="text-[10px] text-gray-400 mt-0.5 block">
                          Tùy chọn: Chữ này sẽ nằm trong ô vuông bo góc nổi bật
                        </span>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Khẩu hiệu / Dòng phụ bên dưới
                        </label>
                        <input
                          type="text"
                          value={settings.logo_tagline || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            const updated = { ...settings, logo_tagline: val };
                            setSettings(updated);
                            if (setSettingsOptimistic) setSettingsOptimistic(updated);
                          }}
                          placeholder="VD: LÀNG NGHỀ THƯỜNG TÍN..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs tracking-wider uppercase focus:outline-none focus:border-[#8B1E21]"
                        />
                      </div>
                    </div>

                    {/* Mẫu gợi ý nhanh */}
                    <div className="pt-2">
                      <span className="text-[11px] font-semibold text-gray-600 block mb-1.5">
                        Chọn nhanh mẫu chữ thương hiệu:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleQuickPreset('TUYẾT MÃ', '', 'LÀNG NGHỀ THƯỜNG TÍN')}
                          className="px-2.5 py-1 bg-white hover:bg-red-50 text-[#8B1E21] border border-gray-300 hover:border-[#8B1E21] rounded text-[11px] font-semibold transition-colors"
                        >
                          ✦ Tuyết Mã (Làng Nghề Thường Tín)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickPreset('TUYẾT', 'MÃ', 'THƯỜNG TÍN - HÀ NỘI')}
                          className="px-2.5 py-1 bg-white hover:bg-red-50 text-[#8B1E21] border border-gray-300 hover:border-[#8B1E21] rounded text-[11px] font-semibold transition-colors"
                        >
                          ✦ Tuyết [MÃ] (Phong cách CellphoneS)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickPreset('PHỐ HÀNG MÃ', '', 'ĐỒ LỄ CỔ TRUYỀN')}
                          className="px-2.5 py-1 bg-white hover:bg-red-50 text-[#8B1E21] border border-gray-300 hover:border-[#8B1E21] rounded text-[11px] font-semibold transition-colors"
                        >
                          ✦ Phố Hàng Mã (Đồ Lễ Cổ Truyền)
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Form cấu hình Logo dạng HÌNH ẢNH */
                  <div className="space-y-3.5 bg-gray-50/70 p-4 rounded-lg border border-gray-200">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Đường dẫn URL ảnh logo:
                      </label>
                      <input
                        type="text"
                        value={settings.logo_url || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          const updated = { ...settings, logo_url: val };
                          setSettings(updated);
                          if (setSettingsOptimistic) setSettingsOptimistic(updated);
                        }}
                        placeholder="VD: /logo.png hoặc https://..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono focus:outline-none focus:border-amber-600"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      <input
                        type="file"
                        ref={logoInputRef}
                        onChange={handleUploadLogoFile}
                        accept="image/*"
                        className="hidden"
                      />

                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        disabled={uploadingLogo}
                        className="px-4 py-2 bg-[#8B1E21] hover:bg-[#9E2A2B] text-white text-xs font-bold rounded-lg flex items-center gap-2 shadow-xs transition-colors disabled:opacity-50"
                      >
                        {uploadingLogo ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Đang tải ảnh lên...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            <span>Tải Ảnh Mới Từ Máy Tính</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={handleResetDefaultLogo}
                        className="px-3.5 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors"
                        title="Đặt lại về file logo.png gốc của xưởng"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-gray-500" />
                        <span>Khôi phục logo mặc định</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Group 1: General Store Info */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-gray-900 uppercase border-b border-gray-100 pb-2">
              Thông Tin Liên Hệ & Xưởng Nghệ Nhân
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Tên thương hiệu cửa hàng
                </label>
                <input
                  type="text"
                  value={settings.store_name}
                  onChange={(e) => setSettings({ ...settings, store_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-600 font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Hotline tư vấn tâm linh & đặt đàn lễ
                </label>
                <input
                  type="text"
                  value={settings.hotline}
                  onChange={(e) => setSettings({ ...settings, hotline: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-600 font-mono font-bold text-primary-900"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Hòm thư điện tử (Email)
                </label>
                <input
                  type="email"
                  value={settings.email}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-600 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Thời gian mở cửa đón tiếp
                </label>
                <input
                  type="text"
                  value={settings.opening_hours}
                  onChange={(e) => setSettings({ ...settings, opening_hours: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-600"
                />
              </div>

              <div className="col-span-1 md:col-span-2">
                <label className="block font-semibold text-gray-700 mb-1">
                  Địa chỉ xưởng & cửa hàng trung tâm (Hiển thị văn bản)
                </label>
                <input
                  type="text"
                  value={settings.address}
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                  placeholder="VD: Xóm Miễu, Duyên Thái, Thường Tín, Hà Nội hoặc Số 48 Phố Hàng Mã, Hoàn Kiếm, Hà Nội"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-600"
                  required
                />
              </div>
            </div>

            {/* GPS Coordinates Section */}
            <div className="mt-3 p-4 bg-amber-50/60 border border-amber-200/80 rounded-lg space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold text-amber-950 flex items-center gap-1.5 uppercase">
                    <MapPin className="w-3.5 h-3.5 text-amber-700" />
                    <span>Tọa Độ GPS Vị Trí Cửa Hàng (Google Maps Navigation)</span>
                  </h4>
                  <p className="text-[11px] text-amber-800/80 mt-0.5">
                    Nút "🧭 Chỉ đường" trên website sẽ tự động dẫn đường khách hàng tới tọa độ này. Nếu để trống, Google Maps sẽ định vị theo địa chỉ văn bản phía trên.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDetectAdminLocation}
                    disabled={detectingGps}
                    className="px-2.5 py-1.5 bg-white border border-amber-300 hover:bg-amber-100/70 text-amber-900 rounded text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                    title="Lấy tọa độ vị trí hiện tại của thiết bị Admin"
                  >
                    {detectingGps ? (
                      <Loader2 className="w-3 h-3 animate-spin text-amber-700" />
                    ) : (
                      <GoogleRedPin className="w-3.5 h-4" />
                    )}
                    <span>Lấy GPS thiết bị</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleTestGoogleMapsPreview}
                    className="px-2.5 py-1.5 bg-[#8B1E21] hover:bg-[#9E2A2B] text-white rounded text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Mở Google Maps để kiểm tra vị trí xem đã chuẩn chưa"
                  >
                    <GoogleMapsPin className="w-3.5 h-[18px]" />
                    <span>Xem thử Google Maps</span>
                  </button>
                </div>
              </div>

              {gpsMsg && (
                <div className="text-[11px] font-medium text-amber-900 bg-white/80 px-2.5 py-1 rounded border border-amber-200">
                  {gpsMsg}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Vĩ độ (Latitude):
                  </label>
                  <input
                    type="text"
                    value={settings.latitude || ''}
                    onChange={(e) => setSettings({ ...settings, latitude: e.target.value })}
                    placeholder="VD: 20.884500 (Thường Tín) hoặc 21.036600 (Hoàn Kiếm)"
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg font-mono text-gray-800 focus:outline-none focus:border-amber-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Kinh độ (Longitude):
                  </label>
                  <input
                    type="text"
                    value={settings.longitude || ''}
                    onChange={(e) => setSettings({ ...settings, longitude: e.target.value })}
                    placeholder="VD: 105.869000 (Thường Tín) hoặc 105.849200 (Hoàn Kiếm)"
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg font-mono text-gray-800 focus:outline-none focus:border-amber-600"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Group 2: Payment & Bank Transfer Details */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-gray-900 uppercase border-b border-gray-100 pb-2">
              Tài Khoản Nhận Chuyển Khoản Ngân Hàng
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Tên ngân hàng
                </label>
                <input
                  type="text"
                  value={settings.bank_name}
                  onChange={(e) => setSettings({ ...settings, bank_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-600"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Số tài khoản nhận tiền
                </label>
                <input
                  type="text"
                  value={settings.bank_account}
                  onChange={(e) => setSettings({ ...settings, bank_account: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono font-bold text-gray-900 focus:outline-none focus:border-amber-600"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Chủ tài khoản (Người đại diện)
                </label>
                <input
                  type="text"
                  value={settings.bank_owner}
                  onChange={(e) => setSettings({ ...settings, bank_owner: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg font-bold text-gray-900 focus:outline-none focus:border-amber-600"
                  required
                />
              </div>
            </div>
          </div>

          {/* Group 3: Shipping Policy */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-gray-900 uppercase border-b border-gray-100 pb-2">
              Chính Sách Vận Chuyển Đồ Mã Chuyên Biệt
            </h3>

            <div className="text-xs">
              <label className="block font-semibold text-gray-700 mb-1">
                Ghi chú chính sách vận chuyển (Hiển thị tại trang thanh toán)
              </label>
              <textarea
                rows="2"
                value={settings.shipping_policy}
                onChange={(e) => setSettings({ ...settings, shipping_policy: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-600"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-amber-400 hover:bg-amber-500 text-black text-xs font-bold rounded-lg shadow-sm flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Lưu Cấu Hình Cửa Hàng</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
