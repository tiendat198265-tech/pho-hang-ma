import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Loader2,
  Search,
  Layers,
  Upload,
  Image as ImageIcon,
  X,
  ExternalLink,
  FolderTree,
  Eye,
  EyeOff,
  Filter,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import ConfirmModal from './ConfirmModal';

export default function CategoriesTab({ token }) {
  const [categories, setCategories] = useState([]);
  const [categoryTree, setCategoryTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'ROOT' | 'CHILD' | 'ACTIVE' | 'INACTIVE'

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('CREATE'); // 'CREATE' | 'EDIT'
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    parent: null,
    description: '',
    icon: 'folder',
    image: '',
    sortOrder: 1,
    isActive: true,
  });
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Delete Single
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState(null);

  // Bulk Delete
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [deleteProductsWithCategory, setDeleteProductsWithCategory] = useState(false);

  // Show temporary toast message
  const showToast = (msg, type = 'success') => {
    setToastMessage({ text: msg, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Helper: slugify text
  const slugify = (text) => {
    return text
      .toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const [catRes, treeRes] = await Promise.all([
        fetch('/api/categories?includeInactive=true', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }),
        fetch('/api/categories/tree'),
      ]);

      const [catData, treeData] = await Promise.all([catRes.json(), treeRes.json()]);

      if (catData.success) {
        setCategories(catData.data);
      }
      if (treeData.success) {
        setCategoryTree(treeData.data);
      }
    } catch (err) {
      console.error('Lỗi tải danh mục:', err);
      showToast('Lỗi khi tải danh mục từ máy chủ', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [token]);

  // Lookup map for parent category names
  const categoryMap = useMemo(() => {
    const map = {};
    categories.forEach((c) => {
      map[c._id] = c;
    });
    return map;
  }, [categories]);

  const handleOpenCreate = () => {
    setModalMode('CREATE');
    setEditingId(null);
    setSlugManuallyEdited(false);
    setFormData({
      name: '',
      slug: '',
      parent: null,
      description: '',
      icon: 'folder',
      image: '',
      sortOrder: (categories.length || 0) + 1,
      isActive: true,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c) => {
    setModalMode('EDIT');
    setEditingId(c._id);
    setSlugManuallyEdited(true); // Don't auto-overwrite existing slug unless cleared
    setFormData({
      name: c.name || '',
      slug: c.slug || '',
      parent: c.parent || null,
      description: c.description || '',
      icon: c.icon || 'folder',
      image: c.image || '',
      sortOrder: c.sortOrder ?? 1,
      isActive: c.isActive !== false,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleNameChange = (val) => {
    setFormData((prev) => {
      const next = { ...prev, name: val };
      if (!slugManuallyEdited || !prev.slug) {
        next.slug = slugify(val);
      }
      return next;
    });
  };

  const handleSlugChange = (val) => {
    setSlugManuallyEdited(true);
    setFormData((prev) => ({ ...prev, slug: slugify(val) }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const data = new FormData();
      data.append('image', file);

      const res = await fetch('/api/banners/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: data,
      });

      const result = await res.json();
      const uploadedUrl = result.imageUrl || result.url || result.data?.imageUrl || result.data?.url;
      if (result.success && uploadedUrl) {
        setFormData((prev) => ({ ...prev, image: uploadedUrl }));
        showToast('Tải ảnh minh họa lên thành công');
      } else {
        alert(result.message || 'Lỗi khi tải ảnh lên');
      }
    } catch (err) {
      console.error('Lỗi upload ảnh:', err);
      alert('Lỗi kết nối máy chủ khi tải ảnh');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Vui lòng nhập tên danh mục');
      return;
    }

    try {
      setFormSubmitting(true);
      setFormError(null);

      const url =
        modalMode === 'CREATE'
          ? '/api/categories'
          : `/api/categories/${editingId}`;
      const method = modalMode === 'CREATE' ? 'POST' : 'PUT';

      const payload = {
        ...formData,
        parent: formData.parent === 'root' || !formData.parent ? null : formData.parent,
      };

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
        showToast(
          modalMode === 'CREATE'
            ? `Đã tạo danh mục "${payload.name}" thành công`
            : `Đã cập nhật danh mục "${payload.name}" thành công`
        );
        fetchCategories();
      } else {
        setFormError(result.message || 'Lỗi khi lưu danh mục');
      }
    } catch (err) {
      console.error('Lỗi submit danh mục:', err);
      setFormError('Lỗi kết nối máy chủ');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingCategory) return;
    try {
      const res = await fetch(
        `/api/categories/${deletingCategory._id}?deleteProducts=${deleteProductsWithCategory}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const result = await res.json();
      if (result.success) {
        setDeleteConfirmOpen(false);
        setDeletingCategory(null);
        setDeleteProductsWithCategory(false);
        showToast(result.message || 'Xóa danh mục thành công');
        fetchCategories();
      } else {
        alert(result.message || 'Không thể xóa danh mục này');
      }
    } catch (err) {
      console.error('Lỗi xóa danh mục:', err);
      alert('Lỗi kết nối khi xóa danh mục');
    }
  };

  const handleToggleActive = async (c) => {
    try {
      const nextActive = !c.isActive;
      const res = await fetch(`/api/categories/${c._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: nextActive }),
      });
      const result = await res.json();
      if (result.success) {
        showToast(`Đã ${nextActive ? 'hiển thị' : 'ẩn'} danh mục "${c.name}"`);
        fetchCategories();
      }
    } catch (err) {
      console.error('Lỗi thay đổi trạng thái:', err);
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = (filteredItems) => {
    const filteredIds = filteredItems.map((c) => c._id);
    const isAll = filteredIds.length > 0 && filteredIds.every((id) => selectedIds.includes(id));
    if (isAll) {
      setSelectedIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    try {
      setBulkDeleting(true);
      const res = await fetch('/api/categories/bulk-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ids: selectedIds,
          deleteProducts: deleteProductsWithCategory,
        }),
      });
      const result = await res.json();
      if (result.success) {
        showToast(result.message || `Đã xóa ${selectedIds.length} danh mục`);
        setSelectedIds([]);
        setBulkDeleteConfirmOpen(false);
        setDeleteProductsWithCategory(false);
        fetchCategories();
      } else {
        alert(result.message || 'Lỗi khi xóa hàng loạt danh mục');
      }
    } catch (err) {
      console.error('Lỗi bulk delete:', err);
      alert('Lỗi kết nối máy chủ');
    } finally {
      setBulkDeleting(false);
    }
  };

  // Filtered categories
  const filtered = useMemo(() => {
    return categories.filter((c) => {
      // Search match
      if (search) {
        const term = search.toLowerCase();
        const matchName = c.name?.toLowerCase().includes(term);
        const matchSlug = c.slug?.toLowerCase().includes(term);
        const matchDesc = c.description?.toLowerCase().includes(term);
        if (!matchName && !matchSlug && !matchDesc) return false;
      }

      // Filter tab
      if (filterType === 'ROOT') return !c.parent;
      if (filterType === 'CHILD') return !!c.parent;
      if (filterType === 'ACTIVE') return c.isActive !== false;
      if (filterType === 'INACTIVE') return c.isActive === false;

      return true;
    });
  }, [categories, search, filterType]);

  const isAllSelected =
    filtered.length > 0 && filtered.every((c) => selectedIds.includes(c._id));

  // Count stats
  const rootCount = useMemo(() => categories.filter((c) => !c.parent).length, [categories]);
  const childCount = useMemo(() => categories.filter((c) => !!c.parent).length, [categories]);
  const activeCount = useMemo(() => categories.filter((c) => c.isActive !== false).length, [categories]);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold animate-slideDown ${
            toastMessage.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          {toastMessage.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200/90 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#8B1E21]/10 text-[#8B1E21] flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 font-serif tracking-tight">
                Danh Mục Sản Phẩm Truyền Thống
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Quản lý phân loại lễ phẩm tâm linh (Ngựa giấy, Đồ lễ, Quần áo mã, Vàng mã...) hiển thị trên Trang Chủ và Trang Cửa Hàng.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <a
            href="/#danh-muc"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-semibold rounded-xl border border-gray-200 transition-colors shadow-2xs"
            title="Xem hiển thị trên Trang Chủ"
          >
            <ExternalLink className="w-4 h-4 text-gray-500" />
            <span>Xem Trang Chủ</span>
          </a>

          <button
            type="button"
            onClick={fetchCategories}
            className="p-2.5 bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-gray-900 rounded-xl border border-gray-200 transition-colors shadow-2xs"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#8B1E21]' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#8B1E21] hover:bg-[#73191B] text-white text-xs font-bold rounded-xl shadow-xs transition-all shadow-red-900/10 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Danh Mục Mới</span>
          </button>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div
          onClick={() => setFilterType('ALL')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            filterType === 'ALL'
              ? 'bg-[#FAF7F2] border-[#8B1E21] shadow-2xs ring-1 ring-[#8B1E21]'
              : 'bg-white border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
            Tất Cả Danh Mục
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-1 font-serif">
            {categories.length}
          </div>
          <div className="text-[10px] text-gray-400 mt-0.5">Bao gồm cả thư mục con</div>
        </div>

        <div
          onClick={() => setFilterType('ROOT')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            filterType === 'ROOT'
              ? 'bg-amber-50/50 border-amber-500 shadow-2xs ring-1 ring-amber-500'
              : 'bg-white border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="text-[11px] font-semibold text-amber-700 uppercase tracking-wide">
            ⭐ Danh Mục Gốc (Cấp 1)
          </div>
          <div className="text-2xl font-bold text-amber-800 mt-1 font-serif">
            {rootCount}
          </div>
          <div className="text-[10px] text-amber-600/80 mt-0.5">Hiển thị ở lưới Trang Chủ</div>
        </div>

        <div
          onClick={() => setFilterType('CHILD')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            filterType === 'CHILD'
              ? 'bg-blue-50/50 border-blue-500 shadow-2xs ring-1 ring-blue-500'
              : 'bg-white border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="text-[11px] font-semibold text-blue-700 uppercase tracking-wide">
            📂 Danh Mục Con (Cấp 2, 3)
          </div>
          <div className="text-2xl font-bold text-blue-800 mt-1 font-serif">
            {childCount}
          </div>
          <div className="text-[10px] text-blue-600/80 mt-0.5">Thuộc danh mục cha</div>
        </div>

        <div
          onClick={() => setFilterType('ACTIVE')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            filterType === 'ACTIVE'
              ? 'bg-emerald-50/50 border-emerald-500 shadow-2xs ring-1 ring-emerald-500'
              : 'bg-white border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wide">
            ✨ Đang Hoạt Động
          </div>
          <div className="text-2xl font-bold text-emerald-800 mt-1 font-serif">
            {activeCount}
          </div>
          <div className="text-[10px] text-emerald-600/80 mt-0.5">
            {categories.length - activeCount} danh mục đang ẩn
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200/90 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full md:max-w-md">
          <input
            type="text"
            placeholder="Tìm theo tên danh mục, đường dẫn slug, mô tả..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-[#8B1E21] focus:ring-1 focus:ring-[#8B1E21] transition-all"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 custom-scrollbar text-xs">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              filterType === 'ALL'
                ? 'bg-[#8B1E21] text-white shadow-2xs font-bold'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Tất cả ({categories.length})
          </button>
          <button
            onClick={() => setFilterType('ROOT')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              filterType === 'ROOT'
                ? 'bg-[#8B1E21] text-white shadow-2xs font-bold'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Chỉ mục gốc ({rootCount})
          </button>
          <button
            onClick={() => setFilterType('CHILD')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              filterType === 'CHILD'
                ? 'bg-[#8B1E21] text-white shadow-2xs font-bold'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Mục con ({childCount})
          </button>
          <button
            onClick={() => setFilterType('ACTIVE')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              filterType === 'ACTIVE'
                ? 'bg-[#8B1E21] text-white shadow-2xs font-bold'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Hiển thị ({activeCount})
          </button>
          <button
            onClick={() => setFilterType('INACTIVE')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              filterType === 'INACTIVE'
                ? 'bg-[#8B1E21] text-white shadow-2xs font-bold'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Đang ẩn ({categories.length - activeCount})
          </button>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 animate-fadeIn shadow-xs">
          <div className="flex items-center gap-2.5 text-rose-900 text-xs font-semibold">
            <span className="w-6 h-6 rounded-full bg-rose-200 text-rose-800 flex items-center justify-center font-bold text-xs">
              {selectedIds.length}
            </span>
            <span>
              Đã chọn <strong>{selectedIds.length}</strong> danh mục trên tổng số <strong>{categories.length}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-medium rounded-lg transition-colors cursor-pointer"
            >
              Bỏ chọn tất cả
            </button>
            <button
              type="button"
              onClick={() => setBulkDeleteConfirmOpen(true)}
              className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa Hàng Loạt ({selectedIds.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF7F2] text-gray-700 font-semibold border-b border-gray-200">
              <tr>
                <th className="py-3.5 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={() => handleToggleSelectAll(filtered)}
                    className="w-4 h-4 rounded text-[#8B1E21] focus:ring-[#8B1E21] cursor-pointer accent-[#8B1E21]"
                    title={isAllSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả danh mục'}
                  />
                </th>
                <th className="py-3.5 px-4">Ảnh & Tên Danh Mục</th>
                <th className="py-3.5 px-4">Cấp Bậc / Thư Mục Cha</th>
                <th className="py-3.5 px-4">Đường Dẫn (Slug)</th>
                <th className="py-3.5 px-4">Mô Tả Lễ Phẩm</th>
                <th className="py-3.5 px-4 text-center">Thứ Tự</th>
                <th className="py-3.5 px-4 text-center">Số Mặt Hàng</th>
                <th className="py-3.5 px-4 text-center">Trạng Thái</th>
                <th className="py-3.5 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-gray-400">
                    <Loader2 className="w-7 h-7 animate-spin text-[#8B1E21] mx-auto mb-2" />
                    <span className="font-medium">Đang tải danh mục sản phẩm...</span>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-500">
                    <div className="max-w-xs mx-auto space-y-2">
                      <Layers className="w-10 h-10 text-gray-300 mx-auto" />
                      <p className="font-semibold text-gray-700">Không có danh mục nào phù hợp</p>
                      <p className="text-[11px] text-gray-400">
                        Thử xóa từ khóa tìm kiếm hoặc nhấn nút "Thêm Danh Mục Mới" để tạo phân loại mới.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((c) => {
                  const isSelected = selectedIds.includes(c._id);
                  const parentCat = c.parent ? categoryMap[c.parent] : null;

                  return (
                    <tr
                      key={c._id}
                      className={`transition-colors ${
                        isSelected
                          ? 'bg-amber-50/70'
                          : 'hover:bg-[#FAF7F2]/60'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-3 w-10 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(c._id)}
                          className="w-4 h-4 rounded text-[#8B1E21] focus:ring-[#8B1E21] cursor-pointer accent-[#8B1E21]"
                        />
                      </td>

                      {/* Name & Thumbnail */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center shadow-2xs relative group">
                            {c.image ? (
                              <img
                                src={c.image}
                                alt={c.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                            ) : (
                              <Layers className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 text-[13px] flex items-center gap-1.5">
                              <span>{c.name}</span>
                              {!c.parent && (
                                <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-[#8B1E21]/10 text-[#8B1E21]">
                                  GỐC
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-gray-500 font-mono mt-0.5">
                              ID: {c._id.slice(-6)}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Parent / Hierarchy */}
                      <td className="py-3.5 px-4">
                        {parentCat ? (
                          <div className="flex items-center gap-1.5 text-blue-700 bg-blue-50/80 border border-blue-200/80 px-2 py-1 rounded-md max-w-fit">
                            <FolderTree className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            <span className="font-medium text-[11px] truncate max-w-[140px]" title={parentCat.name}>
                              {parentCat.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-gray-500 font-medium bg-gray-100 px-2 py-0.5 rounded">
                            ⭐ Danh Mục Cấp 1 (Gốc)
                          </span>
                        )}
                      </td>

                      {/* Slug */}
                      <td className="py-3.5 px-4 font-mono text-gray-600 text-[11.5px]">
                        <span className="bg-gray-50 px-1.5 py-0.5 rounded border border-gray-200">
                          /{c.slug}
                        </span>
                      </td>

                      {/* Description */}
                      <td className="py-3.5 px-4 text-gray-600 max-w-[200px] truncate" title={c.description}>
                        {c.description || <span className="text-gray-400 italic">Chưa có mô tả</span>}
                      </td>

                      {/* Sort Order */}
                      <td className="py-3.5 px-4 text-center font-mono font-semibold text-gray-800">
                        {c.sortOrder ?? 1}
                      </td>

                      {/* Product Count */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          {c.productCount ?? 0} món
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(c)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                            c.isActive !== false
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200'
                          }`}
                          title="Nhấn để đổi trạng thái Hiển thị / Ẩn"
                        >
                          {c.isActive !== false ? (
                            <>
                              <Eye className="w-3 h-3 text-emerald-600" />
                              <span>Hiển thị</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3 h-3 text-gray-400" />
                              <span>Đang ẩn</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(c)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Chỉnh sửa danh mục"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDeletingCategory(c);
                              setDeleteConfirmOpen(true);
                            }}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Xóa danh mục"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Thêm / Chỉnh Sửa Danh Mục */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-gray-200 overflow-hidden transform transition-all animate-scaleUp">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-[#FAF7F2]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#8B1E21]/10 text-[#8B1E21] flex items-center justify-center font-bold">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 font-serif">
                    {modalMode === 'CREATE' ? 'Thêm Danh Mục Sản Phẩm Mới' : 'Chỉnh Sửa Danh Mục'}
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    {modalMode === 'CREATE'
                      ? 'Thiết lập danh mục để gom nhóm và hiển thị trên website'
                      : `Cập nhật thông tin danh mục "${formData.name}"`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto custom-scrollbar">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Tên danh mục */}
              <div>
                <label className="block font-semibold text-gray-800 mb-1">
                  Tên danh mục <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Ví dụ: Ngựa Giấy & Binh Mã, Tiền Vàng Cổ, Biệt Thự Mã..."
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-[#8B1E21] focus:ring-1 focus:ring-[#8B1E21]"
                  required
                />
              </div>

              {/* Đường dẫn tĩnh (Slug) */}
              <div>
                <label className="block font-semibold text-gray-800 mb-1">
                  Đường dẫn tĩnh (Slug)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-400 font-mono text-[11px]">/san-pham?category=</span>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    placeholder="ngua-giay-binh-ma"
                    className="w-full pl-36 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#8B1E21] focus:ring-1 focus:ring-[#8B1E21] font-mono text-xs"
                  />
                </div>
                <p className="text-[11px] text-gray-500 mt-1">
                  Hệ thống tự động sinh slug theo tên tiếng Việt có dấu. Bạn có thể sửa theo ý muốn.
                </p>
              </div>

              {/* Danh mục cấp cha */}
              <div>
                <label className="block font-semibold text-gray-800 mb-1 flex items-center justify-between">
                  <span>Thư mục / Danh mục cấp cha</span>
                  <span className="text-[11px] font-normal text-gray-500">(Để trống nếu là Danh Mục Cấp 1)</span>
                </label>
                <select
                  value={formData.parent || 'root'}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      parent: e.target.value === 'root' ? null : e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-[#8B1E21] text-xs"
                >
                  <option value="root">⭐ Danh mục gốc (Cấp 1 - Hiển thị trực tiếp ở Trang Chủ)</option>
                  {categoryTree
                    .filter((item) => item._id !== editingId)
                    .map((item) => (
                      <option key={item._id} value={item._id}>
                        {'— '.repeat(item.level)} {item.name} ({item.productCount} sản phẩm)
                      </option>
                    ))}
                </select>
                <p className="text-[11px] text-gray-500 mt-1">
                  Nếu chọn là Danh mục gốc, danh mục sẽ được xếp vào lưới "Danh Mục Sản Phẩm Truyền Thống" ở Trang Chủ.
                </p>
              </div>

              {/* Ảnh Minh Họa Danh Mục */}
              <div>
                <label className="block font-semibold text-gray-800 mb-1">
                  Ảnh minh họa danh mục (Ảnh đại diện hiển thị ngoài trang chủ)
                </label>
                <div className="flex items-start gap-3.5 p-3.5 bg-gray-50 border border-gray-200 rounded-xl">
                  {/* Preview Box */}
                  <div className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 bg-white flex items-center justify-center overflow-hidden shrink-0 relative group shadow-2xs">
                    {formData.image ? (
                      <>
                        <img
                          src={formData.image}
                          alt="Minh họa danh mục"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, image: '' }))}
                          className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Xóa ảnh"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </>
                    ) : (
                      <ImageIcon className="w-8 h-8 text-gray-300" />
                    )}
                  </div>

                  {/* Upload Controls */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-lg font-medium cursor-pointer transition-colors shadow-2xs">
                        {uploadingImage ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#8B1E21]" />
                        ) : (
                          <Upload className="w-3.5 h-3.5 text-gray-500" />
                        )}
                        <span>{uploadingImage ? 'Đang tải lên...' : 'Tải ảnh từ máy tính'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={uploadingImage}
                          className="hidden"
                        />
                      </label>
                      {formData.image && (
                        <button
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, image: '' }))}
                          className="text-xs text-red-600 hover:underline cursor-pointer"
                        >
                          Gỡ ảnh
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={formData.image}
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                      placeholder="Hoặc dán đường link ảnh (URL online)..."
                      className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-[11px] focus:outline-none focus:border-[#8B1E21] font-mono bg-white"
                    />
                    <p className="text-[10.5px] text-gray-400">
                      Tỷ lệ khuyến nghị: 4:3 hoặc vuông (Ví dụ: 800x600px).
                    </p>
                  </div>
                </div>
              </div>

              {/* Mô tả danh mục */}
              <div>
                <label className="block font-semibold text-gray-800 mb-1">
                  Mô tả danh mục quy cách
                </label>
                <textarea
                  rows="2"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ví dụ: Đầy đủ ngựa đại, ngựa trung đủ 5 màu sắc ngũ phương..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#8B1E21]"
                />
              </div>

              {/* Sort Order & Trạng Thái */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-gray-800 mb-1">
                    Thứ tự sắp xếp (Số nhỏ xếp trước)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.sortOrder}
                    onChange={(e) =>
                      setFormData({ ...formData, sortOrder: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono focus:outline-none focus:border-[#8B1E21]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-800 mb-1">
                    Trạng thái hiển thị
                  </label>
                  <select
                    value={formData.isActive ? 'true' : 'false'}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.value === 'true' })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-[#8B1E21]"
                  >
                    <option value="true">Hiển thị công khai</option>
                    <option value="false">Tạm ẩn (Khách không thấy)</option>
                  </select>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#8B1E21] hover:bg-[#73191B] rounded-lg shadow-sm flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {formSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{modalMode === 'CREATE' ? 'Tạo Danh Mục Mới' : 'Lưu Thay Đổi'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Single Confirm */}
      <ConfirmModal
        isOpen={deleteConfirmOpen}
        title={`Xóa Danh Mục "${deletingCategory?.name || ''}"`}
        message={
          <div className="space-y-3">
            <p className="text-sm text-gray-700">
              Bạn có chắc chắn muốn xóa danh mục <strong>{deletingCategory?.name}</strong>?
            </p>
            <label className="flex items-start gap-2.5 p-3 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
              <input
                type="checkbox"
                checked={deleteProductsWithCategory}
                onChange={(e) => setDeleteProductsWithCategory(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-red-600 focus:ring-red-500 accent-red-600 cursor-pointer"
              />
              <span className="text-xs text-gray-700 leading-snug">
                <strong>Xóa luôn các sản phẩm</strong> thuộc danh mục này<br />
                <span className="text-[11px] text-gray-500">
                  (Mặc định không chọn: hệ thống sẽ bảo toàn sản phẩm và tự động chuyển về mục cha hoặc chưa phân loại).
                </span>
              </span>
            </label>
          </div>
        }
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteConfirmOpen(false);
          setDeletingCategory(null);
          setDeleteProductsWithCategory(false);
        }}
      />

      {/* Bulk Delete Confirm */}
      <ConfirmModal
        isOpen={bulkDeleteConfirmOpen}
        title={`Xác Nhận Xóa Hàng Loạt ${selectedIds.length} Danh Mục`}
        message={
          <div className="space-y-3">
            <p className="text-sm text-gray-700">
              Bạn có chắc chắn muốn xóa vĩnh viễn <strong>{selectedIds.length}</strong> danh mục đã chọn?
            </p>
            <label className="flex items-start gap-2.5 p-3 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
              <input
                type="checkbox"
                checked={deleteProductsWithCategory}
                onChange={(e) => setDeleteProductsWithCategory(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-red-600 focus:ring-red-500 accent-red-600 cursor-pointer"
              />
              <span className="text-xs text-gray-700 leading-snug">
                <strong>Xóa luôn toàn bộ sản phẩm</strong> thuộc các danh mục này<br />
                <span className="text-[11px] text-gray-500">
                  (Mặc định không chọn: hệ thống sẽ giữ lại sản phẩm và bảo toàn chuyển sang thư mục gốc để không thất thoát hàng).
                </span>
              </span>
            </label>
          </div>
        }
        confirmText={`Xóa ${selectedIds.length} Danh Mục`}
        loading={bulkDeleting}
        onConfirm={handleBulkDelete}
        onCancel={() => {
          setBulkDeleteConfirmOpen(false);
          setDeleteProductsWithCategory(false);
        }}
      />
    </div>
  );
}
