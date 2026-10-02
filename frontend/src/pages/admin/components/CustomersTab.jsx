import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Lock,
  Unlock,
  Eye,
  Loader2,
  ShoppingBag,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Plus,
  Edit,
  Trash2,
  History,
} from 'lucide-react';
import { formatVND } from '../../../utils/exportUtils';
import { getStatusText } from '../../../utils/statusTranslations';
import ConfirmModal from './ConfirmModal';

export default function CustomersTab({ token }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Selected Customer Detail Modal
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Add / Edit Customer Modal
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formModalMode, setFormModalMode] = useState('CREATE'); // 'CREATE' | 'EDIT'
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    isActive: true,
  });
  const [submittingForm, setSubmittingForm] = useState(false);
  const [formError, setFormError] = useState(null);

  // Lock / Unlock Confirm Modal
  const [lockConfirmOpen, setLockConfirmOpen] = useState(false);
  const [targetCustomer, setTargetCustomer] = useState(null);
  const [locking, setLocking] = useState(false);

  // Delete Confirm Modal
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [targetDeleteCustomer, setTargetDeleteCustomer] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      let url = '/api/admin/users?role=CUSTOMER';
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (statusFilter) url += `&status=${statusFilter}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        const list = Array.isArray(data.data) ? data.data : (data.data?.users || data.users || []);
        setCustomers(list);
      }
    } catch (err) {
      console.error('Lỗi tải khách hàng:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCustomers();
  };

  const handleOpenCreate = () => {
    setFormModalMode('CREATE');
    setEditingId(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      password: '',
      isActive: true,
    });
    setFormError(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (c) => {
    setFormModalMode('EDIT');
    setEditingId(c._id);
    setFormData({
      name: c.name || '',
      email: c.email || '',
      phone: c.phone || '',
      address: c.address || '',
      password: '',
      isActive: c.isActive !== false,
    });
    setFormError(null);
    setIsFormModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmittingForm(true);
      setFormError(null);

      const url = formModalMode === 'CREATE' ? '/api/admin/users' : `/api/admin/users/${editingId}`;
      const method = formModalMode === 'CREATE' ? 'POST' : 'PUT';

      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        role: 'CUSTOMER',
        isActive: formData.isActive,
      };

      if (formData.password && formData.password.trim()) {
        payload.password = formData.password.trim();
      }

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
        setIsFormModalOpen(false);
        fetchCustomers();
      } else {
        setFormError(result.message || 'Lỗi lưu thông tin khách hàng');
      }
    } catch (err) {
      console.error('Lỗi lưu khách hàng:', err);
      setFormError('Lỗi kết nối máy chủ');
    } finally {
      setSubmittingForm(false);
    }
  };

  const handleOpenDetail = async (c) => {
    setSelectedCustomer(c);
    setIsDetailOpen(true);
    setLoadingOrders(true);
    try {
      const res = await fetch(`/api/admin/users/${c._id}/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setCustomerOrders(data.data);
      }
    } catch (err) {
      console.error('Lỗi tải đơn hàng của khách:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleToggleLockConfirm = async () => {
    if (!targetCustomer) return;
    try {
      setLocking(true);
      const res = await fetch(`/api/admin/users/${targetCustomer._id}/toggle-status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setLockConfirmOpen(false);
        setTargetCustomer(null);
        fetchCustomers();
      } else {
        alert(data.message || 'Lỗi cập nhật trạng thái tài khoản');
      }
    } catch (err) {
      console.error('Lỗi khóa tài khoản:', err);
    } finally {
      setLocking(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!targetDeleteCustomer) return;
    try {
      setDeleting(true);
      const res = await fetch(`/api/admin/users/${targetDeleteCustomer._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setDeleteConfirmOpen(false);
        setTargetDeleteCustomer(null);
        fetchCustomers();
      } else {
        alert(data.message || 'Lỗi khi xóa khách hàng');
      }
    } catch (err) {
      console.error('Lỗi xóa khách hàng:', err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Quản Lý Danh Sách Khách Hàng</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Theo dõi thông tin liên lạc, lịch sử đơn đặt lễ và chỉnh sửa cập nhật trực tiếp cơ sở dữ liệu
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs text-gray-500 font-mono hidden sm:block">
            Tổng số: <span className="font-bold text-gray-800">{customers.length}</span> tài khoản khách
          </div>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-400 hover:bg-amber-500 text-black text-xs font-bold rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Khách Hàng</span>
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Tìm theo tên, email, số điện thoại..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-amber-600"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-amber-600"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="INACTIVE">Bị khóa</option>
          </select>

          <button
            type="submit"
            className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Tìm Kiếm
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">Khách Hàng</th>
                <th className="py-3 px-4">Liên Lạc</th>
                <th className="py-3 px-4">Địa Chỉ Giao Hàng</th>
                <th className="py-3 px-4">Ngày Đăng Ký</th>
                <th className="py-3 px-4 text-center">Trạng Thái</th>
                <th className="py-3 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin text-amber-600 mx-auto mb-2" />
                    <span>Đang nạp danh sách khách hàng...</span>
                  </td>
                </tr>
              ) : !Array.isArray(customers) || customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400">
                    Không tìm thấy khách hàng nào
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c._id} className="hover:bg-amber-50/20 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-300 text-black font-bold flex items-center justify-center text-xs shrink-0">
                          {c.name ? c.name.charAt(0).toUpperCase() : 'K'}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 flex items-center gap-1.5">
                            <span>{c.name}</span>
                            {c.nameHistory && c.nameHistory.length > 0 && (
                              <span
                                className="px-1.5 py-0.2 bg-purple-100 text-purple-700 text-[10px] rounded font-semibold border border-purple-200 inline-flex items-center gap-0.5"
                                title={`Khách hàng đã đổi tên ${c.nameHistory.length} lần. Tên gốc: ${c.nameHistory[0]?.oldName}`}
                              >
                                <History size={10} />
                                <span>Đổi tên ({c.nameHistory.length})</span>
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-gray-500 font-mono">{c.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-gray-700">{c.phone || '-'}</td>
                    <td className="py-3 px-4 text-gray-600 max-w-xs truncate">
                      {c.address || '-'}
                    </td>
                    <td className="py-3 px-4 text-gray-500 font-mono">
                      {new Date(c.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          c.isActive !== false
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {c.isActive !== false ? 'Hoạt động' : 'Đã khóa'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenDetail(c)}
                          className="px-2.5 py-1 bg-amber-400 hover:bg-amber-500 text-black font-bold rounded-md flex items-center gap-1 shadow-2xs"
                          title="Xem lịch sử đơn hàng"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Hồ Sơ</span>
                        </button>
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          title="Chỉnh sửa thông tin khách hàng"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setTargetCustomer(c);
                            setLockConfirmOpen(true);
                          }}
                          className={`p-1.5 rounded-md transition-colors ${
                            c.isActive !== false
                              ? 'text-amber-600 hover:bg-amber-50'
                              : 'text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={c.isActive !== false ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                        >
                          {c.isActive !== false ? (
                            <Lock className="w-4 h-4" />
                          ) : (
                            <Unlock className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setTargetDeleteCustomer(c);
                            setDeleteConfirmOpen(true);
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Xóa tài khoản khách hàng"
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

      {/* Add / Edit Customer Modal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-primary-950 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold tracking-wide">
                {formModalMode === 'CREATE' ? 'Thêm Khách Hàng Mới' : 'Chỉnh Sửa Thông Tin Khách Hàng'}
              </h3>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nguyễn Văn A"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-600"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Email đăng nhập <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="khachhang@gmail.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-600 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="0912..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    {formModalMode === 'CREATE' ? 'Mật khẩu đăng nhập' : 'Đổi mật khẩu mới (Nếu có)'}{' '}
                    {formModalMode === 'CREATE' && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-600 font-mono"
                    required={formModalMode === 'CREATE'}
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Địa chỉ giao hàng mặc định
                </label>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Số nhà, đường phố, phường/xã, quận/huyện..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-600"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="customerIsActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <label htmlFor="customerIsActive" className="text-gray-700 font-medium cursor-pointer">
                  Tài khoản đang hoạt động (Bỏ chọn để khóa tài khoản)
                </label>
              </div>

              <div className="pt-3 border-t border-gray-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={submittingForm}
                  className="px-5 py-2 font-bold text-black bg-amber-400 hover:bg-amber-500 rounded-lg shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submittingForm && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{formModalMode === 'CREATE' ? 'Tạo Khách Hàng' : 'Lưu Thay Đổi'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Profile & Orders Modal */}
      {isDetailOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-primary-950 text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold tracking-wide">
                  HỒ SƠ KHÁCH HÀNG: {selectedCustomer.name}
                </h3>
                <div className="text-[11px] text-gray-300 font-mono">
                  Tham gia từ: {new Date(selectedCustomer.createdAt).toLocaleDateString('vi-VN')}
                </div>
              </div>
              <button
                onClick={() => setIsDetailOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
              {/* Profile Details */}
              <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="font-mono text-gray-700">{selectedCustomer.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="font-mono text-gray-700">
                    {selectedCustomer.phone || 'Chưa cập nhật'}
                  </span>
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="text-gray-700">
                    {selectedCustomer.address || 'Chưa lưu địa chỉ giao hàng'}
                  </span>
                </div>
              </div>

              {/* Lịch Sử Đổi Tên Tài Khoản */}
              {selectedCustomer.nameHistory && selectedCustomer.nameHistory.length > 0 && (
                <div className="p-3.5 bg-purple-50/70 border border-purple-200 rounded-xl space-y-2">
                  <div className="font-bold text-purple-900 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <History className="w-4 h-4 text-purple-700" />
                      <span>Lịch Sử Đổi Tên Tài Khoản ({selectedCustomer.nameHistory.length} lần)</span>
                    </span>
                    <span className="text-[10px] text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full font-semibold">
                      Kiểm toán hệ thống
                    </span>
                  </div>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto custom-scrollbar">
                    {selectedCustomer.nameHistory.slice().reverse().map((item, idx) => (
                      <div
                        key={idx}
                        className="p-2 bg-white rounded border border-purple-100 flex items-center justify-between text-xs"
                      >
                        <div>
                          Từ: <span className="line-through text-rose-600 mr-1">{item.oldName}</span> ➔ Sang:{' '}
                          <strong className="text-emerald-700">{item.newName}</strong>
                        </div>
                        <span className="text-[10px] text-gray-500 font-mono">
                          {new Date(item.changedAt).toLocaleString('vi-VN')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Orders History */}
              <div>
                <div className="font-bold text-gray-900 uppercase tracking-wide mb-2 flex items-center justify-between">
                  <span>Lịch Sử Đặt Đồ Mã ({customerOrders.length} đơn)</span>
                </div>

                {loadingOrders ? (
                  <div className="py-8 text-center text-gray-400">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-1 text-amber-600" />
                    <span>Đang tải đơn hàng...</span>
                  </div>
                ) : customerOrders.length === 0 ? (
                  <div className="py-6 text-center text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                    Khách hàng chưa có đơn hàng nào
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-100 text-gray-600 font-semibold border-b border-gray-200">
                        <tr>
                          <th className="py-2.5 px-3">Mã Đơn</th>
                          <th className="py-2.5 px-3">Ngày Đặt</th>
                          <th className="py-2.5 px-3">Trạng Thái</th>
                          <th className="py-2.5 px-3 text-right">Tổng Tiền</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {customerOrders.map((ord) => (
                          <tr key={ord._id} className="hover:bg-amber-50/20">
                            <td className="py-2.5 px-3 font-mono font-bold text-gray-900">
                              {ord.orderCode}
                            </td>
                            <td className="py-2.5 px-3 text-gray-500 font-mono">
                              {new Date(ord.createdAt).toLocaleDateString('vi-VN')}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-800">
                                {getStatusText(ord.orderStatus)}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-gray-900">
                              {formatVND(ord.totalAmount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-3 border-t border-gray-200 flex justify-end bg-gray-50">
              <button
                type="button"
                onClick={() => setIsDetailOpen(false)}
                className="px-4 py-2 font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 rounded-lg"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lock / Unlock Confirm Modal */}
      <ConfirmModal
        isOpen={lockConfirmOpen}
        title={targetCustomer?.isActive !== false ? 'Khóa Tài Khoản Khách' : 'Mở Khóa Tài Khoản'}
        message={`Bạn có chắc chắn muốn ${
          targetCustomer?.isActive !== false ? 'khóa' : 'mở khóa'
        } tài khoản của khách hàng "${targetCustomer?.name}" không?`}
        confirmColor={targetCustomer?.isActive !== false ? 'red' : 'primary'}
        loading={locking}
        onConfirm={handleToggleLockConfirm}
        onCancel={() => setLockConfirmOpen(false)}
      />

      {/* Delete Customer Confirm Modal */}
      <ConfirmModal
        isOpen={deleteConfirmOpen}
        title="Xóa Vĩnh Viễn Tài Khoản Khách Hàng"
        message={`Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản khách hàng "${targetDeleteCustomer?.name}" (${targetDeleteCustomer?.email}) khỏi cơ sở dữ liệu? Hành động này không thể hoàn tác.`}
        confirmColor="red"
        confirmText="Xác Nhận Xóa"
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirmOpen(false)}
      />
    </div>
  );
}
