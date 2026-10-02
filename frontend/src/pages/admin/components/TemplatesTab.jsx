import React, { useState, useEffect, useRef } from 'react';
import {
  Boxes,
  Plus,
  Edit,
  Trash2,
  Loader2,
  Upload,
  CheckCircle2,
  XCircle,
  Eye,
  Search,
  Package,
  Sparkles,
  X,
} from 'lucide-react';
import { formatVND } from '../../../utils/exportUtils';
import ConfirmModal from './ConfirmModal';

export default function TemplatesTab({ token }) {
  const [templates, setTemplates] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Bulk selection & Filter states
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    subtitle: '',
    category: 'Đàn Tràng Tứ Phủ',
    priceType: 'CONTACT_FOR_QUOTE',
    basePrice: 0,
    discountPrice: 0,
    description: '',
    ritualGuide: '',
    thumbnail: '',
    items: [],
  });
  const [submitting, setSubmitting] = useState(false);

  // Uploading states
  const templateFileInputRef = useRef(null);
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [uploadingItemIdx, setUploadingItemIdx] = useState(null);

  // Sub-modal Thêm sản phẩm vào bộ mẫu
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [addProductTab, setAddProductTab] = useState('CATALOG'); // 'CATALOG' | 'CUSTOM'
  const [selectedCatalogProductId, setSelectedCatalogProductId] = useState('');
  const [newCustomProduct, setNewCustomProduct] = useState({
    name: '',
    image: '',
    description: '',
    defaultQuantity: 1,
    required: false,
    editableQuantity: true,
  });
  const [uploadingNewProductImage, setUploadingNewProductImage] = useState(false);
  const newProductFileInputRef = useRef(null);

  // Single Delete Confirm
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const [tplRes, prodRes] = await Promise.all([
        fetch('/api/templates/admin', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/products?limit=100'),
      ]);
      const [tplData, prodData] = await Promise.all([tplRes.json(), prodRes.json()]);
      if (tplData.success) setTemplates(tplData.data);
      if (prodData.success) setProducts(prodData.data);
    } catch (err) {
      console.error('Lỗi tải bộ mẫu:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const openCreateModal = () => {
    setEditingTemplate(null);
    setTemplateForm({
      name: '',
      subtitle: '',
      category: 'Đàn Tràng Tứ Phủ',
      priceType: 'CONTACT_FOR_QUOTE',
      basePrice: 0,
      discountPrice: 0,
      description: '',
      ritualGuide: '',
      thumbnail: '',
      items: [],
    });
    setIsModalOpen(true);
  };

  const openEditModal = (tpl) => {
    setEditingTemplate(tpl);
    setTemplateForm({
      name: tpl.name,
      subtitle: tpl.subtitle || '',
      category: tpl.category || 'Đàn Tràng Tứ Phủ',
      priceType: tpl.priceType || 'CONTACT_FOR_QUOTE',
      basePrice: tpl.basePrice || 0,
      discountPrice: tpl.discountPrice || 0,
      description: tpl.description || '',
      ritualGuide: tpl.ritualGuide || '',
      thumbnail: tpl.thumbnail || '',
      items: (tpl.items || []).map((it) => ({
        productId: it.productId?._id || it.productId,
        productNameSnapshot: it.productNameSnapshot || it.productId?.name || 'Linh phẩm',
        image: it.image || it.productId?.thumbnail || it.productId?.images?.[0] || '',
        defaultQuantity: it.defaultQuantity || 1,
        required: Boolean(it.required),
        removable: it.removable !== undefined ? Boolean(it.removable) : !it.required,
        editableQuantity: it.editableQuantity !== undefined ? Boolean(it.editableQuantity) : true,
        description: it.description || it.note || '',
        note: it.note || it.description || '',
      })),
    });
    setIsModalOpen(true);
  };

  const handleThumbUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingThumb(true);
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch('/api/banners/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      const uploadedUrl = data.imageUrl || data.url || data.data?.imageUrl || data.data?.url;
      if (data.success && uploadedUrl) {
        setTemplateForm((prev) => ({ ...prev, thumbnail: uploadedUrl }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingThumb(false);
      if (templateFileInputRef.current) templateFileInputRef.current.value = '';
    }
  };

  const handleItemPhotoUpload = async (index, file) => {
    if (!file) return;
    try {
      setUploadingItemIdx(index);
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch('/api/banners/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      const uploadedUrl = data.imageUrl || data.url || data.data?.imageUrl || data.data?.url;
      if (data.success && uploadedUrl) {
        setTemplateForm((prev) => {
          const newItems = [...prev.items];
          newItems[index] = { ...newItems[index], image: uploadedUrl };
          return { ...prev, items: newItems };
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingItemIdx(null);
    }
  };

  const handleUploadNewProductImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingNewProductImage(true);
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch('/api/banners/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      const uploadedUrl = data.imageUrl || data.url || data.data?.imageUrl || data.data?.url;
      if (data.success && uploadedUrl) {
        setNewCustomProduct((prev) => ({ ...prev, image: uploadedUrl }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingNewProductImage(false);
      if (newProductFileInputRef.current) newProductFileInputRef.current.value = '';
    }
  };

  const handleAddProductFromCatalog = () => {
    const prodId = selectedCatalogProductId || products[0]?._id;
    const prod = products.find((p) => p._id === prodId);
    if (!prod) return;

    setTemplateForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          productId: prod._id,
          productNameSnapshot: prod.name,
          image: prod.thumbnail || prod.images?.[0] || '',
          description: prod.shortDescription || prod.description || '',
          defaultQuantity: 1,
          required: false,
          removable: true,
          editableQuantity: true,
          note: '',
        },
      ],
    }));
    setIsAddProductModalOpen(false);
  };

  const handleAddCustomProductToTemplate = (e) => {
    e.preventDefault();
    if (!newCustomProduct.name.trim()) {
      alert('Vui lòng nhập tên sản phẩm.');
      return;
    }

    setTemplateForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          productId: null,
          productNameSnapshot: newCustomProduct.name.trim(),
          image: newCustomProduct.image.trim(),
          description: newCustomProduct.description.trim(),
          defaultQuantity: Math.max(1, Number(newCustomProduct.defaultQuantity) || 1),
          required: Boolean(newCustomProduct.required),
          removable: !newCustomProduct.required,
          editableQuantity: Boolean(newCustomProduct.editableQuantity),
          note: newCustomProduct.description.trim(),
        },
      ],
    }));

    setNewCustomProduct({
      name: '',
      image: '',
      description: '',
      defaultQuantity: 1,
      required: false,
      editableQuantity: true,
    });
    setIsAddProductModalOpen(false);
  };

  const handleToggleStatus = async (id) => {
    try {
      await fetch(`/api/templates/${id}/toggle-status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchTemplates();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveTemplate = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const url = editingTemplate
        ? `/api/templates/${editingTemplate._id}`
        : '/api/templates';
      const method = editingTemplate ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(templateForm),
      });
      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        fetchTemplates();
      } else {
        alert(data.message || 'Lỗi lưu bộ mẫu');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      const res = await fetch(`/api/templates/${deletingId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setDeleteConfirmOpen(false);
        setDeletingId(null);
        setSelectedIds((prev) => prev.filter((id) => id !== deletingId));
        fetchTemplates();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Bulk Selection Handlers
  const filteredTemplates = templates.filter((tpl) => {
    if (categoryFilter && tpl.category !== categoryFilter) return false;
    if (search) {
      const term = search.toLowerCase();
      return (
        tpl.name?.toLowerCase().includes(term) ||
        tpl.subtitle?.toLowerCase().includes(term) ||
        tpl.category?.toLowerCase().includes(term)
      );
    }
    return true;
  });

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (filteredTemplates.length === 0) return;
    const allSelected = filteredTemplates.every((t) => selectedIds.includes(t._id));
    if (allSelected) {
      // Unselect all visible
      const visibleIds = new Set(filteredTemplates.map((t) => t._id));
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.has(id)));
    } else {
      // Select all visible
      const visibleIds = filteredTemplates.map((t) => t._id);
      setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const handleBulkDeleteConfirm = async () => {
    if (selectedIds.length === 0) return;
    try {
      setBulkDeleting(true);
      const res = await fetch('/api/templates/bulk-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ids: selectedIds }),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedIds([]);
        setBulkDeleteConfirmOpen(false);
        fetchTemplates();
      } else {
        alert(data.message || 'Lỗi khi xóa hàng loạt bộ mẫu');
      }
    } catch (err) {
      console.error('Lỗi bulk delete templates:', err);
      alert('Lỗi kết nối khi xóa hàng loạt bộ mẫu');
    } finally {
      setBulkDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Đàn Phủ</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Cấu hình các bộ mẫu đàn quy chuẩn: Đàn Tứ Phủ, Lễ Tiết Bốn Mùa, Lễ Gia Tiên
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 px-4 py-2 bg-amber-400 hover:bg-amber-500 text-black text-xs font-bold rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo Bộ Mẫu Mới</span>
        </button>
      </div>

      {/* Filter and Bulk Action Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Checkbox select all */}
          <label className="flex items-center gap-2 cursor-pointer select-none px-3 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 transition-colors">
            <input
              type="checkbox"
              checked={
                filteredTemplates.length > 0 &&
                filteredTemplates.every((t) => selectedIds.includes(t._id))
              }
              onChange={handleSelectAll}
              className="rounded text-red-600 focus:ring-red-500 w-4 h-4 cursor-pointer"
            />
            <span>
              Chọn tất cả ({filteredTemplates.length})
            </span>
          </label>

          {/* Search Input */}
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <input
              type="text"
              placeholder="Tìm tên bộ mẫu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-amber-600"
            />
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2" />
          </div>

          {/* Category filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-amber-600"
          >
            <option value="">Tất cả phân loại</option>
            <option value="Đàn Tràng Tứ Phủ">Đàn Tràng Tứ Phủ</option>
            <option value="Lễ Tiết Bốn Mùa">Lễ Tiết Bốn Mùa</option>
            <option value="Lễ Gia Tiên & Đầy Tháng">Lễ Gia Tiên & Đầy Tháng</option>
            <option value="Bộ Lễ Tùy Chỉnh Tiêu Biểu">Bộ Lễ Tùy Chỉnh Tiêu Biểu</option>
          </select>
        </div>

        {/* Bulk Delete Button */}
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <span className="text-xs font-medium text-gray-600">
              Đã chọn: <strong className="text-red-600 font-bold">{selectedIds.length}</strong> bộ mẫu
            </span>
          )}
          <button
            type="button"
            onClick={() => setBulkDeleteConfirmOpen(true)}
            disabled={selectedIds.length === 0}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg shadow-2xs transition-all ${
              selectedIds.length > 0
                ? 'bg-red-600 hover:bg-red-700 text-white cursor-pointer animate-pulse'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
            }`}
            title={selectedIds.length === 0 ? 'Hãy tích chọn ít nhất 1 bộ mẫu để xóa' : 'Xóa các bộ mẫu đã chọn'}
          >
            <Trash2 className="w-4 h-4" />
            <span>Xóa Hàng Loạt ({selectedIds.length})</span>
          </button>
          {selectedIds.length > 0 && (
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="text-xs text-gray-500 hover:text-gray-800 underline px-1"
            >
              Bỏ chọn
            </button>
          )}
        </div>
      </div>

      {/* Grid Cards of Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-3 py-12 text-center text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin text-amber-600 mx-auto mb-2" />
            <span>Đang nạp bộ mẫu hàng mã...</span>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="col-span-3 py-8 text-center text-gray-400 bg-white rounded-xl border border-gray-200">
            {search || categoryFilter ? 'Không tìm thấy bộ mẫu phù hợp bộ lọc' : 'Chưa có bộ mẫu nào'}
          </div>
        ) : (
          filteredTemplates.map((tpl) => {
            const isSelected = selectedIds.includes(tpl._id);
            return (
              <div
                key={tpl._id}
                className={`bg-white rounded-xl border shadow-xs overflow-hidden flex flex-col justify-between transition-all relative ${
                  isSelected
                    ? 'border-red-500 ring-2 ring-red-400/40 bg-red-50/10'
                    : tpl.status === 'ACTIVE'
                    ? 'border-gray-200 hover:border-amber-300'
                    : 'border-gray-200 opacity-60'
                }`}
              >
                {/* Selection Checkbox */}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleSelect(tpl._id);
                  }}
                  className="absolute top-2.5 left-2.5 z-20 cursor-pointer"
                  title={isSelected ? 'Bỏ chọn bộ mẫu' : 'Chọn bộ mẫu này'}
                >
                  <div
                    className={`w-6 h-6 rounded-md flex items-center justify-center transition-all shadow-md ${
                      isSelected
                        ? 'bg-red-600 text-white border-2 border-white ring-2 ring-red-400'
                        : 'bg-white/90 text-transparent hover:text-gray-400 border border-gray-300 backdrop-blur-xs'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>

                <div className="relative h-40 bg-gray-900 overflow-hidden">
                  <img
                    src={tpl.thumbnail || 'https://via.placeholder.com/300'}
                    alt={tpl.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent p-3 flex flex-col justify-between">
                    <div className="flex justify-between items-center pl-7">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-600 text-white">
                        {tpl.category}
                      </span>
                      <button
                        onClick={() => handleToggleStatus(tpl._id)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          tpl.status === 'ACTIVE'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-gray-600 text-gray-200'
                        }`}
                      >
                        {tpl.status === 'ACTIVE' ? 'Đang bật' : 'Đang ẩn'}
                      </button>
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-sm line-clamp-1">{tpl.name}</h4>
                      <p className="text-gray-200 text-[11px] line-clamp-1">{tpl.subtitle}</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Số linh phẩm trong bộ:</span>
                    <span className="font-bold text-gray-800">{tpl.items?.length || 0} món</span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Giá tham chiếu:</span>
                    <div className="text-right">
                      {tpl.discountPrice > 0 ? (
                        <div className="flex items-center gap-1.5 justify-end">
                          <span className="font-mono font-bold text-red-600">
                            {formatVND(tpl.discountPrice)}
                          </span>
                          {tpl.basePrice > 0 && (
                            <span className="font-mono text-gray-400 line-through text-[11px]">
                              {formatVND(tpl.basePrice)}
                            </span>
                          )}
                        </div>
                      ) : tpl.basePrice > 0 ? (
                        <span className="font-mono font-bold text-primary-900">
                          {formatVND(tpl.basePrice)}
                        </span>
                      ) : (
                        <span className="text-gray-500 italic">Liên hệ khảo sát</span>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                    <label
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer select-none"
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(tpl._id)}
                        className="rounded text-red-600 focus:ring-red-500 w-3.5 h-3.5 cursor-pointer"
                      />
                      <span>{isSelected ? 'Đã chọn' : 'Chọn'}</span>
                    </label>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openEditModal(tpl)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md"
                        title="Chỉnh sửa bộ mẫu"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setDeletingId(tpl._id);
                          setDeleteConfirmOpen(true);
                        }}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md"
                        title="Xóa bộ mẫu"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Add / Edit Template */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-primary-950 text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold tracking-wide">
                  {editingTemplate ? 'Chỉnh Sửa Bộ Mẫu Hàng Mã' : 'Tạo Bộ Mẫu Hàng Mã Mới'}
                </h3>
                <p className="text-[11px] text-gray-300">
                  Cấu hình linh phẩm bắt buộc/tùy chọn và ảnh mẫu chi tiết
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTemplate} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Tên bộ mẫu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-600 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Phân loại khóa lễ
                  </label>
                  <input
                    type="text"
                    list="ritualCategorySuggestions"
                    value={templateForm.category}
                    onChange={(e) =>
                      setTemplateForm({ ...templateForm, category: e.target.value })
                    }
                    placeholder="Tự điền loại khóa lễ (VD: Đàn Tràng Tứ Phủ, Lễ Tạ Mộ...)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-amber-600"
                  />
                  <datalist id="ritualCategorySuggestions">
                    <option value="Đàn Tràng Tứ Phủ" />
                    <option value="Lễ Tiết Bốn Mùa" />
                    <option value="Lễ Gia Tiên & Bản Thổ" />
                    <option value="Lễ Tạ Mộ & Thanh Minh" />
                    <option value="Lễ Sang Cát & Cầu Siêu" />
                    <option value="Bộ Lễ Tùy Chỉnh Tiêu Biểu" />
                  </datalist>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Phụ đề / Câu giới thiệu ngắn
                </label>
                <input
                  type="text"
                  value={templateForm.subtitle}
                  onChange={(e) =>
                    setTemplateForm({ ...templateForm, subtitle: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Giá gốc niêm yết (đ)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={templateForm.basePrice}
                    onChange={(e) =>
                      setTemplateForm({ ...templateForm, basePrice: Number(e.target.value) })
                    }
                    placeholder="0 (để trống nếu báo giá riêng)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono focus:outline-none focus:border-amber-600"
                  />
                  <span className="text-[10px] text-gray-500 mt-0.5 block">Giá niêm yết trước giảm</span>
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1 text-red-700">
                    Giá giảm (đ)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={templateForm.discountPrice}
                    onChange={(e) =>
                      setTemplateForm({ ...templateForm, discountPrice: Number(e.target.value) })
                    }
                    placeholder="0 (nếu không có giảm giá)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono focus:outline-none focus:border-amber-600 font-bold text-red-700"
                  />
                  <span className="text-[10px] text-gray-500 mt-0.5 block">Giá bán thực tế sau khi giảm</span>
                </div>
              </div>

              {/* Thumbnail upload */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Ảnh đại diện bộ mẫu
                </label>
                <div className="flex gap-2">
                  <input
                    type="file"
                    ref={templateFileInputRef}
                    onChange={handleThumbUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <input
                    type="text"
                    value={templateForm.thumbnail}
                    onChange={(e) =>
                      setTemplateForm({ ...templateForm, thumbnail: e.target.value })
                    }
                    placeholder="https://... hoặc tải từ máy tính"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg font-mono focus:outline-none focus:border-amber-600"
                  />
                  <button
                    type="button"
                    onClick={() => templateFileInputRef.current?.click()}
                    disabled={uploadingThumb}
                    className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white font-semibold rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    {uploadingThumb ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    <span>Tải Từ Máy</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Mô tả chi tiết lễ nghi
                </label>
                <textarea
                  rows="2"
                  value={templateForm.description}
                  onChange={(e) =>
                    setTemplateForm({ ...templateForm, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-600"
                />
              </div>

              {/* Items in template */}
              <div className="pt-2 border-t border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-gray-900 uppercase">
                    Danh Sách Linh Phẩm Cấu Thành ({templateForm.items.length} sản phẩm)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddProductModalOpen(true);
                      setAddProductTab('CATALOG');
                    }}
                    className="px-3.5 py-1.5 bg-amber-400 text-black font-bold rounded-lg hover:bg-amber-500 transition-colors flex items-center gap-1.5 shadow-xs text-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Thêm Sản Phẩm</span>
                  </button>
                </div>

                <div className="space-y-2.5 max-h-72 overflow-y-auto">
                  {templateForm.items.length === 0 ? (
                    <div className="p-6 text-center text-gray-400 bg-gray-50 border border-dashed border-gray-200 rounded-lg">
                      Chưa có linh phẩm nào trong bộ mẫu. Bấm <strong>"+ Thêm Sản Phẩm"</strong> để bổ sung.
                    </div>
                  ) : (
                    templateForm.items.map((it, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-2 text-xs"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5 flex-1 min-w-0">
                            {/* Image with upload overlay */}
                            <div className="relative group shrink-0 w-12 h-12 rounded border border-gray-200 overflow-hidden bg-white">
                              <img
                                src={it.image || 'https://via.placeholder.com/48?text=SP'}
                                alt="mẫu"
                                className="w-full h-full object-cover"
                              />
                              <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white cursor-pointer transition-opacity text-[9px] font-semibold">
                                <span>Đổi ảnh</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleItemPhotoUpload(idx, e.target.files?.[0])}
                                  className="hidden"
                                />
                              </label>
                            </div>

                            <div className="flex-1 min-w-0">
                              {/* Product Name */}
                              <input
                                type="text"
                                value={it.productNameSnapshot}
                                onChange={(e) => {
                                  const newItems = [...templateForm.items];
                                  newItems[idx].productNameSnapshot = e.target.value;
                                  setTemplateForm({ ...templateForm, items: newItems });
                                }}
                                placeholder="Tên sản phẩm..."
                                className="font-bold text-gray-900 bg-white border border-gray-300 rounded px-2 py-1 w-full text-xs focus:outline-none focus:border-amber-600"
                              />

                              {/* Description / Quy cách */}
                              <input
                                type="text"
                                value={it.description || it.note || ''}
                                onChange={(e) => {
                                  const newItems = [...templateForm.items];
                                  newItems[idx].description = e.target.value;
                                  newItems[idx].note = e.target.value;
                                  setTemplateForm({ ...templateForm, items: newItems });
                                }}
                                placeholder="Mô tả quy cách, kích thước, chi tiết linh phẩm..."
                                className="text-[11px] text-gray-600 bg-white border border-gray-200 rounded px-2 py-0.5 w-full mt-1 focus:outline-none focus:border-amber-600 placeholder:italic"
                              />
                            </div>
                          </div>

                          {/* Controls */}
                          <div className="flex items-center gap-2 shrink-0 pt-0.5">
                            <span className="text-gray-500 font-semibold">SL:</span>
                            <input
                              type="number"
                              min="1"
                              value={it.defaultQuantity}
                              onChange={(e) => {
                                const newItems = [...templateForm.items];
                                newItems[idx].defaultQuantity = Math.max(1, Number(e.target.value) || 1);
                                setTemplateForm({ ...templateForm, items: newItems });
                              }}
                              className="w-14 px-2 py-1 border border-gray-300 rounded font-mono font-bold text-center bg-white"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newItems = templateForm.items.filter((_, i) => i !== idx);
                                setTemplateForm({ ...templateForm, items: newItems });
                              }}
                              className="p-1.5 text-rose-600 hover:bg-rose-100 rounded transition-colors"
                              title="Xóa khỏi bộ mẫu"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Checkboxes row */}
                        <div className="flex flex-wrap items-center gap-4 text-[11px] text-gray-600 pl-[3.5rem]">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={it.required}
                              onChange={(e) => {
                                const newItems = [...templateForm.items];
                                newItems[idx].required = e.target.checked;
                                if (e.target.checked) newItems[idx].removable = false;
                                setTemplateForm({ ...templateForm, items: newItems });
                              }}
                              className="rounded text-amber-600"
                            />
                            <span>Bắt buộc trong mẫu</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={it.editableQuantity}
                              onChange={(e) => {
                                const newItems = [...templateForm.items];
                                newItems[idx].editableQuantity = e.target.checked;
                                setTemplateForm({ ...templateForm, items: newItems });
                              }}
                              className="rounded text-amber-600"
                            />
                            <span>Cho phép khách sửa số lượng</span>
                          </label>
                          {it.productId ? (
                            <span className="text-[10px] text-gray-400 font-mono ml-auto">Kho có sẵn</span>
                          ) : (
                            <span className="text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200 font-bold ml-auto">
                              ✦ Tự tạo riêng
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 font-bold text-black bg-amber-400 hover:bg-amber-500 rounded-lg shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingTemplate ? 'Lưu Thay Đổi' : 'Tạo Bộ Mẫu'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUB-MODAL: THÊM SẢN PHẨM VÀO BỘ MẪU */}
      {isAddProductModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="px-5 py-3.5 border-b border-gray-200 bg-primary-950 text-white flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold tracking-wide">
                  Thêm Sản Phẩm Vào Bộ Mẫu
                </h4>
                <p className="text-[11px] text-gray-300">
                  Chọn sản phẩm có sẵn hoặc tự điền Tên - Hình ảnh - Mô tả sản phẩm mới
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddProductModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Tab switch */}
            <div className="flex border-b border-gray-200 bg-gray-50 text-xs font-bold">
              <button
                type="button"
                onClick={() => setAddProductTab('CATALOG')}
                className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 border-b-2 transition-all ${
                  addProductTab === 'CATALOG'
                    ? 'border-amber-600 text-amber-700 bg-white'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Từ Danh Mục Kho ({products.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setAddProductTab('CUSTOM')}
                className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 border-b-2 transition-all ${
                  addProductTab === 'CUSTOM'
                    ? 'border-amber-600 text-amber-700 bg-white'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>✍️ Tự Thêm Tên - Ảnh - Mô Tả</span>
              </button>
            </div>

            {/* Tab 1: Catalog */}
            {addProductTab === 'CATALOG' && (
              <div className="p-5 space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Chọn sản phẩm có sẵn trong kho:
                  </label>
                  <select
                    value={selectedCatalogProductId || products[0]?._id}
                    onChange={(e) => setSelectedCatalogProductId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-amber-600 text-xs font-medium"
                  >
                    {products.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name} ({formatVND(p.price)})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Preview selected catalog product */}
                {(() => {
                  const sel = products.find((p) => p._id === (selectedCatalogProductId || products[0]?._id));
                  if (!sel) return null;
                  return (
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg flex items-center gap-3">
                      <img
                        src={sel.thumbnail || sel.images?.[0] || 'https://via.placeholder.com/60'}
                        alt={sel.name}
                        className="w-12 h-12 rounded object-cover border border-gray-200 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-gray-900 truncate">{sel.name}</div>
                        <div className="text-[11px] text-gray-500 font-mono">
                          Giá niêm yết: <strong className="text-amber-700">{formatVND(sel.price)}</strong> / {sel.unit || 'chiếc'}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                <div className="pt-3 border-t border-gray-200 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddProductModalOpen(false)}
                    className="px-3.5 py-1.5 font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleAddProductFromCatalog}
                    className="px-4 py-1.5 bg-amber-400 hover:bg-amber-500 text-black font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Thêm Vào Bộ Mẫu</span>
                  </button>
                </div>
              </div>
            )}

            {/* Tab 2: Custom Product */}
            {addProductTab === 'CUSTOM' && (
              <form onSubmit={handleAddCustomProductToTemplate} className="p-5 space-y-3.5 text-xs">
                {/* Name */}
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Tên sản phẩm / Linh phẩm <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newCustomProduct.name}
                    onChange={(e) => setNewCustomProduct({ ...newCustomProduct, name: e.target.value })}
                    placeholder="Ví dụ: Ngựa Bạch Mao khảm ngọc 2m2, Thuyền Rồng..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-600 font-bold"
                    autoFocus
                  />
                </div>

                {/* Image */}
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Hình ảnh minh họa sản phẩm
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newCustomProduct.image}
                      onChange={(e) => setNewCustomProduct({ ...newCustomProduct, image: e.target.value })}
                      placeholder="Dán link ảnh hoặc tải ảnh từ máy..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-600"
                    />
                    <input
                      type="file"
                      ref={newProductFileInputRef}
                      accept="image/*"
                      onChange={handleUploadNewProductImage}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => newProductFileInputRef.current?.click()}
                      disabled={uploadingNewProductImage}
                      className="px-3 py-2 bg-amber-700 hover:bg-amber-800 text-white font-semibold rounded-lg shrink-0 flex items-center gap-1 disabled:opacity-50"
                    >
                      {uploadingNewProductImage ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Upload className="w-3.5 h-3.5" />
                      )}
                      <span>Tải Từ Máy</span>
                    </button>
                  </div>
                  {newCustomProduct.image && (
                    <div className="mt-2 flex items-center gap-2 p-1.5 bg-gray-50 border border-gray-200 rounded-lg w-fit">
                      <img
                        src={newCustomProduct.image}
                        alt="Ảnh minh họa"
                        className="w-10 h-10 object-cover rounded border border-gray-200"
                      />
                      <span className="text-[11px] text-gray-500 font-mono truncate max-w-[200px]">
                        {newCustomProduct.image}
                      </span>
                      <button
                        type="button"
                        onClick={() => setNewCustomProduct({ ...newCustomProduct, image: '' })}
                        className="text-red-500 hover:text-red-700 p-1"
                        title="Bỏ ảnh"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Mô tả sản phẩm / Quy cách chế tác
                  </label>
                  <textarea
                    rows={2}
                    value={newCustomProduct.description}
                    onChange={(e) => setNewCustomProduct({ ...newCustomProduct, description: e.target.value })}
                    placeholder="Ví dụ: Kích thước cao 2m2, khung nan giang già bồi giấy ngũ sắc, chuẩn lề lối đền Mẫu..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-600"
                  />
                </div>

                {/* Quantity & Checkboxes */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-2">
                    <label className="font-semibold text-gray-700">Số lượng:</label>
                    <input
                      type="number"
                      min="1"
                      value={newCustomProduct.defaultQuantity}
                      onChange={(e) => setNewCustomProduct({ ...newCustomProduct, defaultQuantity: Math.max(1, parseInt(e.target.value) || 1) })}
                      className="w-16 px-2 py-1.5 border border-gray-300 rounded-lg text-center font-mono font-bold"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newCustomProduct.required}
                        onChange={(e) => setNewCustomProduct({ ...newCustomProduct, required: e.target.checked })}
                        className="rounded text-amber-600"
                      />
                      <span className="font-medium text-gray-700">Bắt buộc</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newCustomProduct.editableQuantity}
                        onChange={(e) => setNewCustomProduct({ ...newCustomProduct, editableQuantity: e.target.checked })}
                        className="rounded text-amber-600"
                      />
                      <span className="font-medium text-gray-700">Cho phép sửa SL</span>
                    </label>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-gray-200 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddProductModalOpen(false)}
                    className="px-3.5 py-1.5 font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-amber-400 hover:bg-amber-500 text-black font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Thêm Sản Phẩm Này</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      <ConfirmModal
        isOpen={deleteConfirmOpen}
        title="Xóa Bộ Mẫu Hàng Mã"
        message="Bạn có chắc chắn muốn xóa bộ mẫu này không?"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirmOpen(false)}
      />

      {/* Bulk Delete Confirm Modal */}
      <ConfirmModal
        isOpen={bulkDeleteConfirmOpen}
        title="Xác Nhận Xóa Hàng Loạt Bộ Mẫu"
        message={`Bạn có chắc chắn muốn xóa vĩnh viễn ${selectedIds.length} bộ mẫu đã chọn khỏi hệ thống không? Hành động này sẽ loại bỏ hoàn toàn các bộ mẫu này khỏi cơ sở dữ liệu và không thể hoàn tác.`}
        confirmColor="red"
        confirmText={`Xóa ${selectedIds.length} Bộ Mẫu`}
        loading={bulkDeleting}
        onConfirm={handleBulkDeleteConfirm}
        onCancel={() => setBulkDeleteConfirmOpen(false)}
      />
    </div>
  );
}
