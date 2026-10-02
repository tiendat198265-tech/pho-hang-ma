import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Folder,
  FolderPlus,
  FolderOpen,
  FolderTree,
  CornerLeftUp,
  ChevronRight,
  Move,
  ArrowRight,
  Layers,
  Package,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit,
  Eye,
  CheckCircle,
  XCircle,
  UploadCloud,
  Loader2,
  ChevronLeft,
  ArrowUpDown,
  Image as ImageIcon,
  Star,
  Sparkles,
  Check,
  X,
  Zap,
  Save,
  RotateCcw,
  Edit3,
  Minus,
  MoreVertical,
  FileText,
  Home,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';
import { formatVND } from '../../../utils/exportUtils';
import ConfirmModal from './ConfirmModal';

export default function ProductsTab({ token }) {
  // Navigation State (File Explorer)
  const [currentFolderId, setCurrentFolderId] = useState('root'); // 'root' or ObjectId
  const [currentFolder, setCurrentFolder] = useState({ _id: 'root', name: 'Lễ Phẩm' });
  const [breadcrumbs, setBreadcrumbs] = useState([{ _id: 'root', name: 'Lễ Phẩm' }]);
  const [subFolders, setSubFolders] = useState([]);
  const [allCategoriesTree, setAllCategoriesTree] = useState([]);
  const [loadingFolder, setLoadingFolder] = useState(false);

  // Products state in current folder
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [totalCount, setTotalCount] = useState(0);

  // Search & Filter State
  const [productSearch, setProductSearch] = useState('');
  const [searchScope, setSearchScope] = useState('CURRENT'); // 'CURRENT' | 'ALL'
  const [filterStatus, setFilterStatus] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'INACTIVE'
  const [filterStock, setFilterStock] = useState('ALL'); // 'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'
  const [filterMinPrice, setFilterMinPrice] = useState('');
  const [filterMaxPrice, setFilterMaxPrice] = useState('');
  const [filterSort, setFilterSort] = useState('newest');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [folderFilterQuery, setFolderFilterQuery] = useState('');

  // Live auto-complete suggestions state
  const [suggestions, setSuggestions] = useState({ folders: [], products: [] });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [isSearchingProducts, setIsSearchingProducts] = useState(false);
  const searchDebounceRef = useRef(null);
  const searchContainerRef = useRef(null);
  const productsAbortRef = useRef(null);
  const suggestionsAbortRef = useRef(null);

  // Inline quick edit state
  const [editingCell, setEditingCell] = useState(null); // { id: string, field: 'price' | 'stock' }
  const [cellInputVal, setCellInputVal] = useState('');
  const [savingCellId, setSavingCellId] = useState(null);

  // Batch edit mode
  const [isBatchEditMode, setIsBatchEditMode] = useState(false);
  const [batchValues, setBatchValues] = useState({});
  const [savingBatch, setSavingBatch] = useState(false);

  // Notification Toast
  const [toastMessage, setToastMessage] = useState(null);
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // --- MODALS FOR FOLDER MANAGEMENT ---
  // Create / Rename Folder Modal
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [folderModalMode, setFolderModalMode] = useState('CREATE'); // 'CREATE' | 'RENAME'
  const [editingFolder, setEditingFolder] = useState(null);
  const [folderForm, setFolderForm] = useState({ name: '', description: '', icon: 'folder', image: '' });
  const [uploadingFolderImage, setUploadingFolderImage] = useState(false);
  const [submittingFolder, setSubmittingFolder] = useState(false);

  // Move Folder Modal
  const [moveFolderModalOpen, setMoveFolderModalOpen] = useState(false);
  const [movingFolder, setMovingFolder] = useState(null);
  const [targetParentFolderId, setTargetParentFolderId] = useState('root');
  const [submittingMoveFolder, setSubmittingMoveFolder] = useState(false);

  // Delete Folder Modal
  const [deleteFolderModalOpen, setDeleteFolderModalOpen] = useState(false);
  const [deletingFolder, setDeletingFolder] = useState(null);
  const [deleteCascade, setDeleteCascade] = useState(false);
  const [submittingDeleteFolder, setSubmittingDeleteFolder] = useState(false);

  // --- MODALS FOR PRODUCT MANAGEMENT ---
  // Move Product(s) Modal
  const [moveProductModalOpen, setMoveProductModalOpen] = useState(false);
  const [movingProductIds, setMovingProductIds] = useState([]);
  const [targetMoveFolderId, setTargetMoveFolderId] = useState('root');
  const [submittingMoveProduct, setSubmittingMoveProduct] = useState(false);

  // Create / Edit Product Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('CREATE'); // 'CREATE' | 'EDIT'
  const [editingId, setEditingId] = useState(null);
  const [activeFormTab, setActiveFormTab] = useState('GENERAL'); // 'GENERAL' | 'IMAGES' | 'SEO'
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Delete Product Modal
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);

  // Upload image
  const fileInputRef = useRef(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Initial Product Form State
  const initialFormState = {
    name: '',
    sku: '',
    category: '',
    price: 0,
    originalPrice: 0,
    stockQuantity: 10,
    unit: 'chiếc',
    description: '',
    details: '',
    dimensions: '',
    material: 'Giấy dó, giang nứa tự nhiên, phẩm điều cổ truyền',
    isActive: true,
    thumbnail: '',
    images: [],
    seo: {
      metaTitle: '',
      metaDescription: '',
      keywords: '',
    },
  };
  const [formData, setFormData] = useState(initialFormState);

  // ==========================================
  // 1. DATA FETCHING
  // ==========================================

  // Load Folder Tree for dropdowns
  const fetchCategoryTree = async () => {
    try {
      const res = await fetch('/api/categories/tree');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setAllCategoriesTree(data.data);
      }
    } catch (err) {
      console.error('Lỗi tải cây thư mục:', err);
    }
  };

  // 2. Load Folder Metadata & Subfolders (only when changing folder or on folder CRUD)
  const fetchFolderMetadata = async (folderId = currentFolderId) => {
    try {
      setLoadingFolder(true);
      // Fetch Folder details & Breadcrumbs
      const folderRes = await fetch(`/api/categories/folder/${folderId}`);
      const folderData = await folderRes.json();
      if (folderData.success && folderData.data) {
        setCurrentFolder(folderData.data.currentFolder || { _id: folderId, name: 'Lễ Phẩm' });
        setBreadcrumbs(folderData.data.breadcrumbs || [{ _id: 'root', name: 'Lễ Phẩm' }]);
      }

      // Fetch Subfolders
      const parentQuery = folderId === 'root' ? 'rootOnly=true' : `parentId=${folderId}`;
      const subFolderRes = await fetch(`/api/categories?${parentQuery}`);
      const subFolderData = await subFolderRes.json();
      if (subFolderData.success) {
        setSubFolders(Array.isArray(subFolderData.data) ? subFolderData.data : []);
      }
    } catch (err) {
      console.error('Lỗi tải thông tin thư mục:', err);
    } finally {
      setLoadingFolder(false);
    }
  };

  // 3. Load Products ONLY (supports live search without touching folders or unmounting table)
  const fetchProductsList = async (folderId = currentFolderId, overrideParams = {}, isLiveSearch = false) => {
    try {
      if (isLiveSearch) {
        setIsSearchingProducts(true);
      } else {
        setLoadingProducts(true);
      }

      // Abort previous in-flight products request
      if (productsAbortRef.current) {
        productsAbortRef.current.abort();
      }
      productsAbortRef.current = new AbortController();

      const scope = overrideParams.searchScope !== undefined ? overrideParams.searchScope : searchScope;
      const sTerm = overrideParams.productSearch !== undefined ? overrideParams.productSearch : productSearch;
      const st = overrideParams.filterStatus !== undefined ? overrideParams.filterStatus : filterStatus;
      const stk = overrideParams.filterStock !== undefined ? overrideParams.filterStock : filterStock;
      const minP = overrideParams.filterMinPrice !== undefined ? overrideParams.filterMinPrice : filterMinPrice;
      const maxP = overrideParams.filterMaxPrice !== undefined ? overrideParams.filterMaxPrice : filterMaxPrice;
      const srt = overrideParams.filterSort !== undefined ? overrideParams.filterSort : filterSort;

      const qParams = new URLSearchParams();
      if (scope === 'CURRENT') {
        const categoryParam = folderId === 'root' ? 'null' : folderId;
        qParams.append('category', categoryParam);
      } else {
        qParams.append('category', 'ALL');
      }

      if (sTerm.trim()) qParams.append('search', sTerm.trim());
      if (st !== 'ALL') qParams.append('status', st);
      if (stk !== 'ALL') qParams.append('stock', stk);
      if (minP) qParams.append('minPrice', minP);
      if (maxP) qParams.append('maxPrice', maxP);
      if (srt) qParams.append('sort', srt);
      qParams.append('limit', '100');

      const prodRes = await fetch(`/api/products/admin/all?${qParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: productsAbortRef.current.signal,
      });
      const prodData = await prodRes.json();
      if (prodData.success) {
        const prodList = prodData.data || prodData.products || [];
        setProducts(prodList);
        setTotalCount(prodData.total || prodList.length);
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Lỗi tải sản phẩm:', err);
      }
    } finally {
      setIsSearchingProducts(false);
      setLoadingProducts(false);
    }
  };

  // 4. Combined Folder Content loader (on navigation or manual refresh)
  const fetchFolderContent = async (folderId = currentFolderId, overrideParams = {}) => {
    setSelectedIds([]);
    await Promise.all([
      fetchFolderMetadata(folderId),
      fetchProductsList(folderId, overrideParams, false),
    ]);
  };

  useEffect(() => {
    fetchFolderContent(currentFolderId);
  }, [currentFolderId]);

  // Navigate into a folder
  const handleOpenFolder = (folderId) => {
    setCurrentFolderId(folderId);
    setSearchScope('CURRENT');
  };

  // Navigate Up one level
  const handleGoUpOneLevel = () => {
    if (breadcrumbs.length <= 1) return;
    const parentBreadcrumb = breadcrumbs[breadcrumbs.length - 2];
    setCurrentFolderId(parentBreadcrumb._id);
    setSearchScope('CURRENT');
  };

  // Active filter count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchScope === 'ALL') count++;
    if (filterStatus !== 'ALL') count++;
    if (filterStock !== 'ALL') count++;
    if (filterMinPrice) count++;
    if (filterMaxPrice) count++;
    if (filterSort !== 'newest') count++;
    return count;
  }, [searchScope, filterStatus, filterStock, filterMinPrice, filterMaxPrice, filterSort]);

  // Reset all filters
  const handleResetFilters = () => {
    setProductSearch('');
    setSearchScope('CURRENT');
    setFilterStatus('ALL');
    setFilterStock('ALL');
    setFilterMinPrice('');
    setFilterMaxPrice('');
    setFilterSort('newest');
    setFolderFilterQuery('');
    fetchFolderContent(currentFolderId, {
      productSearch: '',
      searchScope: 'CURRENT',
      filterStatus: 'ALL',
      filterStock: 'ALL',
      filterMinPrice: '',
      filterMaxPrice: '',
      filterSort: 'newest',
    });
  };

  // Filter subfolders in real-time
  const visibleSubfolders = useMemo(() => {
    if (!folderFilterQuery.trim()) return subFolders;
    const q = folderFilterQuery.trim().toLowerCase();
    return subFolders.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        (f.description && f.description.toLowerCase().includes(q))
    );
  }, [subFolders, folderFilterQuery]);

  // Handle typing in search input: real-time suggestions and debounced table filter
  const handleSearchInputChange = (val) => {
    setProductSearch(val);

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    if (suggestionsAbortRef.current) {
      suggestionsAbortRef.current.abort();
    }

    const trimmed = val.trim();
    if (!trimmed) {
      setShowSuggestions(false);
      setLoadingSuggestions(false);
      setSuggestions({ folders: [], products: [] });
      fetchProductsList(currentFolderId, { productSearch: '' }, true);
      return;
    }

    // 1. Instant local matching for folders from category tree (0ms latency)
    const qLower = trimmed.toLowerCase();
    const matchedFolders = (allCategoriesTree || [])
      .filter((cat) => cat.name.toLowerCase().includes(qLower))
      .slice(0, 4);

    setSuggestions({
      folders: matchedFolders,
      products: [],
    });
    setShowSuggestions(true);
    setLoadingSuggestions(true);

    // 2. Debounce (300ms) for products suggestion & smooth table update
    searchDebounceRef.current = setTimeout(async () => {
      try {
        suggestionsAbortRef.current = new AbortController();
        const res = await fetch(
          `/api/products/admin/all?search=${encodeURIComponent(trimmed)}&limit=6`,
          {
            headers: { Authorization: `Bearer ${token}` },
            signal: suggestionsAbortRef.current.signal,
          }
        );
        const data = await res.json();
        const prods = data.success ? (data.data || data.products || []) : [];

        setSuggestions({
          folders: matchedFolders,
          products: prods,
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Lỗi tìm kiếm gợi ý:', err);
        }
      } finally {
        setLoadingSuggestions(false);
      }

      // Update main table smoothly in background without layout shifts or reloading folders
      fetchProductsList(currentFolderId, { productSearch: trimmed }, true);
    }, 300);
  };

  // Close suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, []);

  // ==========================================
  // 2. FOLDER ACTIONS (CREATE, RENAME, MOVE, DELETE)
  // ==========================================

  // Open Create Folder Modal
  const openCreateFolderModal = () => {
    setFolderModalMode('CREATE');
    setEditingFolder(null);
    setFolderForm({ name: '', description: '', icon: 'folder', image: '' });
    setFolderModalOpen(true);
  };

  // Open Rename / Edit Folder Modal
  const openRenameFolderModal = (folder, e) => {
    if (e) e.stopPropagation();
    setFolderModalMode('RENAME');
    setEditingFolder(folder);
    setFolderForm({
      name: folder.name,
      description: folder.description || '',
      icon: folder.icon || 'folder',
      image: folder.image || '',
    });
    setFolderModalOpen(true);
  };

  // Upload image for folder
  const handleFolderImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingFolderImage(true);
      const fd = new FormData();
      fd.append('image', file);
      const res = await fetch('/api/custom-orders/upload-images', {
        method: 'POST',
        body: fd,
      });
      const result = await res.json();
      if (result.success && result.data && result.data[0]) {
        setFolderForm((prev) => ({ ...prev, image: result.data[0] }));
        showToast('Đã tải ảnh thư mục lên thành công!');
      } else {
        alert(result.message || 'Lỗi tải ảnh thư mục');
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi kết nối khi tải ảnh');
    } finally {
      setUploadingFolderImage(false);
    }
  };

  // Submit Create or Rename Folder
  const handleSubmitFolderForm = async (e) => {
    e.preventDefault();
    if (!folderForm.name.trim()) {
      alert('Vui lòng nhập tên thư mục');
      return;
    }

    try {
      setSubmittingFolder(true);
      if (folderModalMode === 'CREATE') {
        const payload = {
          name: folderForm.name.trim(),
          description: folderForm.description.trim(),
          image: folderForm.image || '',
          parent: currentFolderId === 'root' ? null : currentFolderId,
        };

        const res = await fetch('/api/categories', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
        const result = await res.json();
        if (result.success) {
          showToast(`Đã tạo thư mục "${folderForm.name}" thành công!`);
          setFolderModalOpen(false);
          fetchFolderContent(currentFolderId);
        } else {
          alert(result.message || 'Lỗi tạo thư mục');
        }
      } else {
        // Edit / Rename
        const res = await fetch(`/api/categories/${editingFolder._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: folderForm.name.trim(),
            description: folderForm.description.trim(),
            image: folderForm.image || '',
          }),
        });
        const result = await res.json();
        if (result.success) {
          showToast(`Đã cập nhật thư mục "${folderForm.name}"`);
          setFolderModalOpen(false);
          fetchFolderContent(currentFolderId);
        } else {
          alert(result.message || 'Lỗi cập nhật thư mục');
        }
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi kết nối máy chủ');
    } finally {
      setSubmittingFolder(false);
    }
  };

  // Open Move Folder Modal
  const openMoveFolderModal = (folder, e) => {
    if (e) e.stopPropagation();
    setMovingFolder(folder);
    setTargetParentFolderId(folder.parent ? String(folder.parent) : 'root');
    setMoveFolderModalOpen(true);
  };

  // Submit Move Folder
  const handleSubmitMoveFolder = async (e) => {
    e.preventDefault();
    if (!movingFolder) return;

    if (String(movingFolder._id) === String(targetParentFolderId)) {
      alert('Không thể di chuyển thư mục vào chính nó');
      return;
    }

    try {
      setSubmittingMoveFolder(true);
      const res = await fetch(`/api/categories/${movingFolder._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          parent: targetParentFolderId === 'root' ? null : targetParentFolderId,
        }),
      });

      const result = await res.json();
      if (result.success) {
        showToast(`Đã di chuyển thư mục "${movingFolder.name}" thành công!`);
        setMoveFolderModalOpen(false);
        fetchFolderContent(currentFolderId);
      } else {
        alert(result.message || 'Lỗi di chuyển thư mục');
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi kết nối máy chủ');
    } finally {
      setSubmittingMoveFolder(false);
    }
  };

  // Open Delete Folder Modal
  const openDeleteFolderModal = (folder, e) => {
    if (e) e.stopPropagation();
    setDeletingFolder(folder);
    setDeleteCascade(false);
    setDeleteFolderModalOpen(true);
  };

  // Submit Delete Folder
  const handleConfirmDeleteFolder = async () => {
    if (!deletingFolder) return;
    try {
      setSubmittingDeleteFolder(true);
      const res = await fetch(`/api/categories/${deletingFolder._id}?cascade=${deleteCascade}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (result.success) {
        showToast(result.message || 'Đã xóa thư mục thành công');
        setDeleteFolderModalOpen(false);
        // If current folder was deleted, go up to root
        if (currentFolderId === deletingFolder._id) {
          setCurrentFolderId('root');
        } else {
          fetchFolderContent(currentFolderId);
        }
      } else {
        alert(result.message || 'Lỗi khi xóa thư mục');
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi kết nối máy chủ');
    } finally {
      setSubmittingDeleteFolder(false);
    }
  };

  // ==========================================
  // 3. PRODUCT ACTIONS (MOVE, QUICK EDIT, CRUD)
  // ==========================================

  // Open Move Single Product
  const openMoveSingleProduct = (product) => {
    setMovingProductIds([product._id]);
    setTargetMoveFolderId(currentFolderId);
    setMoveProductModalOpen(true);
  };

  // Open Move Bulk Selected Products
  const openMoveBulkProducts = () => {
    if (selectedIds.length === 0) return;
    setMovingProductIds(selectedIds);
    setTargetMoveFolderId(currentFolderId);
    setMoveProductModalOpen(true);
  };

  // Submit Move Product(s)
  const handleSubmitMoveProducts = async (e) => {
    e.preventDefault();
    if (movingProductIds.length === 0) return;

    try {
      setSubmittingMoveProduct(true);
      let res;
      if (movingProductIds.length === 1) {
        res = await fetch(`/api/products/${movingProductIds[0]}/move-folder`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            targetFolderId: targetMoveFolderId === 'root' ? null : targetMoveFolderId,
          }),
        });
      } else {
        res = await fetch('/api/products/admin/bulk-move-folder', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            productIds: movingProductIds,
            targetFolderId: targetMoveFolderId === 'root' ? null : targetMoveFolderId,
          }),
        });
      }

      const result = await res.json();
      if (result.success) {
        showToast(result.message || `Đã chuyển ${movingProductIds.length} sản phẩm thành công!`);
        setMoveProductModalOpen(false);
        setSelectedIds([]);
        fetchFolderContent(currentFolderId);
      } else {
        alert(result.message || 'Lỗi di chuyển sản phẩm');
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi kết nối máy chủ');
    } finally {
      setSubmittingMoveProduct(false);
    }
  };

  // Start Quick Inline Cell Edit
  const handleStartEditCell = (id, field, currentVal) => {
    if (isBatchEditMode) return;
    setEditingCell({ id, field });
    setCellInputVal(String(currentVal ?? 0));
  };

  // Save Quick Inline Cell Edit
  const handleSaveCell = async (id, field) => {
    try {
      setSavingCellId(id);
      const numVal = Math.max(0, Number(cellInputVal) || 0);
      const payload = field === 'price' ? { price: numVal } : { stockQuantity: numVal };

      const res = await fetch(`/api/products/${id}/quick-update`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (result.success) {
        setProducts((prev) =>
          prev.map((p) =>
            p._id === id
              ? {
                  ...p,
                  ...(field === 'price'
                    ? { price: numVal }
                    : { stockQuantity: numVal, inStock: numVal > 0 }),
                }
              : p
          )
        );
        setEditingCell(null);
        showToast(
          field === 'price'
            ? `Đã cập nhật đơn giá: ${formatVND(numVal)}`
            : `Đã cập nhật tồn kho: ${numVal}`
        );
      } else {
        alert(result.message || 'Lỗi cập nhật');
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi kết nối máy chủ');
    } finally {
      setSavingCellId(null);
    }
  };

  // Step stock +/- 1
  const handleStepStock = async (p, delta) => {
    const newStock = Math.max(0, (p.stockQuantity || 0) + delta);
    try {
      const res = await fetch(`/api/products/${p._id}/quick-update`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ stockQuantity: newStock }),
      });
      const result = await res.json();
      if (result.success) {
        setProducts((prev) =>
          prev.map((item) =>
            item._id === p._id
              ? { ...item, stockQuantity: newStock, inStock: newStock > 0 }
              : item
          )
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Batch edit mode toggle
  const handleToggleBatchEditMode = () => {
    if (!isBatchEditMode) {
      const initialBatch = {};
      products.forEach((p) => {
        initialBatch[p._id] = {
          price: p.price,
          stockQuantity: p.stockQuantity,
        };
      });
      setBatchValues(initialBatch);
      setIsBatchEditMode(true);
    } else {
      setIsBatchEditMode(false);
      setBatchValues({});
    }
  };

  // Save all batch
  const handleSaveAllBatch = async () => {
    try {
      setSavingBatch(true);
      const updates = Object.keys(batchValues).map((id) => ({
        id,
        price: batchValues[id].price,
        stockQuantity: batchValues[id].stockQuantity,
      }));

      const res = await fetch('/api/products/admin/bulk-update-pricing', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ updates }),
      });

      const result = await res.json();
      if (result.success) {
        setIsBatchEditMode(false);
        setBatchValues({});
        showToast(`Đã lưu đơn giá & tồn kho cho ${updates.length} sản phẩm!`);
        fetchFolderContent(currentFolderId);
      } else {
        alert(result.message || 'Lỗi cập nhật');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingBatch(false);
    }
  };

  // Open Create Product Modal (auto-assigned to current folder)
  const openCreateProductModal = () => {
    setModalMode('CREATE');
    setEditingId(null);
    setFormData({
      ...initialFormState,
      category: currentFolderId === 'root' ? '' : currentFolderId,
    });
    setActiveFormTab('GENERAL');
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open Edit Product Modal
  const openEditProductModal = (product) => {
    setModalMode('EDIT');
    setEditingId(product._id);
    setFormData({
      name: product.name || '',
      sku: product.sku || '',
      category: product.category?._id || product.category || '',
      price: product.price || 0,
      originalPrice: product.originalPrice || 0,
      stockQuantity: product.stockQuantity ?? 10,
      unit: product.unit || 'chiếc',
      description: product.description || '',
      details: product.details || '',
      dimensions: product.dimensions || '',
      material: product.material || 'Giấy dó, giang nứa tự nhiên, phẩm điều cổ truyền',
      isActive: product.status === 'ACTIVE',
      thumbnail: product.thumbnail || '',
      images: product.images || [],
      seo: product.seo || { metaTitle: '', metaDescription: '', keywords: '' },
    });
    setActiveFormTab('GENERAL');
    setFormError(null);
    setIsModalOpen(true);
  };

  // Submit Product Form
  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Vui lòng nhập tên lễ phẩm');
      return;
    }

    try {
      setFormSubmitting(true);
      setFormError(null);

      const url = modalMode === 'CREATE' ? '/api/products' : `/api/products/${editingId}`;
      const method = modalMode === 'CREATE' ? 'POST' : 'PUT';

      const payload = {
        ...formData,
        category: formData.category || (currentFolderId === 'root' ? null : currentFolderId),
        status: formData.isActive ? 'ACTIVE' : 'INACTIVE',
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
            ? `Đã thêm lễ phẩm "${formData.name}" vào thư mục!`
            : `Đã cập nhật lễ phẩm "${formData.name}"`
        );
        fetchFolderContent(currentFolderId);
      } else {
        setFormError(result.message || 'Lỗi lưu lễ phẩm');
      }
    } catch (err) {
      console.error(err);
      setFormError('Lỗi kết nối máy chủ');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Delete Single Product
  const handleDeleteProduct = (id) => {
    setDeletingId(id);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDeleteProduct = async () => {
    try {
      const res = await fetch(`/api/products/${deletingId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (result.success) {
        setDeleteConfirmOpen(false);
        setDeletingId(null);
        showToast('Đã xóa lễ phẩm');
        fetchFolderContent(currentFolderId);
      } else {
        alert(result.message || 'Lỗi khi xóa');
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi kết nối máy chủ');
    }
  };

  // Bulk Delete Products
  const handleBulkDeleteConfirm = async () => {
    if (selectedIds.length === 0) return;
    try {
      const res = await fetch('/api/products/admin/bulk-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productIds: selectedIds }),
      });
      const result = await res.json();
      if (result.success) {
        setBulkDeleteConfirmOpen(false);
        setSelectedIds([]);
        showToast(`Đã xóa thành công ${selectedIds.length} lễ phẩm!`);
        fetchFolderContent(currentFolderId);
      } else {
        alert(result.message || 'Lỗi khi xóa hàng loạt');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Image Upload for Product Form
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const fd = new FormData();
      fd.append('image', file);

      const res = await fetch('/api/custom-orders/upload-images', {
        method: 'POST',
        body: fd,
      });
      const result = await res.json();

      if (result.success && result.data && result.data[0]) {
        const url = result.data[0].url;
        setFormData((prev) => ({
          ...prev,
          images: [...prev.images, url],
          thumbnail: prev.thumbnail || url,
        }));
      } else {
        alert(result.message || 'Lỗi tải ảnh lên');
      }
    } catch (err) {
      console.error(err);
      alert('Không thể kết nối máy chủ để tải ảnh');
    } finally {
      setUploadingImage(false);
    }
  };

  // Select all products in view
  const handleSelectAll = () => {
    if (selectedIds.length === products.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(products.map((p) => p._id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#3E2723] text-amber-200 border border-[#C59B27] px-4 py-3 rounded-lg shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* TOP FILE EXPLORER TOOLBAR & BREADCRUMB                    */}
      {/* ======================================================== */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        {/* Row 1: Main Title & Action Buttons */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 border border-amber-300 text-amber-900 flex items-center justify-center shrink-0">
              <FolderTree className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">
                Hệ Thống Thư Mục Lễ Phẩm
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Quản lý cây thư mục sản phẩm đa cấp không giới hạn · Giống File Explorer
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Create Folder button */}
            <button
              type="button"
              onClick={openCreateFolderModal}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold rounded-lg transition-colors shadow-2xs"
              title="Tạo thư mục con tại vị trí hiện tại"
            >
              <FolderPlus className="w-4 h-4 text-amber-700" />
              <span>+ Thư Mục Mới</span>
            </button>

            {/* Create Product button */}
            <button
              type="button"
              onClick={openCreateProductModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#d70018] hover:bg-[#b00013] text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
              title="Thêm lễ phẩm vào thư mục hiện tại"
            >
              <Plus className="w-4 h-4" />
              <span>+ Thêm Lễ Phẩm</span>
            </button>
          </div>
        </div>

        {/* Row 2: Breadcrumb Navigation & Explorer Address Bar */}
        <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Up one level button */}
            <button
              type="button"
              onClick={handleGoUpOneLevel}
              disabled={breadcrumbs.length <= 1}
              className="p-1.5 rounded-md hover:bg-gray-200 text-gray-600 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              title="Lên một cấp thư mục cha"
            >
              <CornerLeftUp className="w-4 h-4" />
            </button>

            <span className="text-gray-300">|</span>

            {/* Interactive Breadcrumb path */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {breadcrumbs.map((crumb, idx) => {
                const isLast = idx === breadcrumbs.length - 1;
                return (
                  <React.Fragment key={crumb._id}>
                    {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />}
                    <button
                      type="button"
                      onClick={() => handleOpenFolder(crumb._id)}
                      className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
                        isLast
                          ? 'bg-amber-100/70 text-amber-900 font-bold border border-amber-300'
                          : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900 font-medium'
                      }`}
                    >
                      {idx === 0 ? <Home className="w-3.5 h-3.5" /> : <Folder className="w-3.5 h-3.5 text-amber-600" />}
                      <span>{crumb.name}</span>
                    </button>
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Quick stats and refresh */}
          <div className="flex items-center gap-3 text-gray-500 font-mono text-[11px]">
            <span>📁 {subFolders.length} thư mục con</span>
            <span>•</span>
            <span>🛍 {products.length} lễ phẩm</span>
            <button
              type="button"
              onClick={() => fetchFolderContent(currentFolderId)}
              className="p-1 rounded hover:bg-gray-200 transition-colors"
              title="Tải lại nội dung thư mục"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingFolder ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SECTION 1: CÁC THƯ MỤC CON (SUBFOLDERS GRID)              */}
      {/* ======================================================== */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-amber-700" />
            <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Thư Mục Con ({subFolders.length})
            </h2>
          </div>

          {subFolders.length > 3 && (
            <div className="relative w-48">
              <input
                type="text"
                value={folderFilterQuery}
                onChange={(e) => setFolderFilterQuery(e.target.value)}
                placeholder="Lọc thư mục con..."
                className="w-full bg-white border border-gray-300 rounded-lg pl-7 pr-7 py-1 text-xs focus:outline-none focus:border-amber-600 shadow-2xs"
              />
              <Search className="w-3 h-3 text-gray-400 absolute left-2 top-2" />
              {folderFilterQuery && (
                <button
                  type="button"
                  onClick={() => setFolderFilterQuery('')}
                  className="absolute right-2 top-1.5 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
        </div>

        {loadingFolder ? (
          <div className="py-12 bg-white rounded-xl border border-gray-200 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-amber-700 mx-auto mb-2" />
            <span className="text-xs text-gray-500 font-medium">Đang nạp cấu trúc thư mục...</span>
          </div>
        ) : subFolders.length === 0 ? (
          <div className="py-8 px-4 bg-white rounded-xl border border-dashed border-gray-300 text-center">
            <Folder className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-gray-600">
              Không có thư mục con nào trong "{currentFolder.name}"
            </p>
            <p className="text-[11px] text-gray-400 mt-1">
              Bạn có thể bấm nút <strong className="text-amber-800">+ Thư Mục Mới</strong> ở trên để tạo thêm cấp folder con.
            </p>
          </div>
        ) : visibleSubfolders.length === 0 ? (
          <div className="py-8 px-4 bg-white rounded-xl border border-dashed border-gray-200 text-center text-xs text-gray-500">
            Không tìm thấy thư mục con nào khớp với "{folderFilterQuery}"
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {visibleSubfolders.map((folder) => (
              <div
                key={folder._id}
                onClick={() => handleOpenFolder(folder._id)}
                className="group relative bg-white hover:bg-amber-50/40 border border-gray-200 hover:border-amber-400 rounded-xl p-3.5 transition-all cursor-pointer shadow-2xs hover:shadow-md flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="w-11 h-11 rounded-lg bg-amber-100/80 border border-amber-300/80 text-amber-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform overflow-hidden shadow-2xs">
                      {folder.image ? (
                        <img
                          src={folder.image}
                          alt={folder.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Folder className="w-5 h-5 fill-amber-300/50" />
                      )}
                    </div>

                    {/* Actions menu for folder */}
                    <div
                      className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={(e) => openRenameFolderModal(folder, e)}
                        className="p-1 text-gray-400 hover:text-amber-800 hover:bg-amber-100 rounded transition-colors"
                        title="Đổi tên thư mục"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => openMoveFolderModal(folder, e)}
                        className="p-1 text-gray-400 hover:text-blue-800 hover:bg-blue-100 rounded transition-colors"
                        title="Di chuyển thư mục sang vị trí khác"
                      >
                        <Move className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => openDeleteFolderModal(folder, e)}
                        className="p-1 text-gray-400 hover:text-red-700 hover:bg-red-100 rounded transition-colors"
                        title="Xóa thư mục"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Folder Name */}
                  <h3
                    className="font-bold text-gray-900 text-xs sm:text-sm mt-3 group-hover:text-amber-900 truncate"
                    title={folder.name}
                  >
                    {folder.name}
                  </h3>
                  {folder.description && (
                    <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">
                      {folder.description}
                    </p>
                  )}
                </div>

                {/* Footer stats */}
                <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500 font-mono">
                  <span>{folder.subFolderCount || 0} mục con</span>
                  <span className="font-semibold text-amber-900 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                    {folder.productCount || 0} sản phẩm
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* SECTION 2: CÁC LỄ PHẨM TRONG THƯ MỤC NÀY (PRODUCTS TABLE) */}
      {/* ======================================================== */}
      <div className="space-y-3 pt-2">
        {/* Main Search & Scope Header */}
        <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs space-y-3">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
            {/* Title & Scope selector */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-[#d70018]" />
                <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                  {searchScope === 'ALL' ? 'Toàn Bộ Lễ Phẩm Hệ Thống' : `Lễ Phẩm Trong "${currentFolder.name}"`}
                  <span className="ml-1 text-gray-500 font-normal">({totalCount})</span>
                </h2>
              </div>

              {/* Scope toggle buttons */}
              <div className="inline-flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setSearchScope('CURRENT');
                    fetchFolderContent(currentFolderId, { searchScope: 'CURRENT' });
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-semibold transition-all ${
                    searchScope === 'CURRENT'
                      ? 'bg-white text-amber-900 shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Folder className="w-3 h-3 text-amber-700" />
                  <span>Trong Thư Mục Này</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSearchScope('ALL');
                    fetchFolderContent(currentFolderId, { searchScope: 'ALL' });
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-semibold transition-all ${
                    searchScope === 'ALL'
                      ? 'bg-amber-700 text-white shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Layers className="w-3 h-3" />
                  <span>Toàn Bộ Hệ Thống</span>
                </button>
              </div>
            </div>

            {/* Search Input & Action Buttons */}
            <div className="flex items-center gap-2 w-full lg:w-auto">
              <div ref={searchContainerRef} className="relative flex-1 lg:w-80">
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => handleSearchInputChange(e.target.value)}
                  onFocus={() => {
                    if (productSearch.trim()) setShowSuggestions(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') setShowSuggestions(false);
                    if (e.key === 'Enter') {
                      setShowSuggestions(false);
                      fetchFolderContent(currentFolderId);
                    }
                  }}
                  placeholder={
                    searchScope === 'ALL'
                      ? 'Gõ tìm kiếm tên, SKU toàn hệ thống...'
                      : 'Gõ tìm tên hoặc SKU trong thư mục...'
                  }
                  className="w-full bg-white border border-gray-300 rounded-lg pl-8 pr-14 py-1.5 text-xs focus:outline-none focus:border-amber-600 shadow-2xs"
                />
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />

                <div className="absolute right-2 top-1.5 flex items-center gap-1">
                  {loadingSuggestions && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-700" />
                  )}
                  {productSearch && (
                    <button
                      type="button"
                      onClick={() => {
                        handleSearchInputChange('');
                      }}
                      className="text-gray-400 hover:text-gray-600 p-0.5"
                      title="Xóa tìm kiếm"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Suggestions Dropdown Popup */}
                {showSuggestions && productSearch.trim().length > 0 && (
                  <div
                    className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 overflow-hidden text-xs divide-y divide-gray-100 max-h-[420px] overflow-y-auto animate-fadeIn"
                    style={{ minWidth: '320px' }}
                  >
                    {loadingSuggestions && suggestions.folders.length === 0 && suggestions.products.length === 0 && (
                      <div className="p-4 text-center text-gray-500 flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-amber-700" />
                        <span>Đang tìm kiếm gợi ý...</span>
                      </div>
                    )}

                    {/* Section: Thư Mục Gợi Ý */}
                    {suggestions.folders.length > 0 && (
                      <div className="p-2">
                        <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center justify-between">
                          <span>📁 Thư Mục Phù Hợp</span>
                          <span>{suggestions.folders.length} thư mục</span>
                        </div>
                        <div className="space-y-0.5 mt-1">
                          {suggestions.folders.map((folder) => (
                            <button
                              key={folder._id}
                              type="button"
                              onClick={() => {
                                handleOpenFolder(folder._id);
                                setShowSuggestions(false);
                                setProductSearch('');
                              }}
                              className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-amber-50 text-left transition-colors group cursor-pointer"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="w-6 h-6 rounded bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                                  <Folder className="w-3.5 h-3.5 fill-amber-300/60" />
                                </div>
                                <div className="truncate">
                                  <div className="font-semibold text-gray-900 group-hover:text-amber-900 truncate">
                                    {folder.name}
                                  </div>
                                  {folder.fullPath && folder.fullPath !== folder.name && (
                                    <div className="text-[10px] text-gray-400 truncate">
                                      {folder.fullPath}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <span className="text-[10px] font-medium text-amber-700 bg-amber-100/60 px-1.5 py-0.5 rounded shrink-0 ml-2">
                                Mở thư mục ➔
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Section: Lễ Phẩm Gợi Ý */}
                    {suggestions.products.length > 0 && (
                      <div className="p-2">
                        <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center justify-between">
                          <span>🛍 Lễ Phẩm Gợi Ý</span>
                          <span>{suggestions.products.length} sản phẩm</span>
                        </div>
                        <div className="space-y-0.5 mt-1">
                          {suggestions.products.map((prod) => (
                            <button
                              key={prod._id}
                              type="button"
                              onClick={() => {
                                setProductSearch(prod.name);
                                setShowSuggestions(false);
                                setSearchScope('ALL');
                                fetchFolderContent(currentFolderId, {
                                  productSearch: prod.name,
                                  searchScope: 'ALL',
                                });
                              }}
                              className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-amber-50 text-left transition-colors group cursor-pointer"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <img
                                  src={prod.thumbnail || prod.images?.[0] || 'https://placehold.co/80x80?text=SP'}
                                  alt={prod.name}
                                  className="w-8 h-8 rounded-md object-cover border border-gray-200 bg-gray-50 shrink-0"
                                />
                                <div className="truncate">
                                  <div className="font-semibold text-gray-900 group-hover:text-amber-900 truncate">
                                    {prod.name}
                                  </div>
                                  <div className="flex items-center gap-2 text-[10px] text-gray-500">
                                    <span className="font-mono">{prod.sku || 'No SKU'}</span>
                                    <span>•</span>
                                    <span className="text-amber-800 font-bold">{formatVND(prod.price)}</span>
                                    {prod.category?.name && (
                                      <>
                                        <span>•</span>
                                        <span className="text-gray-400">📁 {prod.category.name}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-amber-800 shrink-0 ml-2" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Section: Không tìm thấy */}
                    {!loadingSuggestions && suggestions.folders.length === 0 && suggestions.products.length === 0 && (
                      <div className="p-4 text-center text-gray-500">
                        <p className="font-medium text-gray-700">Không tìm thấy gợi ý phù hợp</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          Thử gõ từ khóa khác hoặc kiểm tra lại chính tả
                        </p>
                      </div>
                    )}

                    {/* Footer: Xem toàn bộ kết quả */}
                    <div className="p-2 bg-gray-50 flex items-center justify-between text-[11px] border-t border-gray-100">
                      <span className="text-gray-500">
                        Tìm: <strong>"{productSearch}"</strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setShowSuggestions(false);
                          fetchFolderContent(currentFolderId, { productSearch });
                        }}
                        className="font-bold text-amber-800 hover:underline flex items-center gap-1"
                      >
                        <span>Xem kết quả trong bảng</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Filter toggle button */}
              <button
                type="button"
                onClick={() => setShowFilterPanel(!showFilterPanel)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                  showFilterPanel || activeFiltersCount > 0
                    ? 'bg-amber-50 border-amber-400 text-amber-900'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Lọc</span>
                {activeFiltersCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-amber-700 text-white text-[10px] font-bold flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              {/* Submit search button */}
              <button
                type="button"
                onClick={() => fetchFolderContent(currentFolderId)}
                className="px-3.5 py-1.5 bg-amber-800 hover:bg-amber-900 text-white text-xs font-semibold rounded-lg transition-colors shadow-2xs"
              >
                Tìm
              </button>

              {/* Batch Edit mode button */}
              <button
                type="button"
                onClick={handleToggleBatchEditMode}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                  isBatchEditMode
                    ? 'bg-amber-500 text-white border-amber-600'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
                title="Bật/Tắt chế độ sửa nhanh nhiều dòng"
              >
                {isBatchEditMode ? 'Thoát Sửa Hàng Loạt' : 'Sửa Nhanh'}
              </button>
            </div>
          </div>

          {/* Expandable Filter Panel */}
          {showFilterPanel && (
            <div className="pt-3 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-gray-50/70 p-3 rounded-lg border border-gray-200 animate-fadeIn">
              {/* Filter 1: Trạng thái kinh doanh */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Trạng Thái Kinh Doanh</label>
                <select
                  value={filterStatus}
                  onChange={(e) => {
                    setFilterStatus(e.target.value);
                    fetchFolderContent(currentFolderId, { filterStatus: e.target.value });
                  }}
                  className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-600 text-xs"
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="ACTIVE">🟢 Đang kinh doanh</option>
                  <option value="INACTIVE">🔴 Tạm ẩn</option>
                </select>
              </div>

              {/* Filter 2: Tồn kho */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Tình Trạng Kho Hàng</label>
                <select
                  value={filterStock}
                  onChange={(e) => {
                    setFilterStock(e.target.value);
                    fetchFolderContent(currentFolderId, { filterStock: e.target.value });
                  }}
                  className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-600 text-xs"
                >
                  <option value="ALL">Tất cả kho hàng</option>
                  <option value="IN_STOCK">📦 Còn hàng ({'>'} 0)</option>
                  <option value="LOW_STOCK">⚠️ Sắp hết hàng (≤ 5)</option>
                  <option value="OUT_OF_STOCK">❌ Hết hàng (0)</option>
                </select>
              </div>

              {/* Filter 3: Khoảng giá */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Khoảng Giá (đ)</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    value={filterMinPrice}
                    onChange={(e) => setFilterMinPrice(e.target.value)}
                    placeholder="Từ..."
                    className="w-1/2 bg-white border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-amber-600"
                  />
                  <span className="text-gray-400">-</span>
                  <input
                    type="number"
                    value={filterMaxPrice}
                    onChange={(e) => setFilterMaxPrice(e.target.value)}
                    placeholder="Đến..."
                    className="w-1/2 bg-white border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-amber-600"
                  />
                </div>
              </div>

              {/* Filter 4: Sắp xếp */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Sắp Xếp Theo</label>
                <select
                  value={filterSort}
                  onChange={(e) => {
                    setFilterSort(e.target.value);
                    fetchFolderContent(currentFolderId, { filterSort: e.target.value });
                  }}
                  className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-600 text-xs"
                >
                  <option value="newest">Mới nhất trước</option>
                  <option value="oldest">Cũ nhất trước</option>
                  <option value="price_asc">Giá tăng dần</option>
                  <option value="price_desc">Giá giảm dần</option>
                  <option value="stock_desc">Tồn kho nhiều nhất</option>
                  <option value="stock_asc">Tồn kho ít nhất</option>
                  <option value="name">Tên A-Z</option>
                  <option value="name_desc">Tên Z-A</option>
                </select>
              </div>

              {/* Actions row inside filter panel */}
              <div className="sm:col-span-2 md:col-span-4 flex items-center justify-between pt-2 border-t border-gray-200">
                <div className="text-[11px] text-gray-500">
                  {activeFiltersCount > 0 ? `Đang áp dụng ${activeFiltersCount} tiêu chí lọc` : 'Chưa có bộ lọc nào'}
                </div>
                <div className="flex items-center gap-2">
                  {activeFiltersCount > 0 && (
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="px-3 py-1 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-lg text-xs font-medium transition-colors"
                    >
                      Đặt Lại Bộ Lọc
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => fetchFolderContent(currentFolderId)}
                    className="px-4 py-1 bg-amber-800 hover:bg-amber-900 text-white rounded-lg text-xs font-semibold transition-colors shadow-2xs"
                  >
                    Áp Dụng
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Active Filter Chips */}
          {activeFiltersCount > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px]">
              <span className="text-gray-500 font-medium">Đang lọc:</span>

              {searchScope === 'ALL' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded-full font-medium">
                  🌐 Toàn hệ thống
                  <button
                    type="button"
                    onClick={() => {
                      setSearchScope('CURRENT');
                      fetchFolderContent(currentFolderId, { searchScope: 'CURRENT' });
                    }}
                    className="hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {filterStatus !== 'ALL' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 rounded-full font-medium">
                  {filterStatus === 'ACTIVE' ? 'Đang kinh doanh' : 'Tạm ẩn'}
                  <button
                    type="button"
                    onClick={() => {
                      setFilterStatus('ALL');
                      fetchFolderContent(currentFolderId, { filterStatus: 'ALL' });
                    }}
                    className="hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {filterStock !== 'ALL' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-800 border border-purple-200 rounded-full font-medium">
                  {filterStock === 'IN_STOCK' ? 'Còn hàng' : filterStock === 'LOW_STOCK' ? 'Sắp hết hàng' : 'Hết hàng'}
                  <button
                    type="button"
                    onClick={() => {
                      setFilterStock('ALL');
                      fetchFolderContent(currentFolderId, { filterStock: 'ALL' });
                    }}
                    className="hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {(filterMinPrice || filterMaxPrice) && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full font-medium">
                  Giá: {filterMinPrice ? `${formatVND(Number(filterMinPrice))}` : '0'} - {filterMaxPrice ? `${formatVND(Number(filterMaxPrice))}` : '∞'}
                  <button
                    type="button"
                    onClick={() => {
                      setFilterMinPrice('');
                      setFilterMaxPrice('');
                      fetchFolderContent(currentFolderId, { filterMinPrice: '', filterMaxPrice: '' });
                    }}
                    className="hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {filterSort !== 'newest' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-800 border border-gray-300 rounded-full font-medium">
                  Sắp xếp: {filterSort}
                  <button
                    type="button"
                    onClick={() => {
                      setFilterSort('newest');
                      fetchFolderContent(currentFolderId, { filterSort: 'newest' });
                    }}
                    className="hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              <button
                type="button"
                onClick={handleResetFilters}
                className="text-[11px] text-red-600 hover:underline font-semibold ml-1"
              >
                Xóa tất cả
              </button>
            </div>
          )}
        </div>

        {/* Bulk Action Toolbar if items selected */}
        {selectedIds.length > 0 && (
          <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="font-semibold text-amber-900 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Đang chọn {selectedIds.length} lễ phẩm</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={openMoveBulkProducts}
                className="flex items-center gap-1 px-3 py-1.5 bg-white border border-blue-300 hover:bg-blue-50 text-blue-800 font-semibold rounded-lg shadow-2xs transition-colors"
              >
                <Move className="w-3.5 h-3.5" />
                <span>Di Chuyển Sang Thư Mục Khác</span>
              </button>

              <button
                type="button"
                onClick={() => setBulkDeleteConfirmOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 bg-white border border-red-300 hover:bg-red-50 text-red-700 font-semibold rounded-lg shadow-2xs transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa Đã Chọn</span>
              </button>
            </div>
          </div>
        )}

        {/* Table of products */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden relative">
          {/* Subtle live search progress bar */}
          {isSearchingProducts && (
            <div className="absolute inset-x-0 top-0 h-1 bg-amber-100 overflow-hidden z-20">
              <div className="h-full bg-amber-700 animate-pulse w-full" />
            </div>
          )}

          {loadingProducts ? (
            <div className="py-16 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-amber-700 mx-auto mb-2" />
              <span className="text-xs text-gray-500 font-medium">Đang tải danh sách lễ phẩm...</span>
            </div>
          ) : products.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <Package className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-gray-600">
                {activeFiltersCount > 0 || productSearch
                  ? 'Không tìm thấy lễ phẩm nào phù hợp với bộ lọc'
                  : `Thư mục "${currentFolder.name}" chưa có lễ phẩm nào`}
              </p>
              <p className="text-[11px] text-gray-400 mt-1">
                {activeFiltersCount > 0 || productSearch ? (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="text-amber-800 hover:underline font-semibold"
                  >
                    Bấm vào đây để xóa bộ lọc tìm kiếm
                  </button>
                ) : (
                  <span>
                    Bấm nút <strong className="text-[#d70018]">+ Thêm Lễ Phẩm</strong> ở góc trên để thêm sản phẩm trực tiếp vào đây.
                  </span>
                )}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className={`w-full text-left text-xs transition-opacity duration-150 ${isSearchingProducts ? 'opacity-65' : 'opacity-100'}`}>
                <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === products.length && products.length > 0}
                        onChange={handleSelectAll}
                        className="rounded text-amber-600 focus:ring-amber-500"
                      />
                    </th>
                    <th className="py-3 px-3">Lễ Phẩm</th>
                    <th className="py-3 px-3">Mã SKU</th>
                    {searchScope === 'ALL' && <th className="py-3 px-3">Thư Mục</th>}
                    <th className="py-3 px-3 text-right">Đơn Giá (đ)</th>
                    <th className="py-3 px-3 text-center">Tồn Kho</th>
                    <th className="py-3 px-3 text-center">Trạng Thái</th>
                    <th className="py-3 px-3 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products.map((p) => {
                    const isSelected = selectedIds.includes(p._id);
                    const isEditingPrice = editingCell?.id === p._id && editingCell?.field === 'price';
                    const isEditingStock = editingCell?.id === p._id && editingCell?.field === 'stock';

                    return (
                      <tr
                        key={p._id}
                        className={`hover:bg-amber-50/20 transition-colors ${
                          isSelected ? 'bg-amber-50/50' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="py-3 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              setSelectedIds((prev) =>
                                isSelected ? prev.filter((id) => id !== p._id) : [...prev, p._id]
                              );
                            }}
                            className="rounded text-amber-600 focus:ring-amber-500"
                          />
                        </td>

                        {/* Product info */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={p.thumbnail || p.images?.[0] || 'https://placehold.co/100x100?text=No+Image'}
                              alt={p.name}
                              className="w-10 h-10 object-cover rounded-lg border border-gray-200 bg-gray-50 shrink-0"
                            />
                            <div className="min-w-0 max-w-[280px]">
                              <div className="font-bold text-gray-900 truncate" title={p.name}>
                                {p.name}
                              </div>
                              <div className="text-[11px] text-gray-500 truncate">
                                Đơn vị: {p.unit || 'chiếc'}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* SKU */}
                        <td className="py-3 px-3 font-mono text-[11px] text-gray-600">
                          {p.sku || '-'}
                        </td>

                        {/* Folder badge if searchScope === 'ALL' */}
                        {searchScope === 'ALL' && (
                          <td className="py-3 px-3">
                            <button
                              type="button"
                              onClick={() => handleOpenFolder(p.category?._id || 'root')}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 hover:border-amber-300 transition-colors"
                              title="Bấm để mở thư mục chứa lễ phẩm này"
                            >
                              <Folder className="w-3 h-3 text-amber-600" />
                              <span className="truncate max-w-[130px]">
                                {p.category?.name || p.categoryNameSnapshot || 'Lễ Phẩm (Gốc)'}
                              </span>
                            </button>
                          </td>
                        )}

                        {/* Price (Quick inline edit) */}
                        <td className="py-3 px-3 text-right font-medium">
                          {isEditingPrice ? (
                            <div className="flex items-center justify-end gap-1">
                              <input
                                type="number"
                                autoFocus
                                value={cellInputVal}
                                onChange={(e) => setCellInputVal(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveCell(p._id, 'price');
                                  if (e.key === 'Escape') setEditingCell(null);
                                }}
                                className="w-24 px-1.5 py-1 text-right text-xs border border-amber-500 rounded focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveCell(p._id, 'price')}
                                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div
                              onClick={() => handleStartEditCell(p._id, 'price', p.price)}
                              className="cursor-pointer hover:text-amber-800 hover:underline"
                              title="Click để sửa nhanh đơn giá"
                            >
                              <span className="font-bold text-gray-900">{formatVND(p.price)}</span>
                              {p.originalPrice > p.price && (
                                <div className="text-[10px] text-gray-400 line-through">
                                  {formatVND(p.originalPrice)}
                                </div>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Stock (Quick inline edit + step) */}
                        <td className="py-3 px-3 text-center">
                          {isEditingStock ? (
                            <div className="flex items-center justify-center gap-1">
                              <input
                                type="number"
                                autoFocus
                                value={cellInputVal}
                                onChange={(e) => setCellInputVal(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveCell(p._id, 'stock');
                                  if (e.key === 'Escape') setEditingCell(null);
                                }}
                                className="w-16 px-1.5 py-1 text-center text-xs border border-amber-500 rounded focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveCell(p._id, 'stock')}
                                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleStepStock(p, -1)}
                                className="w-5 h-5 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center text-xs"
                              >
                                -
                              </button>
                              <span
                                onClick={() => handleStartEditCell(p._id, 'stock', p.stockQuantity)}
                                className={`px-2 py-0.5 rounded text-xs font-bold cursor-pointer hover:bg-amber-100 ${
                                  (p.stockQuantity || 0) <= 0
                                    ? 'text-red-700 bg-red-50'
                                    : 'text-gray-800'
                                }`}
                                title="Click để nhập số lượng tồn kho"
                              >
                                {p.stockQuantity ?? 0}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleStepStock(p, 1)}
                                className="w-5 h-5 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center text-xs"
                              >
                                +
                              </button>
                            </div>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10.5px] font-bold ${
                              p.status === 'ACTIVE'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-gray-100 text-gray-600 border border-gray-200'
                            }`}
                          >
                            {p.status === 'ACTIVE' ? 'Kinh doanh' : 'Tạm dừng'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* Move product to another folder button */}
                            <button
                              type="button"
                              onClick={() => openMoveSingleProduct(p)}
                              className="p-1.5 text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                              title="Di chuyển sang thư mục khác"
                            >
                              <Move className="w-4 h-4" />
                            </button>

                            {/* Edit detail button */}
                            <button
                              type="button"
                              onClick={() => openEditProductModal(p)}
                              className="p-1.5 text-gray-600 hover:text-amber-800 hover:bg-amber-50 rounded-md transition-colors"
                              title="Sửa thông tin sản phẩm"
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                            {/* Delete button */}
                            <button
                              type="button"
                              onClick={() => handleDeleteProduct(p._id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                              title="Xóa sản phẩm"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL 1: TẠO HOẶC ĐỔI TÊN THƯ MỤC                        */}
      {/* ======================================================== */}
      {folderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-md w-full overflow-hidden">
            <div className="px-5 py-4 bg-amber-50 border-b border-amber-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-amber-800" />
                <h3 className="font-bold text-gray-900 text-sm">
                  {folderModalMode === 'CREATE'
                    ? `Tạo Thư Mục Mới trong "${currentFolder.name}"`
                    : `Chỉnh Sửa Thư Mục "${editingFolder?.name}"`}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setFolderModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitFolderForm} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Tên Thư Mục (Danh Mục) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  placeholder="Ví dụ: Ngựa Con, Nhà Kho Nhỏ, Mẫu Loại 1..."
                  value={folderForm.name}
                  onChange={(e) => setFolderForm({ ...folderForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-600 text-xs"
                />
              </div>

              {/* Ảnh Minh Họa Thư Mục */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Ảnh Minh Họa Thư Mục / Danh Mục (Tùy chọn)
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-lg bg-gray-100 border border-gray-300 flex items-center justify-center overflow-hidden shrink-0">
                    {folderForm.image ? (
                      <img src={folderForm.image} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <input
                      type="url"
                      placeholder="Dán link ảnh https://..."
                      value={folderForm.image}
                      onChange={(e) => setFolderForm({ ...folderForm, image: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-[11px] focus:outline-none focus:border-amber-600"
                    />
                    <div className="flex items-center gap-2">
                      <label className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 rounded text-[11px] font-medium cursor-pointer transition-colors">
                        {uploadingFolderImage ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <UploadCloud className="w-3 h-3 text-gray-600" />
                        )}
                        <span>{uploadingFolderImage ? 'Đang tải ảnh...' : 'Tải ảnh từ máy'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFolderImageUpload}
                          disabled={uploadingFolderImage}
                          className="hidden"
                        />
                      </label>
                      {folderForm.image && (
                        <button
                          type="button"
                          onClick={() => setFolderForm({ ...folderForm, image: '' })}
                          className="text-[11px] text-red-600 hover:underline"
                        >
                          Xóa ảnh
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Mô Tả / Ghi Chú (Tùy chọn)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ghi chú phân loại lễ phẩm..."
                  value={folderForm.description}
                  onChange={(e) => setFolderForm({ ...folderForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-600 text-xs"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setFolderModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submittingFolder}
                  className="px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-sm"
                >
                  {submittingFolder ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{folderModalMode === 'CREATE' ? 'Tạo Thư Mục' : 'Lưu Thay Đổi'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: DI CHUYỂN THƯ MỤC (MOVE FOLDER)                 */}
      {/* ======================================================== */}
      {moveFolderModalOpen && movingFolder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-md w-full overflow-hidden">
            <div className="px-5 py-4 bg-blue-50 border-b border-blue-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Move className="w-5 h-5 text-blue-800" />
                <h3 className="font-bold text-gray-900 text-sm">
                  Di Chuyển Thư Mục "{movingFolder.name}"
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setMoveFolderModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitMoveFolder} className="p-5 space-y-4 text-xs">
              <p className="text-gray-600">
                Chọn thư mục cha đích mà bạn muốn chuyển thư mục <strong>"{movingFolder.name}"</strong> vào:
              </p>

              <div>
                <label className="block font-semibold text-gray-700 mb-1.5">
                  Thư Mục Đích:
                </label>
                <select
                  value={targetParentFolderId}
                  onChange={(e) => setTargetParentFolderId(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 font-mono text-xs bg-white"
                >
                  <option value="root">📁 [Thư mục gốc] Lễ Phẩm</option>
                  {allCategoriesTree.map((cat) => {
                    const isSelf = String(cat._id) === String(movingFolder._id);
                    return (
                      <option
                        key={cat._id}
                        value={cat._id}
                        disabled={isSelf}
                        className={isSelf ? 'text-gray-400 bg-gray-100' : ''}
                      >
                        {'\u00A0'.repeat(cat.level * 4)} 📁 {cat.name} {isSelf ? '(chính nó)' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-[11px] leading-relaxed">
                ℹ️ <strong>Lưu ý an toàn:</strong> Toàn bộ các thư mục con và sản phẩm bên trong thư mục này sẽ tự động đi theo. Hệ thống ngăn chặn việc di chuyển vào chính nó hoặc các con cháu của nó.
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setMoveFolderModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submittingMoveFolder}
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-sm"
                >
                  {submittingMoveFolder ? <Loader2 className="w-4 h-4 animate-spin" /> : <Move className="w-4 h-4" />}
                  <span>Xác Nhận Di Chuyển</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: XÓA THƯ MỤC (DELETE FOLDER CONFIRM)             */}
      {/* ======================================================== */}
      {deleteFolderModalOpen && deletingFolder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-md w-full overflow-hidden">
            <div className="px-5 py-4 bg-red-50 border-b border-red-200 flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-700">
                <Trash2 className="w-5 h-5" />
                <h3 className="font-bold text-sm">Xóa Thư Mục "{deletingFolder.name}"</h3>
              </div>
              <button
                type="button"
                onClick={() => setDeleteFolderModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <p className="text-gray-700 leading-relaxed">
                Bạn có chắc chắn muốn xóa thư mục <strong>"{deletingFolder.name}"</strong>?
              </p>

              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-2 text-[11.5px]">
                <div className="font-semibold text-gray-800">Phương án xử lý:</div>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="deleteOption"
                    checked={!deleteCascade}
                    onChange={() => setDeleteCascade(false)}
                    className="mt-0.5 text-amber-600"
                  />
                  <div>
                    <span className="font-bold text-gray-800">An toàn (Khuyên dùng):</span> Bảo toàn các thư mục con và sản phẩm, tự động chuyển lên thư mục cha.
                  </div>
                </label>

                <label className="flex items-start gap-2 cursor-pointer pt-1">
                  <input
                    type="radio"
                    name="deleteOption"
                    checked={deleteCascade}
                    onChange={() => setDeleteCascade(true)}
                    className="mt-0.5 text-red-600"
                  />
                  <div>
                    <span className="font-bold text-red-700">Xóa vĩnh viễn (Cascade):</span> Xóa sạch cả thư mục này cùng toàn bộ cây con và các sản phẩm bên trong.
                  </div>
                </label>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteFolderModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteFolder}
                  disabled={submittingDeleteFolder}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-sm"
                >
                  {submittingDeleteFolder ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  <span>Xóa Thư Mục</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: DI CHUYỂN SẢN PHẨM (MOVE PRODUCTS)              */}
      {/* ======================================================== */}
      {moveProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-md w-full overflow-hidden">
            <div className="px-5 py-4 bg-blue-50 border-b border-blue-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Move className="w-5 h-5 text-blue-800" />
                <h3 className="font-bold text-gray-900 text-sm">
                  Di Chuyển {movingProductIds.length} Lễ Phẩm Sang Thư Mục Khác
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setMoveProductModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitMoveProducts} className="p-5 space-y-4 text-xs">
              <p className="text-gray-600">
                Chọn thư mục đích bạn muốn chuyển <strong>{movingProductIds.length}</strong> lễ phẩm vào:
              </p>

              <div>
                <label className="block font-semibold text-gray-700 mb-1.5">
                  Thư Mục Đích:
                </label>
                <select
                  value={targetMoveFolderId}
                  onChange={(e) => setTargetMoveFolderId(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 font-mono text-xs bg-white"
                >
                  <option value="root">📁 [Thư mục gốc] Lễ Phẩm</option>
                  {allCategoriesTree.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {'\u00A0'.repeat(cat.level * 4)} 📁 {cat.name} ({cat.productCount} sp)
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 text-[11px] leading-relaxed">
                ℹ️ <strong>Bảo toàn tuyệt đối:</strong> Product ID, giá bán, hình ảnh, mã SKU và tồn kho được giữ nguyên 100%. Đơn hàng và giỏ hàng của khách hàng không bị ảnh hưởng.
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setMoveProductModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submittingMoveProduct}
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-sm"
                >
                  {submittingMoveProduct ? <Loader2 className="w-4 h-4 animate-spin" /> : <Move className="w-4 h-4" />}
                  <span>Xác Nhận Chuyển Folder</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 5: THÊM / SỬA LỄ PHẨM (CREATE / EDIT PRODUCT)      */}
      {/* ======================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  {modalMode === 'CREATE' ? 'Thêm Lễ Phẩm Mới' : 'Chỉnh Sửa Lễ Phẩm'}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Thư mục: <strong className="text-amber-800">{currentFolder.name}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error banner */}
            {formError && (
              <div className="px-6 py-2.5 bg-red-50 border-b border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                <span>{formError}</span>
              </div>
            )}

            {/* Tab selection */}
            <div className="flex border-b border-gray-200 bg-gray-50/50 px-6 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveFormTab('GENERAL')}
                className={`py-3 px-4 border-b-2 transition-colors ${
                  activeFormTab === 'GENERAL'
                    ? 'border-[#d70018] text-[#d70018]'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                Thông Tin Cơ Bản
              </button>
              <button
                type="button"
                onClick={() => setActiveFormTab('IMAGES')}
                className={`py-3 px-4 border-b-2 transition-colors ${
                  activeFormTab === 'IMAGES'
                    ? 'border-[#d70018] text-[#d70018]'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                Hình Ảnh ({formData.images.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveFormTab('SEO')}
                className={`py-3 px-4 border-b-2 transition-colors ${
                  activeFormTab === 'SEO'
                    ? 'border-[#d70018] text-[#d70018]'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                SEO & Chi Tiết
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmitProduct} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs custom-scrollbar">
              {activeFormTab === 'GENERAL' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">
                        Tên Lễ Phẩm <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ví dụ: Ngựa Đỏ Khai Quang, Cặp Đèn Nến..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-600 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">Mã SKU</label>
                      <input
                        type="text"
                        value={formData.sku}
                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                        placeholder="Tự động tạo nếu để trống..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-600 text-xs font-mono"
                      />
                    </div>
                  </div>

                  {/* Folder Destination selector */}
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      Thư Mục Chứa Lễ Phẩm:
                    </label>
                    <select
                      value={formData.category || ''}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-600 text-xs font-mono bg-white"
                    >
                      <option value="">📁 [Thư mục gốc] Lễ Phẩm</option>
                      {allCategoriesTree.map((cat) => (
                        <option key={cat._id} value={cat._id}>
                          {'\u00A0'.repeat(cat.level * 4)} 📁 {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">
                        Đơn Giá Bán (đ) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-600 text-xs text-right font-bold"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">
                        Giá Gốc / So Sánh (đ)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.originalPrice}
                        onChange={(e) => setFormData({ ...formData, originalPrice: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-600 text-xs text-right"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">Số Lượng Tồn</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.stockQuantity}
                        onChange={(e) => setFormData({ ...formData, stockQuantity: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-600 text-xs text-center font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">Đơn Vị Tính</label>
                      <input
                        type="text"
                        value={formData.unit}
                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                        placeholder="chiếc, bộ, cặp, con, hộp..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-600 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">Trạng Thái Kinh Doanh</label>
                      <select
                        value={formData.isActive ? 'ACTIVE' : 'INACTIVE'}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'ACTIVE' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-600 text-xs bg-white"
                      >
                        <option value="ACTIVE">Kinh doanh bình thường</option>
                        <option value="INACTIVE">Tạm ẩn / Ngừng bán</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Mô Tả Ngắn</label>
                    <textarea
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Mô tả ý nghĩa lễ nghi, quy cách chế tác..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-600 text-xs"
                    />
                  </div>
                </div>
              )}

              {activeFormTab === 'IMAGES' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-gray-900 text-xs">Danh Sách Hình Ảnh</h4>
                      <p className="text-[11px] text-gray-500">Ảnh đầu tiên sẽ làm ảnh đại diện thumbnail</p>
                    </div>

                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      className="hidden"
                    />

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg font-bold flex items-center gap-1.5 transition-colors"
                    >
                      {uploadingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
                      <span>Tải Ảnh Lên</span>
                    </button>
                  </div>

                  {formData.images.length === 0 ? (
                    <div className="py-12 border-2 border-dashed border-gray-300 rounded-xl text-center">
                      <ImageIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-xs text-gray-500">Chưa có ảnh nào cho lễ phẩm này</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {formData.images.map((img, idx) => (
                        <div key={idx} className="relative group rounded-lg overflow-hidden border border-gray-200 aspect-square bg-gray-50">
                          <img src={img} alt="product" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => {
                              const newImages = formData.images.filter((_, i) => i !== idx);
                              setFormData({
                                ...formData,
                                images: newImages,
                                thumbnail: newImages[0] || '',
                              });
                            }}
                            className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Xóa ảnh"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          {idx === 0 && (
                            <span className="absolute bottom-1 left-1 bg-amber-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded">
                              Đại diện
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeFormTab === 'SEO' && (
                <div className="space-y-4">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Chất Liệu Chế Tác</label>
                    <input
                      type="text"
                      value={formData.material}
                      onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                      placeholder="Giấy dó, giang nứa tự nhiên..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-600 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Kích Thước Quy Cách</label>
                    <input
                      type="text"
                      value={formData.dimensions}
                      onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                      placeholder="Cao 80cm x Rộng 50cm..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-600 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Chi Tiết Nghi Lễ / Khoa Nghi</label>
                    <textarea
                      rows={3}
                      value={formData.details}
                      onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                      placeholder="Dùng trong khóa lễ Mở Phủ, Tiễn Căn, Giải Hạn..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-600 text-xs"
                    />
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 bg-[#d70018] hover:bg-[#b00013] text-white rounded-lg font-bold flex items-center gap-1.5 shadow-xs"
                >
                  {formSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{modalMode === 'CREATE' ? 'Tạo Lễ Phẩm' : 'Cập Nhật Lễ Phẩm'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Single Product Confirm Modal */}
      <ConfirmModal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDeleteProduct}
        title="Xác nhận xóa lễ phẩm"
        message="Bạn có chắc chắn muốn xóa lễ phẩm này không? Thao tác này không thể hoàn tác."
      />

      {/* Bulk Delete Confirm Modal */}
      <ConfirmModal
        isOpen={bulkDeleteConfirmOpen}
        onClose={() => setBulkDeleteConfirmOpen(false)}
        onConfirm={handleBulkDeleteConfirm}
        title="Xác nhận xóa hàng loạt"
        message={`Bạn có chắc muốn xóa vĩnh viễn ${selectedIds.length} lễ phẩm đã chọn?`}
      />
    </div>
  );
}
