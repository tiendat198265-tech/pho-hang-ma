import React, { useState, useEffect, useRef } from 'react';
import {
  Image as ImageIcon,
  Plus,
  Edit,
  Trash2,
  Loader2,
  UploadCloud,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Layers,
  Monitor,
  Laptop,
  Tablet,
  Smartphone,
  Maximize2,
  RotateCcw,
  Sparkles,
  Crosshair,
  X,
  Eye,
  Calendar,
  Clock,
  HelpCircle,
  ZoomIn,
  ZoomOut,
  Lock,
  Unlock,
  Move,
  Scan,
  AlertTriangle,
  Sliders,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Check,
} from 'lucide-react';
import ConfirmModal from './ConfirmModal';
import BannerDisplay from '../../../components/BannerDisplay';

export default function BannersTab({ token }) {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('CREATE');
  const [editingId, setEditingId] = useState(null);

  // Initial Form State
  const initialFormData = {
    title: '',
    subtitle: '',
    description: '',
    linkText: '',
    linkUrl: '/bo-mau',
    secondaryLinkText: '',
    secondaryLinkUrl: '',
    imageUrl: '',
    mobileImageUrl: '',
    position: 'HOME_HERO',
    badge: '',
    isActive: true,
    sortOrder: 1,
    scheduleType: 'NOW',
    startDate: '',
    endDate: '',
    overlay: false,
    overlayOpacity: 30,
    isPureImage: false,
    aspectRatio: 2.63,
    customRatioWidth: 1920,
    customRatioHeight: 800,
    heightSize: 'LARGE',
    customHeight: '',
    zoomX: 100,
    zoomY: 100,
    positionX: 0,
    positionY: 0,
    focalPoint: 'center',
    fitMode: 'cover',
    bgStyle: 'blur',
    lockAspectRatio: true,
  };

  const [formData, setFormData] = useState(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Upload Refs & States
  const desktopInputRef = useRef(null);
  const mobileInputRef = useRef(null);
  const [uploadingDesktop, setUploadingDesktop] = useState(false);
  const [uploadingMobile, setUploadingMobile] = useState(false);

  // Image Aspect Ratio Warning
  const [naturalImageDimensions, setNaturalImageDimensions] = useState({ width: 0, height: 0, ratio: 0 });
  const [ratioMismatchWarning, setRatioMismatchWarning] = useState(null);

  // Preview & Interactive Settings
  const [previewDevice, setPreviewDevice] = useState('DESKTOP'); // 'DESKTOP' | 'LAPTOP' | 'TABLET' | 'MOBILE'
  const [showFocalPointPicker, setShowFocalPointPicker] = useState(false);
  const [showFullscreenPreview, setShowFullscreenPreview] = useState(false);

  // Delete Confirmation
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Custom Ratio active tab
  const [isCustomRatio, setIsCustomRatio] = useState(false);

  // Helper Toast
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch Banners from API
  const fetchBanners = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/banners/admin', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setBanners(data.data);
      }
    } catch (err) {
      console.error('Lỗi tải banner:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  // Check image natural dimensions and inspect ratio mismatch
  useEffect(() => {
    const targetUrl = previewDevice === 'MOBILE' && formData.mobileImageUrl
      ? formData.mobileImageUrl
      : formData.imageUrl;

    if (!targetUrl) {
      setNaturalImageDimensions({ width: 0, height: 0, ratio: 0 });
      setRatioMismatchWarning(null);
      return;
    }

    const img = new Image();
    img.onload = () => {
      const nw = img.naturalWidth || 1920;
      const nh = img.naturalHeight || 800;
      const naturalRatio = Number((nw / nh).toFixed(2));
      setNaturalImageDimensions({ width: nw, height: nh, ratio: naturalRatio });

      // Compare natural ratio with current banner aspectRatio
      const diff = Math.abs(naturalRatio - Number(formData.aspectRatio));
      if (diff > 0.65) {
        setRatioMismatchWarning(
          `Ảnh gốc có tỷ lệ ${naturalRatio}:1 (${nw}×${nh}px), trong khi khung banner đang chọn là ${Number(formData.aspectRatio).toFixed(2)}:1. Một phần ảnh sẽ bị cắt (crop). Bạn có thể kéo ảnh trực tiếp trong khung Preview để chọn góc đẹp nhất.`
        );
      } else {
        setRatioMismatchWarning(null);
      }
    };
    img.src = targetUrl;
  }, [formData.imageUrl, formData.mobileImageUrl, formData.aspectRatio, previewDevice]);

  // Keyboard shortcut ESC for fullscreen preview
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showFullscreenPreview) {
        setShowFullscreenPreview(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showFullscreenPreview]);

  // Zoom Controls
  const handleZoomStep = (delta) => {
    setFormData((prev) => {
      const currentZoom = prev.zoomX || 100;
      const nextZoom = Math.min(Math.max(currentZoom + delta, 20), 300);
      if (prev.lockAspectRatio !== false) {
        return { ...prev, zoomX: nextZoom, zoomY: nextZoom };
      }
      return { ...prev, zoomX: nextZoom };
    });
  };

  const handleUnifiedZoom = (val) => {
    const num = Number(val);
    setFormData((prev) => ({
      ...prev,
      zoomX: num,
      zoomY: prev.lockAspectRatio !== false ? num : prev.zoomY,
    }));
  };

  // Nút ĐẶT LẠI (Reset toàn bộ thông số crop & zoom về mặc định không ảnh hưởng dữ liệu khác)
  const handleResetAdjustments = () => {
    setFormData((prev) => ({
      ...prev,
      zoomX: 100,
      zoomY: 100,
      positionX: 0,
      positionY: 0,
      fitMode: 'cover',
      aspectRatio: 2.63,
      focalPoint: 'center',
      lockAspectRatio: true,
    }));
    setIsCustomRatio(false);
    showToast('Đã đặt lại Zoom về 100%, vị trí X/Y về 0 và khung về mặc định!');
  };

  // Tự động căn đẹp (Auto-fit thông minh dựa vào ảnh gốc)
  const handleAutoSmartFit = () => {
    const targetUrl = formData.imageUrl || formData.mobileImageUrl;
    if (!targetUrl) return;

    if (naturalImageDimensions.ratio > 0) {
      const clampedRatio = Math.min(Math.max(naturalImageDimensions.ratio, 1.2), 3.5);
      setFormData((prev) => ({
        ...prev,
        aspectRatio: clampedRatio,
        zoomX: 100,
        zoomY: 100,
        positionX: 0,
        positionY: 0,
        focalPoint: 'center',
        fitMode: 'cover',
      }));
      showToast(`Đã tự động căn đẹp theo tỷ lệ ảnh gốc (${clampedRatio}:1)!`);
    } else {
      const img = new Image();
      img.onload = () => {
        const rawRatio = Number((img.naturalWidth / img.naturalHeight).toFixed(2));
        const clampedRatio = Math.min(Math.max(rawRatio, 1.2), 3.5);
        setFormData((prev) => ({
          ...prev,
          aspectRatio: clampedRatio,
          zoomX: 100,
          zoomY: 100,
          positionX: 0,
          positionY: 0,
          focalPoint: 'center',
          fitMode: 'cover',
        }));
        showToast(`Đã tự động căn đẹp theo tỷ lệ ảnh gốc (${clampedRatio}:1)!`);
      };
      img.src = targetUrl;
    }
  };

  // Căn nhanh các hướng
  const handleAlign = (type) => {
    switch (type) {
      case 'center':
        setFormData((prev) => ({ ...prev, positionX: 0, positionY: 0, focalPoint: 'center' }));
        break;
      case 'left':
        setFormData((prev) => ({ ...prev, positionX: -80, focalPoint: 'left center' }));
        break;
      case 'right':
        setFormData((prev) => ({ ...prev, positionX: 80, focalPoint: 'right center' }));
        break;
      case 'top':
        setFormData((prev) => ({ ...prev, positionY: -60, focalPoint: 'center top' }));
        break;
      case 'bottom':
        setFormData((prev) => ({ ...prev, positionY: 60, focalPoint: 'center bottom' }));
        break;
      default:
        break;
    }
  };

  // Xử lý Custom Aspect Ratio
  const handleCustomRatioChange = (w, h) => {
    const numW = Math.max(Number(w) || 1, 1);
    const numH = Math.max(Number(h) || 1, 1);
    const calculatedRatio = Number((numW / numH).toFixed(2));
    setFormData((prev) => ({
      ...prev,
      customRatioWidth: numW,
      customRatioHeight: numH,
      aspectRatio: calculatedRatio,
    }));
  };

  // Mở modal tạo mới
  const handleOpenCreate = () => {
    setModalMode('CREATE');
    setEditingId(null);
    setFormData({
      ...initialFormData,
      sortOrder: banners.length + 1,
    });
    setFormError(null);
    setPreviewDevice('DESKTOP');
    setIsCustomRatio(false);
    setIsModalOpen(true);
  };

  // Mở modal chỉnh sửa
  const handleOpenEdit = (b) => {
    setModalMode('EDIT');
    setEditingId(b._id);
    const zX = b.zoomX !== undefined ? Number(b.zoomX) : 100;
    const zY = b.zoomY !== undefined ? Number(b.zoomY) : 100;
    const isCustom = b.customRatioWidth > 0 && b.customRatioHeight > 0;

    setFormData({
      title: b.title || '',
      subtitle: b.subtitle || '',
      description: b.description || '',
      linkText: b.linkText || '',
      linkUrl: b.linkUrl || '',
      secondaryLinkText: b.secondaryLinkText || '',
      secondaryLinkUrl: b.secondaryLinkUrl || '',
      imageUrl: b.imageUrl || '',
      mobileImageUrl: b.mobileImageUrl || '',
      position: b.position || 'HOME_HERO',
      badge: b.badge || '',
      isActive: b.isActive !== false,
      sortOrder: b.sortOrder || 1,
      scheduleType: b.scheduleType || 'NOW',
      startDate: b.startDate ? new Date(b.startDate).toISOString().slice(0, 16) : '',
      endDate: b.endDate ? new Date(b.endDate).toISOString().slice(0, 16) : '',
      overlay: Boolean(b.overlay),
      overlayOpacity: b.overlayOpacity !== undefined ? Number(b.overlayOpacity) : 30,
      isPureImage: Boolean(b.isPureImage),
      aspectRatio: b.aspectRatio !== undefined ? Number(b.aspectRatio) : 2.63,
      customRatioWidth: b.customRatioWidth || 1920,
      customRatioHeight: b.customRatioHeight || 800,
      heightSize: b.heightSize || 'LARGE',
      customHeight: b.customHeight || '',
      zoomX: zX,
      zoomY: zY,
      positionX: b.positionX !== undefined ? Number(b.positionX) : 0,
      positionY: b.positionY !== undefined ? Number(b.positionY) : 0,
      focalPoint: b.focalPoint || 'center',
      fitMode: b.fitMode || 'cover',
      bgStyle: b.bgStyle || 'blur',
      lockAspectRatio: zX === zY,
    });
    setIsCustomRatio(isCustom);
    setFormError(null);
    setPreviewDevice('DESKTOP');
    setIsModalOpen(true);
  };

  // Upload ảnh an toàn với instant preview và validation
  const handleUpload = async (e, type = 'desktop') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Kiểm tra định dạng
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/svg+xml'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png|webp|gif|avif|svg)$/i)) {
      alert('Định dạng không hỗ trợ! Vui lòng chọn ảnh định dạng JPG, PNG, WEBP, GIF hoặc AVIF.');
      return;
    }

    // 2. Kiểm tra dung lượng (Max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Ảnh có dung lượng quá lớn (vượt quá 10MB). Vui lòng chọn ảnh nhẹ hơn để tải trang nhanh nhất.');
      return;
    }

    // 3. Instant local preview
    const localBlobUrl = URL.createObjectURL(file);
    if (type === 'desktop') {
      setFormData((prev) => ({ ...prev, imageUrl: localBlobUrl }));
    } else {
      setFormData((prev) => ({ ...prev, mobileImageUrl: localBlobUrl }));
    }

    // 4. Upload lên máy chủ
    try {
      if (type === 'desktop') setUploadingDesktop(true);
      else setUploadingMobile(true);

      const uploadData = new FormData();
      uploadData.append('image', file);

      const res = await fetch('/api/banners/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: uploadData,
      });
      const data = await res.json();
      const uploadedUrl = data.imageUrl || data.url || data.data?.imageUrl || data.data?.url;

      if (data.success && uploadedUrl) {
        if (type === 'desktop') {
          setFormData((prev) => ({ ...prev, imageUrl: uploadedUrl }));
          showToast('Đã tải ảnh Desktop lên máy chủ thành công!');
        } else {
          setFormData((prev) => ({ ...prev, mobileImageUrl: uploadedUrl }));
          showToast('Đã tải ảnh Mobile lên máy chủ thành công!');
        }
      } else {
        alert(data.message || 'Lỗi tải ảnh lên máy chủ, vui lòng thử lại.');
      }
    } catch (err) {
      console.error('Lỗi upload banner:', err);
      alert('Không thể kết nối đến máy chủ khi tải ảnh.');
    } finally {
      if (type === 'desktop') {
        setUploadingDesktop(false);
        if (desktopInputRef.current) desktopInputRef.current.value = '';
      } else {
        setUploadingMobile(false);
        if (mobileInputRef.current) mobileInputRef.current.value = '';
      }
    }
  };

  // Submit banner to API
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Tiêu đề bắt buộc nếu không ở chế độ thuần ảnh
    if (!formData.title.trim() && !formData.isPureImage) {
      setFormError('Vui lòng nhập tiêu đề banner hoặc bật chế độ "Banner ảnh thuần"');
      return;
    }

    if (!formData.imageUrl.trim()) {
      setFormError('Vui lòng tải lên ảnh Desktop cho banner');
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);

      const payload = {
        ...formData,
        // Nếu là banner ảnh thuần mà chưa có tiêu đề thì gán tiêu đề mặc định
        title: formData.title.trim() || 'Banner Ảnh Thuần',
        startDate: formData.startDate ? new Date(formData.startDate) : null,
        endDate: formData.endDate ? new Date(formData.endDate) : null,
      };

      const url = modalMode === 'CREATE' ? '/api/banners/admin' : `/api/banners/admin/${editingId}`;
      const method = modalMode === 'CREATE' ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const result = await res.json();

      if (result.success) {
        setIsModalOpen(false);
        fetchBanners();
        showToast(modalMode === 'CREATE' ? 'Đã tạo banner mới thành công!' : 'Đã cập nhật banner thành công!');
      } else {
        setFormError(result.message || 'Lỗi khi lưu banner');
      }
    } catch (err) {
      console.error('Lỗi submit banner:', err);
      setFormError('Lỗi kết nối máy chủ');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle active banner
  const handleToggleActive = async (id) => {
    try {
      const res = await fetch(`/api/banners/admin/${id}/toggle`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (result.success) {
        fetchBanners();
        showToast(result.message || 'Đã thay đổi trạng thái banner');
      }
    } catch (err) {
      console.error('Lỗi toggle banner:', err);
    }
  };

  // Delete banner
  const handleConfirmDelete = async () => {
    try {
      const res = await fetch(`/api/banners/admin/${deletingId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (result.success) {
        setDeleteConfirmOpen(false);
        setDeletingId(null);
        fetchBanners();
        showToast('Đã xóa banner thành công');
      } else {
        alert(result.message || 'Không thể xóa banner');
      }
    } catch (err) {
      console.error('Lỗi xóa banner:', err);
    }
  };

  // Simulation device widths
  const deviceConfig = {
    DESKTOP: { label: 'Desktop', widthLabel: 'Khung rộng 1920px (Desktop / Màn hình lớn)', containerStyle: { width: '100%' } },
    LAPTOP: { label: 'Laptop', widthLabel: 'Khung rộng 1366px (Laptop chuẩn)', containerStyle: { width: '92%', margin: '0 auto' } },
    TABLET: { label: 'Tablet', widthLabel: 'Khung rộng 768px (iPad / Máy tính bảng)', containerStyle: { width: '75%', margin: '0 auto' } },
    MOBILE: { label: 'Mobile', widthLabel: 'Khung rộng 375px (Điện thoại thông minh)', containerStyle: { width: '380px', maxWidth: '100%', margin: '0 auto' } },
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[100] bg-emerald-800 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-semibold animate-slideUp">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#8B1E21]" />
            <h2 className="text-lg font-bold text-gray-900">CMS Banner Trang Chủ</h2>
            <span className="text-[11px] bg-amber-50 text-[#8C6D18] border border-amber-200 px-2 py-0.5 rounded-full font-semibold">
              Live Preview Chuẩn 100%
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Hệ thống quản lý, cắt crop trực tiếp, căn chỉnh tỉ lệ và live preview thời gian thực cho trang chủ Phố Hàng Mã.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-[#8B1E21] hover:bg-[#A32427] text-white text-xs font-bold rounded-xl shadow-sm hover:shadow-md transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Banner Mới</span>
        </button>
      </div>

      {/* Grid Danh Sách Banner Hiện Có */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {loading ? (
          <div className="col-span-2 py-16 text-center text-gray-400">
            <Loader2 className="w-7 h-7 animate-spin text-[#8B1E21] mx-auto mb-2" />
            <span className="text-xs font-medium">Đang tải danh sách banner...</span>
          </div>
        ) : banners.length === 0 ? (
          <div className="col-span-2 py-12 text-center text-gray-400 bg-white rounded-2xl border border-gray-200">
            Chưa có banner nào được tạo. Nhấp "Thêm Banner Mới" để bắt đầu.
          </div>
        ) : (
          banners.map((b) => (
            <div
              key={b._id}
              className={`bg-white rounded-2xl border shadow-xs overflow-hidden flex flex-col justify-between transition-all group ${
                b.isActive ? 'border-gray-200 hover:border-amber-500 hover:shadow-md' : 'border-gray-200 opacity-65'
              }`}
            >
              {/* Thumbnail hiển thị theo đúng logic render chuẩn */}
              <div className="relative h-48 bg-[#1E120D] overflow-hidden">
                <BannerDisplay
                  banner={b}
                  isInteractive={false}
                  isLivePreview={true}
                  aspectRatioOverride={2.63}
                  showDragHint={false}
                />

                {/* Status Badges on card */}
                <div className="absolute top-3 inset-x-3 z-30 flex items-center justify-between pointer-events-none">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#8B1E21] text-white shadow-md uppercase tracking-wider">
                    {b.position === 'HOME_HERO' ? 'Đầu Trang (Hero)' : 'Giữa Trang (Middle)'}
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleActive(b._id);
                    }}
                    className={`pointer-events-auto px-2.5 py-1 rounded-full text-[10.5px] font-bold shadow-md transition-all ${
                      b.isActive
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-gray-700 hover:bg-gray-800 text-gray-200'
                    }`}
                  >
                    {b.isActive ? '● Đang hiển thị' : '○ Tạm ẩn'}
                  </button>
                </div>
              </div>

              {/* Thông số chi tiết & Thao tác */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-serif font-bold text-sm text-gray-900 line-clamp-1">
                    {b.isPureImage ? '🖼️ [Ảnh thuần] ' : ''}
                    {b.title || 'Banner không tiêu đề'}
                  </h4>
                  <span className="text-[11px] font-mono text-gray-400">Thứ tự: {b.sortOrder || 1}</span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 text-[10.5px]">
                  <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-mono">
                    Tỷ lệ: {Number(b.aspectRatio || 2.63).toFixed(2)}:1
                  </span>
                  <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                    Fit: {b.fitMode || 'cover'}
                  </span>
                  <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-mono">
                    Zoom: {b.zoomX || 100}%
                  </span>
                  {b.mobileImageUrl ? (
                    <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium">
                      📱 Có ảnh Mobile
                    </span>
                  ) : (
                    <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded font-medium">
                      🖥️ Dùng ảnh Desktop
                    </span>
                  )}
                  {b.overlay && (
                    <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-medium">
                      Overlay: {b.overlayOpacity ?? 30}%
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs text-gray-500">
                  <div className="truncate max-w-[200px] text-[11px]">
                    {b.isPureImage ? (
                      <span className="text-gray-400 italic">Chế độ ảnh sản phẩm thuần</span>
                    ) : (
                      <span>Nút chính: <strong className="text-gray-700">{b.linkText || 'Xem Ngay'}</strong></span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(b)}
                      className="p-1.5 text-[#8B1E21] hover:bg-red-50 rounded-lg transition-colors"
                      title="Chỉnh sửa banner"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setDeletingId(b._id);
                        setDeleteConfirmOpen(true);
                      }}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Xóa banner"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ========================================================
          MODAL CHỈNH SỬA / THÊM BANNER CHUYÊN NGHIỆP (CMS BANNER)
         ======================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-7xl w-full max-h-[96vh] flex flex-col border border-gray-200 overflow-hidden">
            {/* Header Modal */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#8B1E21] text-white flex items-center justify-center font-bold text-sm shadow-sm">
                  {modalMode === 'CREATE' ? '+' : '✎'}
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 leading-tight">
                    {modalMode === 'CREATE' ? 'Thêm Banner Mới' : 'Chỉnh Sửa Banner Trang Chủ'}
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    Live Preview thời gian thực · Cắt kéo trực tiếp trên ảnh · Đồng bộ 100% trang chủ
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowFullscreenPreview(true)}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg transition-colors"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Xem Toàn Màn Hình</span>
                </button>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: 2 Cột chuẩn Responsive (Trái: Form Controls / Phải: Live Interactive Preview) */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50/50">
              {formError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-medium flex items-center gap-2">
                  <XCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* ====================================================
                    CỘT TRÁI (COL 1-6): FORM THIẾT LẬP CHI TIẾT
                   ==================================================== */}
                <div className="lg:col-span-6 space-y-6">
                  {/* 1. NỘI DUNG BANNER */}
                  <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b pb-2.5">
                      <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-red-100 text-[#8B1E21] flex items-center justify-center text-[11px]">1</span>
                        <span>Nội Dung Banner</span>
                      </h4>

                      {/* CHẾ ĐỘ BANNER ẢNH THUẦN (Requirement 12) */}
                      <label className="flex items-center gap-2 cursor-pointer bg-amber-50 hover:bg-amber-100/70 border border-amber-200 px-2.5 py-1 rounded-lg transition-colors">
                        <input
                          type="checkbox"
                          checked={formData.isPureImage}
                          onChange={(e) => {
                            const isPure = e.target.checked;
                            setFormData((prev) => ({
                              ...prev,
                              isPureImage: isPure,
                              // Nếu bật ảnh thuần thì mặc định tắt overlay để ảnh sản phẩm sáng trong trẻo
                              overlay: isPure ? false : prev.overlay,
                            }));
                          }}
                          className="rounded text-[#8B1E21] focus:ring-[#8B1E21]"
                        />
                        <span className="text-[11px] font-bold text-[#8C6D18]">
                          Banner ảnh thuần (Ẩn toàn bộ chữ & nút)
                        </span>
                      </label>
                    </div>

                    {formData.isPureImage ? (
                      <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed">
                        ✨ <strong>Chế độ Ảnh thuần đang bật:</strong> Tiêu đề, mô tả, nút bấm và lớp phủ tối sẽ được ẩn đi để tôn vinh trọn vẹn bức ảnh nghệ nhân và không gian thực tế.
                      </div>
                    ) : (
                      <>
                        {/* Tiêu đề banner */}
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Tiêu đề banner *
                          </label>
                          <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="VD: Đặt Bộ Mẫu Đàn Tràng – Tiết Kiệm Đến 25%"
                            className="w-full px-3.5 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:border-[#8B1E21] focus:ring-1 focus:ring-[#8B1E21]"
                          />
                        </div>

                        {/* Phụ đề (badge nhỏ phía trên tiêu đề) */}
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Phụ đề / Huy hiệu nổi bật (Badge)
                          </label>
                          <input
                            type="text"
                            value={formData.subtitle}
                            onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                            placeholder="VD: DI SẢN THỦ CÔNG THĂNG LONG · CHUẨN KHOA NGHI"
                            className="w-full px-3.5 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:border-[#8B1E21]"
                          />
                        </div>

                        {/* Mô tả chi tiết */}
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Mô tả ngắn gọn
                          </label>
                          <textarea
                            rows="2"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Mô tả sản phẩm, chất liệu nan giang, giấy dó truyền thống..."
                            className="w-full px-3.5 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:border-[#8B1E21]"
                          />
                        </div>

                        {/* Nút 1 & Nút 2 (Requirement 11: Nếu rỗng thì hoàn toàn không render nút rỗng) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          <div className="space-y-1.5 p-3 bg-gray-50 rounded-xl border border-gray-200">
                            <span className="text-[11px] font-bold text-gray-800">Nút Chính 1</span>
                            <input
                              type="text"
                              value={formData.linkText}
                              onChange={(e) => setFormData({ ...formData, linkText: e.target.value })}
                              placeholder="Chữ nút (VD: Xem Ngay)"
                              className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-[#8B1E21] bg-white"
                            />
                            <input
                              type="text"
                              value={formData.linkUrl}
                              onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                              placeholder="Đường dẫn (VD: /bo-mau)"
                              className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-[#8B1E21] bg-white"
                            />
                          </div>

                          <div className="space-y-1.5 p-3 bg-gray-50 rounded-xl border border-gray-200">
                            <span className="text-[11px] font-bold text-gray-800">Nút Phụ 2 (Tùy chọn)</span>
                            <input
                              type="text"
                              value={formData.secondaryLinkText}
                              onChange={(e) => setFormData({ ...formData, secondaryLinkText: e.target.value })}
                              placeholder="Chữ nút (VD: Xem thêm)"
                              className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-[#8B1E21] bg-white"
                            />
                            <input
                              type="text"
                              value={formData.secondaryLinkUrl}
                              onChange={(e) => setFormData({ ...formData, secondaryLinkUrl: e.target.value })}
                              placeholder="Đường dẫn (VD: /lien-he)"
                              className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-[#8B1E21] bg-white"
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* 2. HÌNH ẢNH BANNER (DESKTOP & MOBILE) (Requirement 6, 14, 15, 17) */}
                  <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b pb-2.5">
                      <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-red-100 text-[#8B1E21] flex items-center justify-center text-[11px]">2</span>
                        <span>Hình Ảnh Banner (Desktop & Mobile)</span>
                      </h4>
                      {naturalImageDimensions.width > 0 && (
                        <span className="text-[11px] font-mono text-gray-500">
                          {naturalImageDimensions.width} × {naturalImageDimensions.height}px
                        </span>
                      )}
                    </div>

                    {/* CẢNH BÁO TỶ LỆ KHÔNG PHÙ HỢP (Requirement 14) */}
                    {ratioMismatchWarning && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <span>{ratioMismatchWarning}</span>
                          <button
                            type="button"
                            onClick={handleAutoSmartFit}
                            className="block mt-1 font-bold text-[#8B1E21] underline hover:no-underline"
                          >
                            Bấm vào đây để tự động khớp khung theo ảnh gốc
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Thẻ Upload Ảnh Desktop */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-gray-700">
                            Ảnh Desktop *
                          </label>
                          <span className="text-[10px] text-gray-400">Khuyên dùng 1920×800px</span>
                        </div>

                        <input
                          type="file"
                          ref={desktopInputRef}
                          onChange={(e) => handleUpload(e, 'desktop')}
                          accept="image/*"
                          className="hidden"
                        />

                        <div
                          onClick={() => desktopInputRef.current?.click()}
                          className={`relative border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[120px] overflow-hidden ${
                            formData.imageUrl
                              ? 'border-emerald-300 bg-emerald-50/20 hover:border-emerald-400'
                              : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                          }`}
                        >
                          {uploadingDesktop ? (
                            <div className="flex flex-col items-center gap-1">
                              <Loader2 className="w-6 h-6 text-[#8B1E21] animate-spin" />
                              <span className="text-[11px] text-gray-500">Đang nạp ảnh...</span>
                            </div>
                          ) : formData.imageUrl ? (
                            <div className="space-y-1.5 w-full">
                              <div className="h-16 w-full rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center border border-gray-200">
                                <img
                                  src={formData.imageUrl}
                                  alt="Desktop Preview"
                                  className="h-full w-full object-cover"
                                />
                              </div>
                              <div className="text-[11px] font-semibold text-emerald-700 flex items-center justify-center gap-1">
                                <Check className="w-3.5 h-3.5" />
                                <span>Nhấp để thay ảnh Desktop</span>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-1 text-gray-500">
                              <UploadCloud className="w-6 h-6 mx-auto text-gray-400" />
                              <div className="text-xs font-semibold">Tải lên ảnh Desktop</div>
                              <div className="text-[10px] text-gray-400">JPG, PNG, WEBP (Tối đa 10MB)</div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Thẻ Upload Ảnh Mobile */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-gray-700">
                            Ảnh Mobile (Tùy chọn)
                          </label>
                          <span className="text-[10px] text-gray-400">Khuyên dùng 800×1000px</span>
                        </div>

                        <input
                          type="file"
                          ref={mobileInputRef}
                          onChange={(e) => handleUpload(e, 'mobile')}
                          accept="image/*"
                          className="hidden"
                        />

                        <div
                          onClick={() => mobileInputRef.current?.click()}
                          className={`relative border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[120px] overflow-hidden ${
                            formData.mobileImageUrl
                              ? 'border-blue-300 bg-blue-50/20 hover:border-blue-400'
                              : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                          }`}
                        >
                          {uploadingMobile ? (
                            <div className="flex flex-col items-center gap-1">
                              <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                              <span className="text-[11px] text-gray-500">Đang nạp ảnh...</span>
                            </div>
                          ) : formData.mobileImageUrl ? (
                            <div className="space-y-1.5 w-full">
                              <div className="h-16 w-full rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center border border-gray-200">
                                <img
                                  src={formData.mobileImageUrl}
                                  alt="Mobile Preview"
                                  className="h-full w-full object-cover"
                                />
                              </div>
                              <div className="flex items-center justify-center gap-2">
                                <span className="text-[11px] font-semibold text-blue-700">
                                  Đổi ảnh Mobile
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setFormData((prev) => ({ ...prev, mobileImageUrl: '' }));
                                    showToast('Đã xóa ảnh Mobile riêng, tự động dùng ảnh Desktop cho Mobile!');
                                  }}
                                  className="text-[10.5px] text-rose-600 hover:underline"
                                >
                                  (Xóa)
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-1 text-gray-500">
                              <Smartphone className="w-6 h-6 mx-auto text-gray-400" />
                              <div className="text-xs font-semibold">Tải lên ảnh Mobile riêng</div>
                              <div className="text-[10px] text-gray-400">Nếu không có sẽ dùng ảnh Desktop</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 3. TỶ LỆ & CHIỀU CAO KHUNG BANNER (Requirement 8, 9) */}
                  <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b pb-2.5">
                      <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-red-100 text-[#8B1E21] flex items-center justify-center text-[11px]">3</span>
                        <span>Tỷ Lệ & Chiều Cao Banner</span>
                      </h4>
                      <span className="text-xs font-mono font-bold text-[#8B1E21]">
                        {Number(formData.aspectRatio).toFixed(2)}:1
                      </span>
                    </div>

                    {/* Presets Tỷ lệ Banner */}
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-gray-700">
                        Chọn tỷ lệ khung hình chuẩn
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                        {[
                          { id: 1.78, label: '16:9', desc: 'Chuẩn Video' },
                          { id: 2.33, label: '21:9', desc: 'Rộng Cinema' },
                          { id: 2.63, label: '2.63:1', desc: 'Chuẩn Thăng Long' },
                          { id: 3.5, label: '3.5:1', desc: 'Siêu Rộng' },
                          { id: 'custom', label: 'Tùy Chỉnh', desc: 'Nhập W × H' },
                        ].map((r) => {
                          const isSelected =
                            r.id === 'custom'
                              ? isCustomRatio
                              : !isCustomRatio && Math.abs(formData.aspectRatio - r.id) < 0.05;
                          return (
                            <button
                              key={r.label}
                              type="button"
                              onClick={() => {
                                if (r.id === 'custom') {
                                  setIsCustomRatio(true);
                                  handleCustomRatioChange(formData.customRatioWidth || 1920, formData.customRatioHeight || 800);
                                } else {
                                  setIsCustomRatio(false);
                                  setFormData((prev) => ({ ...prev, aspectRatio: r.id }));
                                }
                              }}
                              className={`p-2 rounded-xl border text-center transition-all ${
                                isSelected
                                  ? 'border-[#8B1E21] bg-red-50 text-[#8B1E21] font-bold shadow-xs'
                                  : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-white'
                              }`}
                            >
                              <div className="text-xs">{r.label}</div>
                              <div className="text-[9.5px] text-gray-400 font-normal">{r.desc}</div>
                            </button>
                          );
                        })}
                      </div>

                      {/* Khung nhập Tùy Chỉnh Tỷ Lệ (Requirement 8: Nhập Width x Height tự tính) */}
                      {isCustomRatio && (
                        <div className="p-3 bg-red-50/50 border border-red-200 rounded-xl space-y-2 mt-2">
                          <div className="text-[11px] font-bold text-gray-800">
                            Nhập kích thước khung mong muốn (Hệ thống tự tính tỷ lệ):
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="100"
                              max="4000"
                              value={formData.customRatioWidth}
                              onChange={(e) => handleCustomRatioChange(e.target.value, formData.customRatioHeight)}
                              placeholder="Chiều rộng (1920)"
                              className="w-1/2 px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-[#8B1E21] bg-white font-mono"
                            />
                            <span className="text-gray-400 font-bold">×</span>
                            <input
                              type="number"
                              min="100"
                              max="4000"
                              value={formData.customRatioHeight}
                              onChange={(e) => handleCustomRatioChange(formData.customRatioWidth, e.target.value)}
                              placeholder="Chiều cao (800)"
                              className="w-1/2 px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-[#8B1E21] bg-white font-mono"
                            />
                          </div>
                          <div className="text-[10.5px] text-gray-500">
                            Tỷ lệ tương đương: <strong>{Number(formData.aspectRatio).toFixed(2)}:1</strong>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Chiều cao Banner trên trang chủ (Requirement 9) */}
                    <div className="space-y-2 pt-2 border-t border-gray-100">
                      <label className="block text-xs font-semibold text-gray-700">
                        Chiều cao banner trên trang chủ
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                        {[
                          { id: 'STANDARD', label: 'Ngắn gọn', desc: '~480px' },
                          { id: 'LARGE', label: 'Vừa chuẩn', desc: '~620px (Đề xuất)' },
                          { id: 'XLARGE', label: 'To cao', desc: '~700px' },
                          { id: 'FULL', label: 'Tràn màn', desc: '~85vh' },
                          { id: 'CUSTOM', label: 'Tùy chỉnh', desc: 'Nhập số px' },
                        ].map((h) => (
                          <button
                            key={h.id}
                            type="button"
                            onClick={() => setFormData({ ...formData, heightSize: h.id })}
                            className={`p-2 rounded-xl border text-center transition-all ${
                              formData.heightSize === h.id
                                ? 'border-[#8B1E21] bg-red-50 text-[#8B1E21] font-bold shadow-xs'
                                : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-white'
                            }`}
                          >
                            <div className="text-xs">{h.label}</div>
                            <div className="text-[9.5px] text-gray-400 font-normal">{h.desc}</div>
                          </button>
                        ))}
                      </div>

                      {formData.heightSize === 'CUSTOM' && (
                        <div className="pt-2">
                          <input
                            type="text"
                            value={formData.customHeight}
                            onChange={(e) => setFormData({ ...formData, customHeight: e.target.value })}
                            placeholder="Nhập chiều cao CSS (VD: 550px hoặc 65vh)"
                            className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:border-[#8B1E21] font-mono"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 4. OVERLAY & HIỆU ỨNG NỀN (Requirement 10) */}
                  <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b pb-2.5">
                      <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-red-100 text-[#8B1E21] flex items-center justify-center text-[11px]">4</span>
                        <span>Lớp Phủ Tối (Overlay) & Hiệu Ứng Nền</span>
                      </h4>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-700">
                          {formData.overlay ? 'BẬT' : 'TẮT'}
                        </span>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, overlay: !formData.overlay })}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                            formData.overlay ? 'bg-[#8B1E21]' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              formData.overlay ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {formData.overlay && (
                      <div className="space-y-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
                          <span>Độ mờ lớp phủ tối (Opacity)</span>
                          <span className="font-mono text-[#8B1E21] font-bold text-xs bg-red-50 px-2 py-0.5 rounded">
                            {formData.overlayOpacity ?? 30}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="90"
                          step="5"
                          value={formData.overlayOpacity ?? 30}
                          onChange={(e) => setFormData({ ...formData, overlayOpacity: Number(e.target.value) })}
                          className="w-full accent-[#8B1E21]"
                        />
                        <div className="flex justify-between text-[10px] text-gray-400">
                          <span>0% (Trong suốt)</span>
                          <span>20% (Rất nhẹ)</span>
                          <span>30% (Khuyên dùng)</span>
                          <span>50% (Đậm nét chữ)</span>
                          <span>90% (Tối)</span>
                        </div>
                      </div>
                    )}

                    {/* Kiểu nền ảnh viền ngoài */}
                    <div className="space-y-1.5 pt-1">
                      <label className="block text-xs font-semibold text-gray-700">
                        Hiệu ứng nền khung viền
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'blur', label: 'Nền Mờ Nghệ Thuật', desc: 'Lấy mờ từ ảnh gốc' },
                          { id: 'dark', label: 'Nâu Sẫm Thăng Long', desc: 'Màu gỗ cổ truyền' },
                          { id: 'black', label: 'Đen Sang Trọng', desc: 'Cổ điển tương phản' },
                        ].map((bg) => (
                          <button
                            key={bg.id}
                            type="button"
                            onClick={() => setFormData({ ...formData, bgStyle: bg.id })}
                            className={`p-2 rounded-xl border text-left transition-all ${
                              formData.bgStyle === bg.id
                                ? 'border-[#8B1E21] bg-red-50 text-[#8B1E21] font-bold shadow-xs'
                                : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-white'
                            }`}
                          >
                            <div className="text-[11px] font-medium">{bg.label}</div>
                            <div className="text-[9.5px] text-gray-400 font-normal">{bg.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 5. THIẾT LẬP HIỂN THỊ & LỊCH PHÁT */}
                  <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4">
                    <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2 border-b pb-2.5">
                      <span className="w-5 h-5 rounded-full bg-red-100 text-[#8B1E21] flex items-center justify-center text-[11px]">5</span>
                      <span>Thứ Tự & Thời Gian Hiển Thị</span>
                    </h4>

                    <div className="grid grid-cols-2 gap-4 items-center">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Thứ tự hiển thị (Slider)
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={formData.sortOrder}
                          onChange={(e) => setFormData({ ...formData, sortOrder: Number(e.target.value) })}
                          className="w-full px-3.5 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:border-[#8B1E21]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Trạng thái hoạt động
                        </label>
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                              formData.isActive ? 'bg-emerald-600' : 'bg-gray-300'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                formData.isActive ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                          <span className="text-xs font-bold text-gray-800">
                            {formData.isActive ? 'Đang bật' : 'Tạm ẩn'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Schedule Type */}
                    <div className="space-y-2 pt-1">
                      <label className="block text-xs font-semibold text-gray-700">
                        Thời gian phát banner
                      </label>
                      <div className="space-y-2 text-xs text-gray-700">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="scheduleType"
                            checked={formData.scheduleType === 'NOW'}
                            onChange={() => setFormData({ ...formData, scheduleType: 'NOW' })}
                            className="text-[#8B1E21] focus:ring-[#8B1E21]"
                          />
                          <span>Hiển thị liên tục (Mặc định)</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="scheduleType"
                            checked={formData.scheduleType === 'DATE_RANGE'}
                            onChange={() => setFormData({ ...formData, scheduleType: 'DATE_RANGE' })}
                            className="text-[#8B1E21] focus:ring-[#8B1E21]"
                          />
                          <span>Hẹn giờ theo khoảng ngày lễ</span>
                        </label>

                        {formData.scheduleType === 'DATE_RANGE' && (
                          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2 ml-4">
                            <div className="flex flex-col sm:flex-row items-center gap-2">
                              <div className="w-full">
                                <span className="text-[10px] text-gray-500 block mb-0.5">Bắt đầu:</span>
                                <input
                                  type="datetime-local"
                                  value={formData.startDate}
                                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs"
                                />
                              </div>
                              <div className="w-full">
                                <span className="text-[10px] text-gray-500 block mb-0.5">Kết thúc:</span>
                                <input
                                  type="datetime-local"
                                  value={formData.endDate}
                                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ====================================================
                    CỘT PHẢI (COL 7-12): LIVE PREVIEW & INTERACTIVE CROP
                   ==================================================== */}
                <div className="lg:col-span-6 space-y-5">
                  {/* THANH ĐIỀU HƯỚNG PREVIEW THEO THIẾT BỊ (Requirement 6, 7) */}
                  <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                        <Eye className="w-4 h-4 text-[#8B1E21]" />
                        <span>Xem trước theo thiết bị:</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {[
                          { id: 'DESKTOP', icon: Monitor, label: 'Desktop' },
                          { id: 'LAPTOP', icon: Laptop, label: 'Laptop' },
                          { id: 'TABLET', icon: Tablet, label: 'Tablet' },
                          { id: 'MOBILE', icon: Smartphone, label: 'Mobile' },
                        ].map((dev) => {
                          const IconComp = dev.icon;
                          const isSelected = previewDevice === dev.id;
                          return (
                            <button
                              key={dev.id}
                              type="button"
                              onClick={() => setPreviewDevice(dev.id)}
                              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                isSelected
                                  ? 'bg-[#8B1E21] text-white shadow-xs'
                                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                              }`}
                            >
                              <IconComp className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">{dev.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1 border-t border-gray-100">
                      <span>{deviceConfig[previewDevice].widthLabel}</span>
                      {previewDevice === 'MOBILE' && (
                        <span className="font-semibold text-blue-600">
                          {formData.mobileImageUrl ? '● Ảnh Mobile riêng' : '○ Tự động dùng ảnh Desktop'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* KHUNG LIVE PREVIEW THỰC TẾ & DRAG INTERACTION (Requirement 2, 3, 21) */}
                  <div className="p-3 bg-slate-900/90 border border-slate-700 rounded-2xl overflow-hidden flex flex-col items-center justify-center min-h-[300px] shadow-xl relative">
                    {/* Thước tỷ lệ hiển thị */}
                    <div style={deviceConfig[previewDevice].containerStyle} className="transition-all duration-300 w-full">
                      <div className="rounded-xl overflow-hidden shadow-2xl border border-white/10 relative">
                        {/* DÙNG CHUNG BANNERDISPLAY CHUẨN 100% TRANG CHỦ */}
                        <BannerDisplay
                          banner={formData}
                          device={previewDevice}
                          isInteractive={true}
                          onPositionChange={({ positionX, positionY }) => {
                            setFormData((prev) => ({ ...prev, positionX, positionY }));
                          }}
                          onZoomChange={(delta) => handleZoomStep(delta)}
                          isLivePreview={true}
                          aspectRatioOverride={Number(formData.aspectRatio) || 2.63}
                          showDragHint={true}
                        />

                        {/* Thanh công cụ nổi trực tiếp trên góc ảnh Preview */}
                        <div className="absolute top-3 right-3 z-30 flex items-center gap-1 bg-black/75 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-white/20 text-white shadow-2xl">
                          <button
                            type="button"
                            onClick={() => handleZoomStep(-5)}
                            className="p-1 hover:bg-white/20 rounded transition-colors text-white"
                            title="Thu nhỏ (-5%)"
                          >
                            <ZoomOut className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-[11px] font-mono font-bold px-1.5 text-amber-300">
                            {formData.zoomX}%
                          </span>
                          <button
                            type="button"
                            onClick={() => handleZoomStep(5)}
                            className="p-1 hover:bg-white/20 rounded transition-colors text-white"
                            title="Phóng to (+5%)"
                          >
                            <ZoomIn className="w-3.5 h-3.5" />
                          </button>
                          <div className="h-3 w-px bg-white/30 mx-1" />
                          <button
                            type="button"
                            onClick={() => handleAlign('center')}
                            className="p-1 hover:bg-white/20 rounded transition-colors text-white"
                            title="Căn chính giữa (X=0, Y=0)"
                          >
                            <Crosshair className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 text-[11px] text-gray-300 flex items-center gap-1.5 text-center">
                      <Move className="w-3.5 h-3.5 text-[#C59B27] flex-shrink-0 animate-bounce" />
                      <span>
                        <strong>Thao tác:</strong> Kéo giữ chuột trực tiếp trên ảnh để chọn góc đẹp · Lăn chuột để Zoom nhanh.
                      </span>
                    </div>
                  </div>

                  {/* BẢNG CĂN CHỈNH ẢNH & ĐẶT LẠI (Requirement 3, 4, 5) */}
                  <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b pb-2.5">
                      <div className="text-xs font-bold text-gray-900 flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-[#8B1E21]" />
                        <span>Bộ Công Cụ Căn Chỉnh & Crop Ảnh</span>
                      </div>

                      {/* NÚT ĐẶT LẠI (Requirement 4) & TỰ ĐỘNG CĂN ĐẸP (Requirement 5) */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleAutoSmartFit}
                          className="px-2.5 py-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg flex items-center gap-1 transition-colors"
                          title="Tự động căn góc hợp lý theo ảnh gốc mà không méo ảnh"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Tự động căn đẹp</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleResetAdjustments}
                          className="px-2.5 py-1 text-[11px] font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-1 transition-colors"
                          title="Đặt lại Zoom về 100%, X/Y về 0 và khung về mặc định"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-gray-500" />
                          <span>Đặt lại</span>
                        </button>
                      </div>
                    </div>

                    {/* 1. CHẾ ĐỘ HIỂN THỊ TRONG KHUNG (Cover, Contain, Fill) */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
                        <span>Chế độ vừa khung (Object-Fit)</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'cover', icon: Scan, label: 'Lấp đầy (Cover)', desc: 'Phủ 100% khung không hở viền' },
                          { id: 'contain', icon: ImageIcon, label: 'Đầy đủ (Contain)', desc: 'Thấy trọn vẹn 100% ảnh' },
                          { id: 'fill', icon: Maximize2, label: 'Kéo dãn (Fill)', desc: 'Khớp sát 4 cạnh' },
                        ].map((m) => {
                          const IconComp = m.icon;
                          const isSelected = formData.fitMode === m.id;
                          return (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => setFormData({ ...formData, fitMode: m.id })}
                              className={`p-2 rounded-xl border text-left transition-all ${
                                isSelected
                                  ? 'border-[#8B1E21] bg-red-50 text-[#8B1E21] font-bold shadow-xs'
                                  : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-white'
                              }`}
                            >
                              <div className="text-xs flex items-center gap-1">
                                <IconComp className="w-3.5 h-3.5" />
                                <span>{m.label}</span>
                              </div>
                              <div className="text-[9.5px] text-gray-400 font-normal mt-0.5">{m.desc}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 2. CĂN NHANH HƯỚNG (Requirement 5) */}
                    <div className="space-y-1.5 pt-1 border-t border-gray-100">
                      <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
                        <span>Căn nhanh hướng hiển thị ảnh</span>
                      </div>
                      <div className="grid grid-cols-5 gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleAlign('center')}
                          className="px-2 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-[11px] font-semibold text-gray-700 flex items-center justify-center gap-1"
                        >
                          <Crosshair className="w-3.5 h-3.5 text-[#8B1E21]" />
                          <span>Chính giữa</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAlign('left')}
                          className="px-2 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-[11px] font-semibold text-gray-700 flex items-center justify-center gap-1"
                        >
                          <ArrowLeft className="w-3.5 h-3.5 text-gray-600" />
                          <span>Trái</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAlign('right')}
                          className="px-2 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-[11px] font-semibold text-gray-700 flex items-center justify-center gap-1"
                        >
                          <ArrowRight className="w-3.5 h-3.5 text-gray-600" />
                          <span>Phải</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAlign('top')}
                          className="px-2 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-[11px] font-semibold text-gray-700 flex items-center justify-center gap-1"
                        >
                          <ArrowUp className="w-3.5 h-3.5 text-gray-600" />
                          <span>Trên</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAlign('bottom')}
                          className="px-2 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-[11px] font-semibold text-gray-700 flex items-center justify-center gap-1"
                        >
                          <ArrowDown className="w-3.5 h-3.5 text-gray-600" />
                          <span>Dưới</span>
                        </button>
                      </div>
                    </div>

                    {/* 3. ĐIỀU CHỈNH ZOOM (Requirement 3, 4) */}
                    <div className="space-y-2 pt-1 border-t border-gray-100">
                      <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
                        <div className="flex items-center gap-1.5">
                          <span>Thu phóng (Zoom)</span>
                          <span className="font-mono text-[#8B1E21] font-bold text-xs bg-red-50 px-1.5 py-0.5 rounded">
                            {formData.zoomX}%
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleZoomStep(-5)}
                            className="px-2 py-0.5 text-[11px] bg-gray-100 hover:bg-gray-200 text-gray-700 rounded font-semibold transition-colors"
                          >
                            -5%
                          </button>
                          <button
                            type="button"
                            onClick={() => handleZoomStep(5)}
                            className="px-2 py-0.5 text-[11px] bg-gray-100 hover:bg-gray-200 text-gray-700 rounded font-semibold transition-colors"
                          >
                            +5%
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUnifiedZoom(100)}
                            className="px-2 py-0.5 text-[11px] bg-gray-100 hover:bg-gray-200 text-gray-700 rounded font-semibold transition-colors"
                          >
                            100%
                          </button>
                        </div>
                      </div>

                      <input
                        type="range"
                        min="20"
                        max="300"
                        step="1"
                        value={formData.zoomX}
                        onChange={(e) => handleUnifiedZoom(e.target.value)}
                        className="w-full accent-[#8B1E21]"
                      />
                      <div className="flex justify-between text-[10px] text-gray-400">
                        <span>20% (Thu nhỏ)</span>
                        <span>100% (Gốc)</span>
                        <span>300% (Phóng to)</span>
                      </div>
                    </div>

                    {/* 4. TỌA ĐỘ VỊ TRÍ X / Y (Requirement 3, 4) */}
                    <div className="space-y-2 pt-1 border-t border-gray-100">
                      <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
                        <div className="flex items-center gap-1.5">
                          <span>Vị trí trục X / Y (Tọa độ)</span>
                          <span className="font-mono text-gray-600 text-xs">
                            (X: {formData.positionX}px · Y: {formData.positionY}px)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, positionX: 0, positionY: 0 }))}
                          className="text-[11px] text-[#8B1E21] hover:underline font-semibold"
                        >
                          Về tọa độ 0
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1">
                            <span>Ngang (X)</span>
                            <span className="font-mono font-bold text-gray-800">{formData.positionX}px</span>
                          </div>
                          <input
                            type="range"
                            min="-500"
                            max="500"
                            step="1"
                            value={formData.positionX}
                            onChange={(e) => setFormData({ ...formData, positionX: Number(e.target.value) })}
                            className="w-full accent-[#8B1E21]"
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1">
                            <span>Dọc (Y)</span>
                            <span className="font-mono font-bold text-gray-800">{formData.positionY}px</span>
                          </div>
                          <input
                            type="range"
                            min="-500"
                            max="500"
                            step="1"
                            value={formData.positionY}
                            onChange={(e) => setFormData({ ...formData, positionY: Number(e.target.value) })}
                            className="w-full accent-[#8B1E21]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* NÚT XEM TRƯỚC TOÀN MÀN HÌNH (Requirement 13) */}
                  <button
                    type="button"
                    onClick={() => setShowFullscreenPreview(true)}
                    className="w-full py-3 px-4 bg-white border border-[#8B1E21] text-[#8B1E21] hover:bg-red-50 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all active:scale-98"
                  >
                    <Maximize2 className="w-4 h-4" />
                    <span>Xem Trước Toàn Màn Hình (Như Khách Hàng Thấy)</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-white flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 text-xs font-bold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-xl transition-colors"
              >
                Hủy bỏ
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="px-8 py-2.5 text-xs font-bold text-white bg-[#8B1E21] hover:bg-[#A32427] rounded-xl shadow-md hover:shadow-lg flex items-center gap-2 transition-all disabled:opacity-50 active:scale-95"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UploadCloud className="w-4 h-4" />
                )}
                <span>Lưu & Áp Dụng Banner</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          FULLSCREEN LIVE PREVIEW CHUẨN 100% (Requirement 13)
         ======================================================== */}
      {showFullscreenPreview && (
        <div className="fixed inset-0 z-[9999] bg-[#120B08] flex flex-col justify-between animate-fadeIn overflow-hidden">
          {/* Thanh công cụ điều khiển phía trên */}
          <div className="p-4 bg-black/85 backdrop-blur-md flex items-center justify-between text-white border-b border-white/10 z-50">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                Live Preview Toàn Màn Hình · Phố Hàng Mã
              </span>
              <span className="hidden sm:inline-block text-[11px] text-gray-400">
                (Tỷ lệ: {Number(formData.aspectRatio).toFixed(2)}:1 · Zoom: {formData.zoomX}% · Khung: {formData.heightSize})
              </span>
            </div>

            {/* Device switcher in fullscreen */}
            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center gap-1 bg-white/10 p-1 rounded-xl">
                {[
                  { id: 'DESKTOP', icon: Monitor, label: 'Desktop' },
                  { id: 'LAPTOP', icon: Laptop, label: 'Laptop' },
                  { id: 'TABLET', icon: Tablet, label: 'Tablet' },
                  { id: 'MOBILE', icon: Smartphone, label: 'Mobile' },
                ].map((d) => {
                  const IconC = d.icon;
                  return (
                    <button
                      key={d.id}
                      onClick={() => setPreviewDevice(d.id)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        previewDevice === d.id ? 'bg-[#8B1E21] text-white' : 'text-gray-300 hover:text-white'
                      }`}
                    >
                      <IconC className="w-3.5 h-3.5" />
                      <span>{d.label}</span>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setShowFullscreenPreview(false)}
                className="px-4 py-2 bg-[#8B1E21] hover:bg-[#A32427] text-white rounded-xl text-xs font-bold shadow-lg transition-all flex items-center gap-1.5"
              >
                <X className="w-4 h-4" />
                <span>Đóng Xem Trước (ESC)</span>
              </button>
            </div>
          </div>

          {/* Vùng banner chính xác như hiển thị ngoài trang chủ */}
          <div className="flex-1 overflow-y-auto flex items-center justify-center p-0 bg-[#FAF7F2]">
            <div style={deviceConfig[previewDevice].containerStyle} className="transition-all duration-300 w-full shadow-2xl">
              <BannerDisplay
                banner={formData}
                device={previewDevice}
                isInteractive={false}
                isLivePreview={true}
              />
            </div>
          </div>

          {/* Thanh hướng dẫn nhỏ phía dưới */}
          <div className="p-3 bg-black/85 text-center text-gray-400 text-xs border-t border-white/10 flex items-center justify-center gap-4">
            <span>✨ Khách hàng truy cập sẽ nhìn thấy giao diện chính xác như trên.</span>
            <button
              onClick={() => setShowFullscreenPreview(false)}
              className="text-amber-400 underline hover:no-underline font-semibold"
            >
              Quay lại chỉnh sửa
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirmOpen}
        title="Xóa Banner Quảng Cáo"
        message="Bạn có chắc chắn muốn xóa banner này vĩnh viễn không? Hành động này không thể hoàn tác."
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirmOpen(false)}
      />
    </div>
  );
}
