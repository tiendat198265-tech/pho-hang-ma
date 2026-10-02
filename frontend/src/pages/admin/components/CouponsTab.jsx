import React, { useState, useEffect } from 'react';
import {
  Ticket,
  Plus,
  Edit,
  Trash2,
  Loader2,
  Search,
  CheckCircle2,
  XCircle,
  Calendar,
  Percent,
} from 'lucide-react';
import { formatVND } from '../../../utils/exportUtils';
import ConfirmModal from './ConfirmModal';

export default function CouponsTab({ token }) {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('CREATE');
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'PERCENTAGE',
    discountValue: 10,
    minOrderValue: 0,
    maxDiscount: 0,
    usageLimit: 100,
    userUsageLimit: 1,
    startDate: '',
    endDate: '',
    isActive: true,
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Delete
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/coupons', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setCoupons(data.data);
      }
    } catch (err) {
      console.error('Lỗi tải mã giảm giá:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleOpenCreate = () => {
    setModalMode('CREATE');
    setEditingId(null);
    setFormData({
      code: '',
      description: '',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      minOrderValue: 500000,
      maxDiscount: 200000,
      usageLimit: 100,
      userUsageLimit: 1,
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      isActive: true,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c) => {
    setModalMode('EDIT');
    setEditingId(c._id);
    setFormData({
      code: c.code || '',
      description: c.description || '',
      discountType: c.discountType || 'PERCENTAGE',
      discountValue: c.discountValue || 0,
      minOrderValue: c.minOrderValue || 0,
      maxDiscount: c.maxDiscount || 0,
      usageLimit: c.usageLimit || 0,
      userUsageLimit: c.userUsageLimit || 1,
      startDate: c.startDate ? new Date(c.startDate).toISOString().slice(0, 10) : '',
      endDate: c.endDate ? new Date(c.endDate).toISOString().slice(0, 10) : '',
      isActive: c.isActive !== false,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      setFormError('Vui lòng nhập mã giảm giá');
      return;
    }

    try {
      setFormSubmitting(true);
      setFormError(null);

      const url = modalMode === 'CREATE' ? '/api/coupons' : `/api/coupons/${editingId}`;
      const method = modalMode === 'CREATE' ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      const result = await res.json();
      if (result.success) {
        setIsModalOpen(false);
        fetchCoupons();
      } else {
        setFormError(result.message || 'Lỗi khi lưu mã giảm giá');
      }
    } catch (err) {
      console.error('Lỗi submit coupon:', err);
      setFormError('Lỗi kết nối máy chủ');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleToggleActive = async (id) => {
    try {
      const res = await fetch(`/api/coupons/${id}/toggle`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (result.success) {
        fetchCoupons();
      }
    } catch (err) {
      console.error('Lỗi toggle coupon:', err);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      const res = await fetch(`/api/coupons/${deletingId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (result.success) {
        setDeleteConfirmOpen(false);
        setDeletingId(null);
        fetchCoupons();
      } else {
        alert(result.message || 'Không thể xóa coupon này');
      }
    } catch (err) {
      console.error('Lỗi xóa coupon:', err);
    }
  };

  const filtered = coupons.filter((c) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return c.code.toLowerCase().includes(term) || c.description?.toLowerCase().includes(term);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Quản Lý Mã Giảm Giá & Voucher</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Cấu hình mã ưu đãi mùa lễ, giảm theo phần trăm hoặc số tiền, kiểm soát lượt dùng mỗi khách
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-4 py-2 bg-amber-400 hover:bg-amber-500 text-black text-xs font-bold rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo Mã Giảm Giá Mới</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <input
            type="text"
            placeholder="Tìm theo mã coupon, mô tả ưu đãi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-amber-600"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
        </div>
        <div className="text-xs text-gray-500 font-mono">
          Tổng số: <span className="font-bold text-gray-800">{coupons.length}</span> mã
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">Mã Coupon</th>
                <th className="py-3 px-4">Mô Tả Khuyến Mãi</th>
                <th className="py-3 px-4 text-center">Mức Giảm</th>
                <th className="py-3 px-4 text-right">Đơn Tối Thiểu</th>
                <th className="py-3 px-4 text-center">Lượt Dùng</th>
                <th className="py-3 px-4 text-center">Hiệu Lực</th>
                <th className="py-3 px-4 text-center">Trạng Thái</th>
                <th className="py-3 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin text-amber-600 mx-auto mb-2" />
                    <span>Đang tải mã giảm giá...</span>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-400">
                    Không có mã giảm giá nào
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c._id} className="hover:bg-amber-50/20 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-primary-900">{c.code}</td>
                    <td className="py-3 px-4 text-gray-700 max-w-xs">{c.description || '-'}</td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-700 font-mono">
                      {c.discountType === 'PERCENTAGE'
                        ? `${c.discountValue}%`
                        : formatVND(c.discountValue)}
                      {c.discountType === 'PERCENTAGE' && c.maxDiscount > 0 && (
                        <div className="text-[10px] text-gray-400 font-normal">
                          Tối đa {formatVND(c.maxDiscount)}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-gray-700">
                      {formatVND(c.minOrderValue || 0)}
                    </td>
                    <td className="py-3 px-4 text-center font-mono">
                      <span className="font-bold text-gray-900">{c.usedCount || 0}</span> /{' '}
                      <span className="text-gray-500">{c.usageLimit || '∞'}</span>
                    </td>
                    <td className="py-3 px-4 text-center text-gray-500 font-mono text-[11px]">
                      {c.startDate ? new Date(c.startDate).toLocaleDateString('vi-VN') : '—'} -{' '}
                      {c.endDate ? new Date(c.endDate).toLocaleDateString('vi-VN') : '—'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleToggleActive(c._id)}
                        className={`px-2 py-0.5 rounded-full text-[11px] font-semibold transition-colors ${
                          c.isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {c.isActive ? 'Đang bật' : 'Đang tắt'}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setDeletingId(c._id);
                            setDeleteConfirmOpen(true);
                          }}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                          title="Xóa mã"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Thêm / Sửa Coupon */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-base font-bold text-gray-900">
                {modalMode === 'CREATE' ? 'Tạo Mã Giảm Giá Mới' : 'Chỉnh Sửa Mã Giảm Giá'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Mã Coupon <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value.toUpperCase() })
                    }
                    placeholder="HANGMA10"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono font-bold focus:outline-none focus:border-amber-600"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Loại giảm giá <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-amber-600"
                  >
                    <option value="PERCENTAGE">Theo phần trăm (%)</option>
                    <option value="FIXED">Số tiền cố định (VNĐ)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Mô tả chương trình ưu đãi
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Giảm 10% đơn hàng thỉnh lễ đầu xuân..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Giá trị giảm ({formData.discountType === 'PERCENTAGE' ? '%' : 'VNĐ'}){' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.discountValue}
                    onChange={(e) =>
                      setFormData({ ...formData, discountValue: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono focus:outline-none focus:border-amber-600"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Giảm tối đa (VNĐ)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={formData.maxDiscount}
                    onChange={(e) =>
                      setFormData({ ...formData, maxDiscount: Number(e.target.value) })
                    }
                    placeholder="0 nếu không giới hạn"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono focus:outline-none focus:border-amber-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Đơn tối thiểu (VNĐ)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={formData.minOrderValue}
                    onChange={(e) =>
                      setFormData({ ...formData, minOrderValue: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono focus:outline-none focus:border-amber-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Tổng lượt dùng
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.usageLimit}
                    onChange={(e) =>
                      setFormData({ ...formData, usageLimit: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono focus:outline-none focus:border-amber-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Lượt / khách
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.userUsageLimit}
                    onChange={(e) =>
                      setFormData({ ...formData, userUsageLimit: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono focus:outline-none focus:border-amber-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Ngày bắt đầu
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Ngày kết thúc
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-600"
                  />
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
                  disabled={formSubmitting}
                  className="px-5 py-2 font-bold text-black bg-amber-400 hover:bg-amber-500 rounded-lg shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  {formSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{modalMode === 'CREATE' ? 'Tạo Coupon' : 'Lưu Thay Đổi'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      <ConfirmModal
        isOpen={deleteConfirmOpen}
        title="Xóa Mã Giảm Giá"
        message="Bạn có chắc chắn muốn xóa mã giảm giá này không?"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirmOpen(false)}
      />
    </div>
  );
}
