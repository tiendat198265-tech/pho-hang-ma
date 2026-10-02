import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import {
  SlidersHorizontal,
  Plus,
  Trash2,
  Upload,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Image as ImageIcon,
  X,
  Search,
  ArrowRight,
  ShieldCheck,
  Phone,
  ZoomIn,
  Eye,
  Check,
  Package,
  Sparkles,
  Clock,
  MapPin,
  Calendar,
  User,
  Truck,
  RotateCcw,
  FileText,
  Tag,
  Lock,
} from 'lucide-react';

export default function TemplateCustomizerPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { openAuthModal } = useCart();

  const [allTemplates, setAllTemplates] = useState([]);
  const [template, setTemplate] = useState(null);
  const [items, setItems] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [modalTab, setModalTab] = useState('CATALOG'); // 'CATALOG' | 'CUSTOM'
  const [productSearch, setProductSearch] = useState('');
  const [zoomImage, setZoomImage] = useState(null);

  // Form thêm sản phẩm tự yêu cầu riêng
  const [customItemForm, setCustomItemForm] = useState({
    name: '',
    unit: 'chiếc',
    quantity: 1,
    note: '',
    image: '',
    uploadingImage: false,
  });

  // Global fields
  const [generalNotes, setGeneralNotes] = useState('');
  const [budgetExpectation, setBudgetExpectation] = useState('');
  const [globalImages, setGlobalImages] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  // Contact form
  const [contactInfo, setContactInfo] = useState({
    fullName: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    eventDate: '',
    altarAddress: user?.address || '',
    specialInstructions: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(true);

  // 1. Fetch templates & products with resilient fallback
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [templatesRes, productsRes] = await Promise.all([
          fetch('/api/templates'),
          fetch('/api/products?limit=100'),
        ]);

        const [templatesData, productsData] = await Promise.all([
          templatesRes.json(),
          productsRes.json(),
        ]);

        let selectedTemplate = null;

        if (templatesData.success && templatesData.data?.length > 0) {
          setAllTemplates(templatesData.data);

          if (slug) {
            selectedTemplate = templatesData.data.find(
              (t) => t.slug === slug || t.slug === decodeURIComponent(slug)
            );
          }

          // If no matching slug or no slug provided, take the first available template
          if (!selectedTemplate) {
            selectedTemplate = templatesData.data[0];
          }
        }

        if (selectedTemplate) {
          setTemplate(selectedTemplate);

          // Populate template items
          if (selectedTemplate.items && selectedTemplate.items.length > 0) {
            const initialItems = selectedTemplate.items.map((item) => ({
              productId: item.productId?._id || item.productId || null,
              productName: item.productNameSnapshot || item.productId?.name || 'Linh phẩm truyền thống',
              sku: item.productId?.sku || '',
              thumbnail:
                item.image ||
                item.productId?.thumbnail ||
                item.productId?.images?.[0] ||
                'https://images.unsplash.com/photo-1582650625119-3a31f8fa2699?auto=format&fit=crop&w=600&q=80',
              unit: item.productId?.unit || 'bộ',
              unitPrice: item.productId?.price || 0,
              quantity: item.defaultQuantity || 1,
              originalQuantity: item.defaultQuantity || 1,
              required: item.required || false,
              removable: true,
              editableQuantity: item.editableQuantity !== undefined ? item.editableQuantity : true,
              selected: true,
              addedManually: false,
              note: item.note || '',
              referenceImages: [],
            }));
            setItems(initialItems);
          } else {
            // Default placeholder items if template has no items
            setItems([
              {
                productId: null,
                productName: 'Ngựa Đại Ngũ Sắc',
                sku: 'HM-NGUA-DAI',
                thumbnail: 'https://images.unsplash.com/photo-1582650625119-3a31f8fa2699?auto=format&fit=crop&w=600&q=80',
                unit: 'ông',
                unitPrice: 0,
                quantity: 1,
                originalQuantity: 1,
                required: true,
                removable: true,
                editableQuantity: true,
                selected: true,
                addedManually: false,
                note: '',
                referenceImages: [],
              },
            ]);
          }
        }

        if (productsData.success && productsData.data) {
          setAllProducts(productsData.data);
        }
      } catch (err) {
        console.error('Lỗi nạp dữ liệu tùy biến:', err);
        setErrorMsg('Không thể kết nối máy chủ để lấy dữ liệu mẫu.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug]);

  // Switch template
  const handleSelectTemplate = (tpl) => {
    setTemplate(tpl);
    if (tpl.items && tpl.items.length > 0) {
      const newItems = tpl.items.map((item) => ({
        productId: item.productId?._id || item.productId || null,
        productName: item.productNameSnapshot || item.productId?.name || 'Linh phẩm truyền thống',
        sku: item.productId?.sku || '',
        thumbnail:
          item.image ||
          item.productId?.thumbnail ||
          item.productId?.images?.[0] ||
          'https://images.unsplash.com/photo-1582650625119-3a31f8fa2699?auto=format&fit=crop&w=600&q=80',
        unit: item.productId?.unit || 'bộ',
        unitPrice: item.productId?.price || 0,
        quantity: item.defaultQuantity || 1,
        originalQuantity: item.defaultQuantity || 1,
        required: item.required || false,
        removable: true,
        editableQuantity: item.editableQuantity !== undefined ? item.editableQuantity : true,
        selected: true,
        addedManually: false,
        note: item.note || '',
        referenceImages: [],
      }));
      setItems(newItems);
    }
  };

  // Toggle item selection
  const toggleItemSelection = (index) => {
    setItems((prev) =>
      prev.map((it, idx) => (idx === index ? { ...it, selected: !it.selected } : it))
    );
  };

  // Change quantity
  const changeItemQuantity = (index, delta) => {
    setItems((prev) =>
      prev.map((it, idx) => {
        if (idx === index) {
          if (!it.editableQuantity) return it;
          const newQty = Math.max(1, it.quantity + delta);
          return { ...it, quantity: newQty };
        }
        return it;
      })
    );
  };

  // Update item note
  const updateItemNote = (index, note) => {
    setItems((prev) => prev.map((it, idx) => (idx === index ? { ...it, note } : it)));
  };

  // Add product from catalog
  const handleAddProductFromCatalog = (product) => {
    const existingIndex = items.findIndex((it) => it.productId === product._id);
    if (existingIndex >= 0) {
      setItems((prev) =>
        prev.map((it, idx) =>
          idx === existingIndex ? { ...it, selected: true, quantity: it.quantity + 1 } : it
        )
      );
    } else {
      setItems((prev) => [
        ...prev,
        {
          productId: product._id,
          productName: product.name,
          sku: product.sku || '',
          thumbnail: product.thumbnail || product.images?.[0] || '',
          unit: product.unit || 'bộ',
          unitPrice: product.price || 0,
          quantity: 1,
          originalQuantity: 0,
          required: false,
          removable: true,
          editableQuantity: true,
          selected: true,
          addedManually: true,
          note: '',
          referenceImages: [],
        },
      ]);
    }
    setShowProductModal(false);
  };

  // Upload custom item image
  const handleCustomItemImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCustomItemForm((prev) => ({ ...prev, uploadingImage: true }));
    const formData = new FormData();
    formData.append('images', file);

    try {
      const res = await fetch('/api/custom-orders/upload-images', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.data && data.data[0]) {
        setCustomItemForm((prev) => ({
          ...prev,
          image: data.data[0].url,
          uploadingImage: false,
        }));
      } else {
        alert(data.message || 'Lỗi tải ảnh lên');
        setCustomItemForm((prev) => ({ ...prev, uploadingImage: false }));
      }
    } catch (err) {
      console.error('Lỗi upload ảnh:', err);
      alert('Không thể kết nối máy chủ để tải ảnh lên.');
      setCustomItemForm((prev) => ({ ...prev, uploadingImage: false }));
    }
  };

  // Add custom user product
  const handleAddCustomProduct = (e) => {
    e.preventDefault();
    if (!customItemForm.name.trim()) {
      alert('Vui lòng nhập tên linh phẩm bạn muốn yêu cầu riêng.');
      return;
    }

    const newItem = {
      productId: null,
      productName: customItemForm.name.trim(),
      sku: '',
      thumbnail:
        customItemForm.image ||
        'https://images.unsplash.com/photo-1582650625119-3a31f8fa2699?auto=format&fit=crop&w=600&q=80',
      customImage: customItemForm.image || '',
      unit: customItemForm.unit?.trim() || 'chiếc',
      unitPrice: 0,
      quantity: Math.max(1, Number(customItemForm.quantity) || 1),
      originalQuantity: 0,
      required: false,
      removable: true,
      editableQuantity: true,
      selected: true,
      addedManually: true,
      isCustomItem: true,
      note: customItemForm.note?.trim() || '',
      referenceImages: customItemForm.image ? [{ url: customItemForm.image }] : [],
    };

    setItems((prev) => [...prev, newItem]);
    setCustomItemForm({
      name: '',
      unit: 'chiếc',
      quantity: 1,
      note: '',
      image: '',
      uploadingImage: false,
    });
    setShowProductModal(false);
  };

  // Remove item
  const removeManuallyAddedItem = (index) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Upload global images
  const handleGlobalImageUpload = async (e) => {
    if (!user) {
      if (openAuthModal) openAuthModal();
      else navigate(`/dang-nhap?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }

    const files = Array.from(e.target.files);
    if (!files.length) return;

    setUploadingImages(true);
    const formData = new FormData();
    files.forEach((file) => formData.append('images', file));

    try {
      const token = localStorage.getItem('pho_hang_ma_token');
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/custom-orders/upload-images', {
        method: 'POST',
        headers,
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.data) {
        setGlobalImages((prev) => [...prev, ...data.data]);
      } else {
        alert(data.message || 'Lỗi tải ảnh lên');
      }
    } catch (err) {
      console.error('Lỗi upload ảnh:', err);
      alert('Không thể kết nối máy chủ để tải ảnh lên.');
    } finally {
      setUploadingImages(false);
    }
  };

  const removeGlobalImage = (index) => {
    setGlobalImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Quick suggestion tags for notes
  const quickTags = [
    'Hia mão ngũ sắc đầy đủ',
    'Ngựa đại cao trên 1m8',
    'Thuyền rồng kích thước lớn',
    'Giao trước giờ Tý ngày 14 âm',
    'Chuẩn khoa nghi bản đền',
    'Nan giang già chống cong vênh',
  ];

  const handleAddQuickTag = (tag) => {
    setGeneralNotes((prev) => (prev ? `${prev}; ${tag}` : tag));
  };

  // Submit Quote Request
  const handleSubmitCustomOrder = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    // Chặn khách chưa đăng nhập: Khách chỉ được xem mẫu, muốn gửi yêu cầu báo giá bắt buộc phải đăng nhập
    if (!user) {
      if (openAuthModal) {
        openAuthModal();
      } else {
        const returnUrl = window.location.pathname + window.location.search;
        navigate(`/dang-nhap?redirect=${encodeURIComponent(returnUrl)}`);
      }
      return;
    }

    if (!contactInfo.fullName.trim() || !contactInfo.phone.trim()) {
      setErrorMsg('Vui lòng điền họ tên và số điện thoại liên hệ để nhận báo giá');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const selectedItems = items.map((it) => ({
      productId: it.productId || null,
      productNameSnapshot: it.productName,
      unitPriceSnapshot: it.unitPrice || 0,
      unit: it.unit || 'chiếc',
      quantity: it.quantity,
      originalQuantityInTemplate: it.originalQuantity || 0,
      selectedFromTemplate: !it.addedManually,
      addedManually: Boolean(it.addedManually),
      isCustomItem: Boolean(it.isCustomItem || !it.productId),
      removedFromTemplate: !it.selected,
      note: it.note || '',
      customImage: it.customImage || '',
      referenceImages: it.referenceImages?.length
        ? it.referenceImages
        : it.customImage
        ? [{ url: it.customImage }]
        : [],
    }));

    const payload = {
      templateId: template?._id,
      items: selectedItems,
      globalReferenceImages: globalImages,
      generalNotes,
      budgetExpectation,
      contactInfo,
    };

    setSubmitting(true);
    try {
      const token = localStorage.getItem('pho_hang_ma_token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/custom-orders', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success && data.data) {
        navigate(`/xac-nhan-bao-gia/${data.data.requestCode}`);
      } else {
        setErrorMsg(data.message || 'Có lỗi xảy ra khi gửi yêu cầu báo giá');
      }
    } catch (err) {
      console.error('Lỗi gửi đơn:', err);
      setErrorMsg('Lỗi kết nối máy chủ');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-[1320px] mx-auto px-4 py-28 text-center">
        <div className="w-12 h-12 border-3 border-[#8B1E21] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm font-semibold text-[#584140]">Đang nạp hồ sơ mẫu đàn tràng...</p>
      </div>
    );
  }

  const activeItemsCount = items.filter((it) => it.selected).length;
  const addedItemsCount = items.filter((it) => it.addedManually).length;
  const removedItemsCount = items.filter((it) => !it.selected && !it.addedManually).length;

  return (
    <div className="w-full bg-[#FAF7F2] min-h-screen py-8 sm:py-10">
      <div className="max-w-[1320px] mx-auto px-4 space-y-6 sm:space-y-8">
        {/* BREADCRUMB */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Link to="/" className="hover:text-[#8B1E21] transition-colors">Trang Chủ</Link>
          <span>/</span>
          <Link to="/bo-mau" className="hover:text-[#8B1E21] transition-colors">Bộ Mẫu Quy Chuẩn</Link>
          <span>/</span>
          <span className="text-[#8B1E21] font-semibold">Tùy Biến Đàn Tràng</span>
        </div>

        {/* 1. TOP ATELIER HERO BANNER (THIẾT KẾ ĐẬM CHẤT DI SẢN THĂNG LONG) */}
        <div className="relative bg-gradient-to-r from-[#1E120D] via-[#2D1B13] to-[#1E120D] text-white rounded-2xl p-6 sm:p-8 shadow-xl overflow-hidden border border-[#C59B27]/30">
          {/* Họa tiết góc truyền thống */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-[#C59B27]/15 to-transparent rounded-bl-full pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2.5 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 bg-[#8B1E21] text-white text-[11px] font-bold rounded-full uppercase tracking-wider shadow-sm border border-[#A32427]">
                  DI SẢN NGHỆ NHÂN HÀ NỘI · LÀNG NGHỀ DUYÊN THÁI
                </span>
                <span className="px-3 py-1 bg-[#C59B27]/20 text-[#E5B54F] border border-[#C59B27]/40 text-[11px] font-bold rounded-full">
                  ⚡ Báo Giá Trong 2-4 Giờ
                </span>
              </div>

              <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-wide leading-tight">
                {template?.name || 'Trọn Bộ Đàn Tứ Phủ'} <span className="text-[#E5B54F]">(Cấu Hình Tùy Biến)</span>
              </h1>

              <p className="text-gray-300 text-xs sm:text-sm leading-relaxed max-w-2xl font-light">
                {template?.subtitle ||
                  'Khảo sát nan giang già phơi khô 6 tháng & giấy dó cổ truyền Thăng Long. Quý khách toàn quyền thêm bớt linh phẩm, chỉnh sửa số lượng hoặc yêu cầu chế tác theo diện tích điện thờ.'}
              </p>

              {/* Template selector pills if multiple templates exist */}
              {allTemplates.length > 1 && (
                <div className="pt-2 flex flex-wrap items-center gap-2">
                  <span className="text-xs text-gray-400 font-medium">Chọn bộ mẫu:</span>
                  {allTemplates.map((tpl) => (
                    <button
                      key={tpl._id}
                      type="button"
                      onClick={() => handleSelectTemplate(tpl)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        template?._id === tpl._id
                          ? 'bg-[#C59B27] text-black font-bold shadow-md'
                          : 'bg-white/10 hover:bg-white/20 text-gray-300'
                      }`}
                    >
                      {tpl.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Reassurances on banner right */}
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 shrink-0 w-full md:w-auto">
              <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/15 text-center">
                <div className="text-[#E5B54F] font-bold text-base">0 đ</div>
                <div className="text-[11px] text-gray-300">Không Cần Cọc Trước</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/15 text-center">
                <div className="text-[#E5B54F] font-bold text-base">100%</div>
                <div className="text-[11px] text-gray-300">Xe Mui Kín Chuyên Dụng</div>
              </div>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl flex items-center gap-3 text-sm shadow-xs">
            <AlertCircle size={20} className="text-red-600 shrink-0" />
            <span className="font-medium">{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmitCustomOrder}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* ========================================================
                CỘT TRÁI (8 CỘT): DANH SÁCH LINH PHẨM, GHI CHÚ, UPLOAD ẢNH
               ======================================================== */}
            <div className="lg:col-span-8 space-y-6 sm:space-y-7">
              {/* 1. KHỐI THÀNH PHẦN LINH PHẨM */}
              <div className="bg-white border border-[#E6DFD5] rounded-2xl shadow-antique-card p-4 sm:p-6 lg:p-7 space-y-5">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-[#E6DFD5] gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#8B1E21]" />
                      <h2 className="font-serif text-lg sm:text-xl font-bold text-[#262626]">
                        Thành Phần Linh Phẩm Trong Mẫu
                      </h2>
                      <span className="bg-amber-100 text-[#8C6D18] text-xs font-bold px-2 py-0.5 rounded-full">
                        {activeItemsCount}/{items.length} món
                      </span>
                    </div>
                    <p className="text-xs text-[#584140] mt-1">
                      Tích chọn để giữ hoặc bỏ bớt. Tăng giảm số lượng và điền ghi chú yêu cầu riêng cho từng món.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowProductModal(true)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#8B1E21] hover:bg-[#A32427] text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95 shrink-0"
                  >
                    <Plus size={15} />
                    <span>Thêm Linh Phẩm Khác</span>
                  </button>
                </div>

                {/* Danh sách từng món linh phẩm */}
                <div className="space-y-3.5">
                  {items.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                      <Package className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-gray-600">Chưa có linh phẩm nào trong danh sách</p>
                      <button
                        type="button"
                        onClick={() => setShowProductModal(true)}
                        className="mt-3 text-xs font-bold text-[#8B1E21] underline hover:no-underline"
                      >
                        Bấm vào đây để chọn món từ kho hoặc tự nhập món riêng
                      </button>
                    </div>
                  ) : (
                    items.map((item, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-xl border transition-all duration-200 ${
                          item.selected
                            ? 'bg-white border-[#E6DFD5] shadow-xs hover:border-[#8B1E21]/60'
                            : 'bg-gray-50/80 border-dashed border-gray-300 opacity-60'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          {/* Khối Thông Tin & Checkbox */}
                          <div className="flex items-start gap-3.5 flex-1 min-w-0">
                            {/* Checkbox to rõ, dễ bấm */}
                            <div className="pt-1.5">
                              <input
                                type="checkbox"
                                checked={item.selected}
                                onChange={() => toggleItemSelection(index)}
                                className="w-5 h-5 rounded accent-[#8B1E21] cursor-pointer"
                                id={`item-${index}`}
                              />
                            </div>

                            {/* Thumbnail ảnh linh phẩm */}
                            <div
                              onClick={() =>
                                item.thumbnail &&
                                setZoomImage({
                                  url: item.thumbnail,
                                  name: item.productName,
                                  unit: item.unit,
                                  note: item.note,
                                })
                              }
                              className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-[#E6DFD5] bg-gray-100 flex-shrink-0 cursor-pointer group shadow-xs"
                              title="Bấm để xem ảnh mẫu phóng to"
                            >
                              <img
                                src={item.thumbnail}
                                alt={item.productName}
                                className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-110 ${
                                  !item.selected ? 'grayscale opacity-50' : ''
                                }`}
                              />
                              <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                                <ZoomIn size={18} />
                                <span className="text-[9px] font-bold mt-0.5">Phóng to</span>
                              </div>
                            </div>

                            {/* Tiêu đề & Thông số */}
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <label
                                  htmlFor={`item-${index}`}
                                  className={`font-serif text-[15px] sm:text-[16.5px] font-bold cursor-pointer transition-colors leading-snug ${
                                    item.selected
                                      ? 'text-[#262626] hover:text-[#8B1E21]'
                                      : 'text-gray-400 line-through'
                                  }`}
                                >
                                  {item.productName}
                                </label>

                                {item.required && (
                                  <span className="text-[10px] bg-red-50 text-[#8B1E21] border border-red-200 px-2 py-0.5 rounded font-bold">
                                    Mẫu quy chuẩn
                                  </span>
                                )}
                                {item.isCustomItem ? (
                                  <span className="text-[10px] bg-purple-50 text-purple-900 border border-purple-200 px-2 py-0.5 rounded font-bold">
                                    ✦ Món Tự Yêu Cầu
                                  </span>
                                ) : item.addedManually ? (
                                  <span className="text-[10px] bg-amber-50 text-[#8C6D18] border border-amber-200 px-2 py-0.5 rounded font-bold">
                                    + Thêm ngoài mẫu
                                  </span>
                                ) : null}
                                {!item.selected && (
                                  <span className="text-[10px] bg-gray-100 text-gray-500 border border-gray-300 px-2 py-0.5 rounded font-semibold">
                                    Đã bỏ chọn
                                  </span>
                                )}
                              </div>

                              <div className="text-xs text-[#584140] mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                                <span>
                                  Đơn vị tính: <strong className="text-gray-900">{item.unit}</strong>
                                </span>
                                {item.originalQuantity > 0 && item.originalQuantity !== item.quantity && (
                                  <span className="text-[#8B1E21] font-semibold">
                                    (Gốc: x{item.originalQuantity})
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={() =>
                                    item.thumbnail &&
                                    setZoomImage({
                                      url: item.thumbnail,
                                      name: item.productName,
                                      unit: item.unit,
                                      note: item.note,
                                    })
                                  }
                                  className="text-[#8B1E21] hover:underline flex items-center gap-1 font-semibold transition-colors"
                                >
                                  <Eye size={13} />
                                  <span>Xem chi tiết ảnh</span>
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Bộ Tăng Giảm Số Lượng / Nút Chọn Lại */}
                          <div className="flex items-center justify-between sm:justify-end gap-2.5 sm:gap-3 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                            {item.selected ? (
                              <div className="flex items-center gap-2">
                                <div className="flex items-center border border-[#D5CCC1] rounded-xl bg-white overflow-hidden shadow-2xs">
                                  <button
                                    type="button"
                                    onClick={() => changeItemQuantity(index, -1)}
                                    disabled={!item.editableQuantity}
                                    className="w-8 h-8 flex items-center justify-center text-gray-700 hover:bg-[#FAF7F2] font-bold disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    title="Giảm số lượng"
                                  >
                                    -
                                  </button>
                                  <span className="w-10 text-center font-bold text-sm text-[#8B1E21]">
                                    {item.quantity}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => changeItemQuantity(index, 1)}
                                    disabled={!item.editableQuantity}
                                    className="w-8 h-8 flex items-center justify-center text-gray-700 hover:bg-[#FAF7F2] font-bold disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    title="Tăng số lượng"
                                  >
                                    +
                                  </button>
                                </div>

                                {item.addedManually && (
                                  <button
                                    type="button"
                                    onClick={() => removeManuallyAddedItem(index)}
                                    className="text-gray-400 hover:text-rose-600 p-2 rounded-lg hover:bg-rose-50 transition-colors"
                                    title="Xóa linh phẩm này"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                )}
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => toggleItemSelection(index)}
                                className="px-3.5 py-1.5 text-xs font-bold text-[#8B1E21] bg-white hover:bg-[#FAF7F2] border border-[#8B1E21]/40 rounded-xl flex items-center gap-1.5 transition-colors shadow-2xs"
                              >
                                <Plus size={14} />
                                <span>Chọn lại món này</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Ghi chú riêng cho từng món */}
                        {item.selected && (
                          <div className="mt-3 pt-2.5 border-t border-[#E6DFD5]/80">
                            <input
                              type="text"
                              value={item.note}
                              onChange={(e) => updateItemNote(index, e.target.value)}
                              placeholder="Ghi chú riêng cho món này (VD: Cần màu gấm đỏ, kích thước chuẩn gian đền, nan dày...)"
                              className="w-full bg-[#FAF7F2]/80 border border-[#D5CCC1] text-xs rounded-lg px-3 py-2 focus:border-[#8B1E21] focus:bg-white focus:outline-none transition-all placeholder:text-gray-400"
                            />
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* 2. GHI CHÚ CHUNG & YÊU CẦU ĐẶC BIỆT */}
              <div className="bg-white border border-[#E6DFD5] rounded-2xl shadow-antique-card p-4 sm:p-6 lg:p-7 space-y-3.5">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#8B1E21]" />
                  <h2 className="font-serif text-lg sm:text-xl font-bold text-[#262626]">
                    Ghi Chú Yêu Cầu Chung Cho Toàn Bộ Đàn Lễ
                  </h2>
                </div>
                <p className="text-xs text-[#584140]">
                  Quý khách có thể ghi chú kích thước mong muốn, hướng điện thờ, ngày giờ khai đàn hoặc yêu cầu Thợ Cả liên hệ khảo sát trực tiếp trước khi vào khung giang bồi giấy.
                </p>

                {/* Quick suggestions tags */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-[11px] font-bold text-gray-500 flex items-center gap-1">
                    <Tag size={12} />
                    <span>Gợi ý nhanh:</span>
                  </span>
                  {quickTags.map((tag, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleAddQuickTag(tag)}
                      className="px-2.5 py-1 bg-[#FAF7F2] hover:bg-[#8B1E21] text-gray-700 hover:text-white border border-[#E6DFD5] rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>

                <textarea
                  rows={4}
                  value={generalNotes}
                  onChange={(e) => setGeneralNotes(e.target.value)}
                  placeholder="Ví dụ: Tôi muốn làm giống kích thước gian thờ đền Mẫu Đông Cuông; cần hoàn thiện và giao bằng xe mui kín trước giờ Tý ngày 14 âm lịch..."
                  className="w-full bg-[#FAF7F2]/60 border border-[#D5CCC1] text-xs sm:text-sm rounded-xl p-3.5 focus:border-[#8B1E21] focus:bg-white focus:outline-none transition-all placeholder:text-gray-400 leading-relaxed"
                />
              </div>

              {/* 3. UPLOAD HÌNH ẢNH THAM KHẢO / BẢN VẼ / ẢNH MẪU */}
              <div className="bg-white border border-[#E6DFD5] rounded-2xl shadow-antique-card p-4 sm:p-6 lg:p-7 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-[#8B1E21]" />
                    <h2 className="font-serif text-lg sm:text-xl font-bold text-[#262626]">
                      Hình Ảnh Tham Khảo / Bản Vẽ / Ảnh Mẫu Khác
                    </h2>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-[#8C6D18] border border-amber-200">
                    Khuyến Khích Tải Lên
                  </span>
                </div>
                <p className="text-xs text-[#584140]">
                  Tải lên hình ảnh đàn lễ của bản đền năm trước, ảnh chụp bàn thờ thực tế hoặc bản thảo viết tay của thầy cúng để Thợ Cả đối chiếu chính xác nhất.
                </p>

                {/* Upload Drag & Drop Area */}
                <div className="mt-2 border-2 border-dashed border-[#C59B27]/80 bg-[#FAF7F2]/70 hover:bg-[#FAF7F2] p-8 rounded-2xl text-center transition-all relative group cursor-pointer">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleGlobalImageUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                    disabled={uploadingImages}
                  />
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="w-12 h-12 rounded-full bg-white shadow-xs border border-[#E6DFD5] flex items-center justify-center text-[#8B1E21] group-hover:scale-110 transition-transform">
                      <Upload size={24} />
                    </div>
                    <div className="text-sm font-bold text-[#262626]">
                      {uploadingImages ? 'Đang tải ảnh lên máy chủ...' : 'Nhấp hoặc Kéo thả nhiều hình ảnh vào đây'}
                    </div>
                    <p className="text-xs text-gray-500">
                      Hỗ trợ định dạng JPG, PNG, WEBP tối đa 10MB mỗi ảnh
                    </p>
                  </div>
                </div>

                {/* Image Previews */}
                {globalImages.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                    {globalImages.map((img, idx) => (
                      <div
                        key={idx}
                        className="relative aspect-square rounded-xl overflow-hidden border border-[#E6DFD5] shadow-xs group bg-gray-100"
                      >
                        <img
                          src={img.url}
                          alt={img.fileName || 'Ảnh mẫu tham khảo'}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeGlobalImage(idx)}
                          className="absolute top-1.5 right-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full p-1 shadow-md transition-all cursor-pointer"
                          title="Xóa ảnh này"
                        >
                          <X size={13} />
                        </button>
                        <div className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-xs text-white text-[10px] px-2 py-1 truncate text-center">
                          {img.fileName || `Ảnh ${idx + 1}`}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ========================================================
                CỘT PHẢI (4 CỘT): HỒ SƠ BÁO GIÁ STICKY TỪ XƯỞNG
               ======================================================== */}
            <div className="lg:col-span-4 lg:sticky lg:top-20 space-y-5">
              <div className="bg-white border-2 border-[#C59B27] rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
                {/* Header Profile */}
                <div className="text-center pb-4 border-b border-[#E6DFD5] space-y-1">
                  <span className="inline-block bg-[#8B1E21] text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-xs">
                    HỒ SƠ BÁO GIÁ TRỰC TIẾP
                  </span>
                  <h3 className="font-serif text-xl font-bold text-[#262626] pt-1">
                    Tóm Tắt Đàn Lễ Tùy Biến
                  </h3>
                  <p className="text-[11.5px] text-gray-500">
                    Báo giá minh bạch · Không qua trung gian
                  </p>
                </div>

                {/* Counters list */}
                <div className="py-2 space-y-2.5 text-xs sm:text-[13px] border-b border-[#E6DFD5]">
                  <div className="flex justify-between items-center text-[#262626]">
                    <span className="text-gray-600">Linh phẩm đang chọn:</span>
                    <strong className="text-[#8B1E21] font-bold text-sm">
                      {activeItemsCount} thành phần
                    </strong>
                  </div>

                  {addedItemsCount > 0 && (
                    <div className="flex justify-between items-center text-[#8C6D18]">
                      <span>Linh phẩm thêm ngoài mẫu:</span>
                      <strong className="font-bold">+{addedItemsCount}</strong>
                    </div>
                  )}

                  {removedItemsCount > 0 && (
                    <div className="flex justify-between items-center text-gray-400">
                      <span className="line-through">Thành phần đã bỏ:</span>
                      <span>-{removedItemsCount}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-gray-600">
                    <span>Ảnh tham khảo đính kèm:</span>
                    <strong className="text-gray-900">{globalImages.length} ảnh</strong>
                  </div>

                  <div className="flex justify-between items-center text-emerald-800 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200">
                    <span className="font-medium flex items-center gap-1">
                      <Clock size={13} />
                      <span>Thời gian phản hồi:</span>
                    </span>
                    <strong className="font-bold">2 - 4 Giờ</strong>
                  </div>
                </div>

                {/* Contact Fields */}
                <div className="space-y-3 pt-1">
                  <div className="font-serif text-sm font-bold text-[#262626] flex items-center gap-1.5">
                    <User size={15} className="text-[#8B1E21]" />
                    <span>Thông Tin Tiếp Nhận Báo Giá</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                      Họ và tên người đặt *
                    </label>
                    <input
                      type="text"
                      required
                      value={contactInfo.fullName}
                      onChange={(e) => setContactInfo({ ...contactInfo, fullName: e.target.value })}
                      placeholder="VD: Đặng Thị Ánh Tuyết"
                      className="w-full bg-[#FAF7F2] border border-[#D5CCC1] text-xs sm:text-sm rounded-xl px-3.5 py-2.5 focus:border-[#8B1E21] focus:bg-white focus:outline-none transition-all font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                      Số điện thoại nhận báo giá *
                    </label>
                    <input
                      type="tel"
                      required
                      value={contactInfo.phone}
                      onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
                      placeholder="VD: 0396 163 773"
                      className="w-full bg-[#FAF7F2] border border-[#D5CCC1] text-xs sm:text-sm rounded-xl px-3.5 py-2.5 focus:border-[#8B1E21] focus:bg-white focus:outline-none transition-all font-medium font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                      Ngày cần đàn lễ / Ngày khai đàn
                    </label>
                    <input
                      type="text"
                      value={contactInfo.eventDate}
                      onChange={(e) => setContactInfo({ ...contactInfo, eventDate: e.target.value })}
                      placeholder="VD: Sáng 15 tháng Giêng (âm lịch)"
                      className="w-full bg-[#FAF7F2] border border-[#D5CCC1] text-xs sm:text-sm rounded-xl px-3.5 py-2.5 focus:border-[#8B1E21] focus:bg-white focus:outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                      Địa chỉ lập đàn / Giao hàng
                    </label>
                    <input
                      type="text"
                      value={contactInfo.altarAddress}
                      onChange={(e) => setContactInfo({ ...contactInfo, altarAddress: e.target.value })}
                      placeholder="Đền / Phủ / Gia thất (Hà Nội, Bắc Ninh...)"
                      className="w-full bg-[#FAF7F2] border border-[#D5CCC1] text-xs sm:text-sm rounded-xl px-3.5 py-2.5 focus:border-[#8B1E21] focus:bg-white focus:outline-none transition-all"
                    />
                  </div>

                  {/* Submit CTA */}
                  {!user ? (
                    <div className="space-y-2.5 mt-2">
                      <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 leading-relaxed flex items-start gap-2 shadow-xs">
                        <AlertCircle size={15} className="text-[#8B1E21] shrink-0 mt-0.5" />
                        <div>
                          Quý khách đang xem mẫu dưới quyền <strong>Khách</strong>. Vui lòng đăng nhập tài khoản để gửi yêu cầu báo giá tới Thợ cả.
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (openAuthModal) openAuthModal();
                          else navigate(`/dang-nhap?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
                        }}
                        className="w-full py-3.5 px-4 bg-[#8B1E21] hover:bg-[#A32427] text-white rounded-xl text-sm font-bold shadow-lg hover:shadow-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                      >
                        <Lock size={16} />
                        <span>ĐĂNG NHẬP ĐỂ GỬI YÊU CẦU</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-3.5 px-4 bg-[#8B1E21] hover:bg-[#A32427] text-white rounded-xl text-sm font-bold shadow-lg hover:shadow-xl flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-50 cursor-pointer mt-2"
                    >
                      <span>{submitting ? 'Đang Chuyển Tới Thợ Cả...' : 'GỬI YÊU CẦU BÁO GIÁ'}</span>
                      <ArrowRight size={17} />
                    </button>
                  )}
                </div>

                {/* Trust reassurances */}
                <div className="pt-3 border-t border-[#E6DFD5] space-y-1.5 text-[11px] text-gray-500">
                  <div className="flex items-center gap-1.5 text-gray-700">
                    <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                    <span>Không yêu cầu đặt cọc trước</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-700">
                    <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                    <span>Khảo sát nan giang & giấy dó trước khi báo giá</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-700">
                    <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                    <span>Thợ cả liên hệ trực tiếp tư vấn khoa nghi</span>
                  </div>
                </div>

                {/* Hotline Contact */}
                <div className="pt-2 text-center text-xs text-gray-600 border-t border-[#E6DFD5]">
                  <span>Hotline Thợ Cả tư vấn 24/7: </span>
                  <a href="tel:0396163773" className="text-[#8B1E21] font-bold hover:underline">
                    0396.163.773
                  </a>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* ========================================================
          MODAL: THÊM SẢN PHẨM KHÁC TỪ KHO HOẶC TỰ NHẬP MÓN RIÊNG
         ======================================================== */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white border border-[#E6DFD5] rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-zoomIn">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#E6DFD5] flex items-center justify-between bg-[#FAF7F2]">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#262626]">
                  Thêm Linh Phẩm Vào Bộ Mẫu
                </h3>
                <p className="text-xs text-[#584140] mt-0.5">
                  Chọn từ kho lễ phẩm sẵn có hoặc tự nhập bất kỳ món nào theo phong tục bản đền.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowProductModal(false)}
                className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* TAB SELECTOR */}
            <div className="flex border-b border-[#E6DFD5] bg-[#F4EFEB]">
              <button
                type="button"
                onClick={() => setModalTab('CATALOG')}
                className={`flex-1 py-3 px-4 text-xs sm:text-[13px] font-bold flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
                  modalTab === 'CATALOG'
                    ? 'bg-white text-[#8B1E21] border-[#8B1E21]'
                    : 'text-gray-600 hover:text-gray-900 border-transparent hover:bg-white/50'
                }`}
              >
                <Package size={16} />
                <span>Chọn Từ Kho Có Sẵn ({allProducts.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setModalTab('CUSTOM')}
                className={`flex-1 py-3 px-4 text-xs sm:text-[13px] font-bold flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
                  modalTab === 'CUSTOM'
                    ? 'bg-white text-[#8B1E21] border-[#8B1E21]'
                    : 'text-gray-600 hover:text-gray-900 border-transparent hover:bg-white/50'
                }`}
              >
                <Sparkles size={16} className="text-amber-600" />
                <span>✍️ Tự Nhập Món Yêu Cầu Riêng</span>
              </button>
            </div>

            {/* TAB 1: CATALOG PRODUCTS */}
            {modalTab === 'CATALOG' && (
              <>
                <div className="p-3.5 border-b border-[#E6DFD5] bg-white">
                  <div className="relative">
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="Tìm kiếm lễ phẩm: ngựa, xe, thuyền rồng, vàng mã, tướng..."
                      className="w-full bg-[#FAF7F2] border border-[#D5CCC1] text-xs sm:text-sm rounded-xl px-3.5 py-2.5 pl-10 focus:border-[#8B1E21] focus:bg-white focus:outline-none"
                    />
                    <Search size={17} className="absolute left-3.5 top-3 text-gray-400" />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 divide-y divide-[#E6DFD5]">
                  {allProducts
                    .filter((p) => p.name.toLowerCase().includes(productSearch.toLowerCase()))
                    .map((prod) => (
                      <div key={prod._id} className="py-3 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5">
                          <img
                            src={
                              prod.thumbnail ||
                              prod.images?.[0] ||
                              'https://images.unsplash.com/photo-1582650625119-3a31f8fa2699?auto=format&fit=crop&w=120&q=80'
                            }
                            alt={prod.name}
                            className="w-14 h-14 rounded-xl object-cover border border-[#E6DFD5] bg-gray-100 shrink-0"
                          />
                          <div>
                            <div className="font-serif text-sm sm:text-base font-bold text-[#262626]">
                              {prod.name}
                            </div>
                            <div className="text-xs text-[#8B1E21] font-semibold mt-0.5">
                              {Number(prod.price).toLocaleString('vi-VN')} đ / {prod.unit || 'bộ'}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleAddProductFromCatalog(prod)}
                          className="px-3.5 py-2 bg-[#8B1E21] hover:bg-[#A32427] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1 transition-all shrink-0 cursor-pointer active:scale-95"
                        >
                          <Plus size={14} />
                          <span>Thêm Vào Đơn</span>
                        </button>
                      </div>
                    ))}
                </div>
              </>
            )}

            {/* TAB 2: CUSTOM PRODUCT FORM */}
            {modalTab === 'CUSTOM' && (
              <form onSubmit={handleAddCustomProduct} className="flex-1 overflow-y-auto p-5 space-y-4">
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed">
                  💡 <strong>Yêu cầu riêng:</strong> Bạn có thể điền bất kỳ sản phẩm nào theo nhu cầu đàn tràng, đền phủ riêng. Thợ Cả sẽ xem ảnh minh họa, quy cách và gửi bảng báo giá chi tiết trước khi gia công.
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">
                    Tên sản phẩm / Linh phẩm bạn cần làm <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={customItemForm.name}
                    onChange={(e) => setCustomItemForm({ ...customItemForm, name: e.target.value })}
                    placeholder="Ví dụ: Ngựa Bạch Mao khảm ngọc 2m2, Thuyền Rồng Tam Phủ..."
                    className="w-full bg-[#FAF7F2] border border-[#D5CCC1] text-xs sm:text-sm rounded-xl px-3.5 py-2.5 focus:border-[#8B1E21] focus:bg-white focus:outline-none font-medium"
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-800 mb-1">
                      Số lượng <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={customItemForm.quantity}
                      onChange={(e) =>
                        setCustomItemForm({
                          ...customItemForm,
                          quantity: Math.max(1, parseInt(e.target.value) || 1),
                        })
                      }
                      className="w-full bg-[#FAF7F2] border border-[#D5CCC1] text-xs sm:text-sm rounded-xl px-3.5 py-2.5 focus:border-[#8B1E21] focus:bg-white focus:outline-none font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-800 mb-1">
                      Đơn vị tính
                    </label>
                    <select
                      value={customItemForm.unit}
                      onChange={(e) => setCustomItemForm({ ...customItemForm, unit: e.target.value })}
                      className="w-full bg-[#FAF7F2] border border-[#D5CCC1] text-xs sm:text-sm rounded-xl px-3.5 py-2.5 focus:border-[#8B1E21] focus:bg-white focus:outline-none"
                    >
                      <option value="chiếc">chiếc</option>
                      <option value="bộ">bộ</option>
                      <option value="vị">vị</option>
                      <option value="mâm">mâm</option>
                      <option value="đôi">đôi</option>
                      <option value="cặp">cặp</option>
                      <option value="ông">ông (ngựa / voi / hổ)</option>
                      <option value="pho">pho</option>
                      <option value="cây">cây</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">
                    Ảnh minh họa nếu có (Tùy chọn)
                  </label>
                  {customItemForm.image ? (
                    <div className="relative w-28 h-28 rounded-xl border border-amber-300 overflow-hidden shadow-xs bg-gray-50">
                      <img
                        src={customItemForm.image}
                        alt="Ảnh minh họa"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setCustomItemForm({ ...customItemForm, image: '' })}
                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 shadow hover:bg-red-700"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-[#D5CCC1] hover:border-[#8B1E21] rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer bg-[#FAF7F2] hover:bg-[#F5EFE6] transition-colors">
                      <Upload size={22} className="text-gray-400 mb-1" />
                      <span className="text-xs font-semibold text-gray-700">
                        {customItemForm.uploadingImage
                          ? 'Đang tải ảnh lên...'
                          : 'Bấm để tải ảnh từ máy hoặc điện thoại'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleCustomItemImageUpload}
                        disabled={customItemForm.uploadingImage}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">
                    Ghi chú chi tiết cho linh phẩm này
                  </label>
                  <input
                    type="text"
                    value={customItemForm.note}
                    onChange={(e) => setCustomItemForm({ ...customItemForm, note: e.target.value })}
                    placeholder="Mô tả chất liệu, màu sắc, hoa văn mong muốn..."
                    className="w-full bg-[#FAF7F2] border border-[#D5CCC1] text-xs sm:text-sm rounded-xl px-3.5 py-2.5 focus:border-[#8B1E21] focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowProductModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-100"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#8B1E21] hover:bg-[#A32427] text-white text-xs font-bold rounded-xl shadow-xs"
                  >
                    Thêm Vào Đơn
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: PHÓNG TO ẢNH LINH PHẨM (ZOOM VIEWER)
         ======================================================== */}
      {zoomImage && (
        <div
          className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setZoomImage(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h4 className="font-serif font-bold text-base text-gray-900">{zoomImage.name}</h4>
                <span className="text-xs text-gray-500">Đơn vị: {zoomImage.unit}</span>
              </div>
              <button
                type="button"
                onClick={() => setZoomImage(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            <div className="aspect-square bg-gray-100 overflow-hidden">
              <img src={zoomImage.url} alt={zoomImage.name} className="w-full h-full object-cover" />
            </div>
            {zoomImage.note && (
              <div className="p-3.5 bg-amber-50 text-xs text-amber-900 border-t border-amber-100">
                <strong>Ghi chú:</strong> {zoomImage.note}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
