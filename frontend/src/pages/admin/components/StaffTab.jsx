import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Plus,
  Edit,
  Trash2,
  Lock,
  Unlock,
  Loader2,
  Search,
  Check,
  UserCheck,
} from 'lucide-react';
import ConfirmModal from './ConfirmModal';

export default function StaffTab({ token, currentUser }) {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('CREATE'); // 'CREATE' | 'EDIT'
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'STAFF',
    permissions: [],
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Lock Confirm
  const [lockConfirmOpen, setLockConfirmOpen] = useState(false);
  const [targetStaff, setTargetStaff] = useState(null);
  const [locking, setLocking] = useState(false);

  // Delete Confirm
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [targetDeleteStaff, setTargetDeleteStaff] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  // Available permissions list for STAFF
  const availablePermissions = [
    { key: 'dashboard', label: 'Bàn làm việc & Thống kê cơ bản' },
    { key: 'orders', label: 'Xử lý đơn hàng & Cập nhật tiến trình' },
    { key: 'custom_orders', label: 'Tiếp nhận đơn theo yêu cầu & Báo giá' },
    { key: 'products', label: 'Quản lý sản phẩm đồ mã' },
    { key: 'categories', label: 'Quản lý danh mục' },
    { key: 'inventory', label: 'Quản lý kho hàng & Nhập xuất' },
    { key: 'coupons', label: 'Quản lý mã giảm giá' },
    { key: 'reviews', label: 'Kiểm duyệt đánh giá' },
    { key: 'customers', label: 'Xem danh sách khách hàng' },
    { key: 'banners', label: 'Quản lý banner website' },
  ];

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/users/staff', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        const list = Array.isArray(data.data) ? data.data : (data.data?.staff || data.staff || []);
        setStaffList(list);
      }
    } catch (err) {
      console.error('Lỗi tải nhân viên:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleOpenCreate = () => {
    setModalMode('CREATE');
    setEditingId(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      role: 'STAFF',
      permissions: ['orders', 'custom_orders', 'inventory'],
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (staff) => {
    setModalMode('EDIT');
    setEditingId(staff._id);
    setFormData({
      name: staff.name || '',
      email: staff.email || '',
      phone: staff.phone || '',
      password: '',
      role: staff.role || 'STAFF',
      permissions: Array.isArray(staff.permissions) ? staff.permissions : [],
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleTogglePermission = (key) => {
    let newPerms = [...formData.permissions];
    if (newPerms.includes(key)) {
      newPerms = newPerms.filter((p) => p !== key);
    } else {
      newPerms.push(key);
    }
    setFormData({ ...formData, permissions: newPerms });
  };

  const handleSelectAllPermissions = () => {
    if (formData.permissions.length === availablePermissions.length) {
      setFormData({ ...formData, permissions: [] });
    } else {
      setFormData({
        ...formData,
        permissions: availablePermissions.map((p) => p.key),
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Guard: regular ADMIN cannot self-promote or assign SUPER_ADMIN role!
    if (!isSuperAdmin && formData.role === 'SUPER_ADMIN') {
      setFormError('Chỉ có Tổng Quản Trị (SUPER_ADMIN) mới có quyền chỉ định chức vụ này');
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);

      const url =
        modalMode === 'CREATE' ? '/api/admin/users/staff' : `/api/admin/users/${editingId}`;
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
        fetchStaff();
      } else {
        setFormError(result.message || 'Lỗi khi lưu nhân viên');
      }
    } catch (err) {
      console.error('Lỗi submit nhân viên:', err);
      setFormError('Lỗi kết nối máy chủ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleLockConfirm = async () => {
    if (!targetStaff) return;
    try {
      setLocking(true);
      const res = await fetch(`/api/admin/users/${targetStaff._id}/toggle-status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setLockConfirmOpen(false);
        setTargetStaff(null);
        fetchStaff();
      } else {
        alert(data.message || 'Lỗi cập nhật trạng thái');
      }
    } catch (err) {
      console.error('Lỗi toggle status:', err);
    } finally {
      setLocking(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!targetDeleteStaff) return;
    try {
      setDeleting(true);
      const res = await fetch(`/api/admin/users/${targetDeleteStaff._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setDeleteConfirmOpen(false);
        setTargetDeleteStaff(null);
        fetchStaff();
      } else {
        alert(data.message || 'Lỗi khi xóa nhân viên');
      }
    } catch (err) {
      console.error('Lỗi delete staff:', err);
    } finally {
      setDeleting(false);
    }
  };

  const staffArray = Array.isArray(staffList) ? staffList : [];
  const filtered = staffArray.filter((s) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return s.name?.toLowerCase().includes(term) || s.email?.toLowerCase().includes(term);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            Quản Lý Nhân Viên & Phân Quyền (RBAC)
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Cấp quyền chi tiết cho nhân viên xưởng (STAFF) và bảo vệ an toàn quyền quản trị
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-4 py-2 bg-amber-400 hover:bg-amber-500 text-black text-xs font-bold rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Nhân Viên Mới</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <input
            type="text"
            placeholder="Tìm theo tên nhân viên, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-amber-600"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
        </div>
        <div className="text-xs text-gray-500 font-mono">
          Tổng số: <span className="font-bold text-gray-800">{staffArray.length}</span> nhân sự
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">Nhân Sự</th>
                <th className="py-3 px-4">Vai Trò (Role)</th>
                <th className="py-3 px-4">Quyền Được Cấp (Permissions)</th>
                <th className="py-3 px-4 text-center">Trạng Thái</th>
                <th className="py-3 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin text-amber-600 mx-auto mb-2" />
                    <span>Đang nạp danh sách nhân sự...</span>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">
                    Không tìm thấy nhân sự nào
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s._id} className="hover:bg-amber-50/20 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-amber-200 border border-amber-300 text-black font-bold flex items-center justify-center text-xs shrink-0">
                          {s.name ? s.name.charAt(0).toUpperCase() : 'N'}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">{s.name}</div>
                          <div className="text-[11px] text-gray-500 font-mono">{s.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {s.role === 'SUPER_ADMIN' ? (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                          👑 SUPER ADMIN
                        </span>
                      ) : s.role === 'ADMIN' ? (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-900 border border-red-300">
                          ⭐ QUẢN TRỊ VIÊN
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-900 border border-blue-300">
                          🔨 NHÂN VIÊN XƯỞNG
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 max-w-md">
                      {s.role === 'SUPER_ADMIN' || s.role === 'ADMIN' ? (
                        <span className="text-emerald-700 font-medium italic">
                          Toàn quyền quản trị hệ thống
                        </span>
                      ) : Array.isArray(s.permissions) && s.permissions.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {s.permissions.map((p) => (
                            <span
                              key={p}
                              className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 text-[10px] font-mono"
                            >
                              {p}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Chưa được cấp quyền nào</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          s.isActive !== false
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {s.isActive !== false ? 'Hoạt động' : 'Đã khóa'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {/* Only allow editing if currentUser has privilege */}
                      {s.role === 'SUPER_ADMIN' && !isSuperAdmin ? (
                        <span className="text-[11px] text-gray-400 italic">Bảo vệ</span>
                      ) : (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(s)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md"
                            title="Sửa quyền / thông tin"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {s._id !== currentUser?._id && (
                            <>
                              <button
                                onClick={() => {
                                  setTargetStaff(s);
                                  setLockConfirmOpen(true);
                                }}
                                className={`p-1.5 rounded-md ${
                                  s.isActive !== false
                                    ? 'text-rose-600 hover:bg-rose-50'
                                    : 'text-emerald-600 hover:bg-emerald-50'
                                }`}
                                title={s.isActive !== false ? 'Khóa tài khoản' : 'Mở khóa'}
                              >
                                {s.isActive !== false ? (
                                  <Lock className="w-4 h-4" />
                                ) : (
                                  <Unlock className="w-4 h-4" />
                                )}
                              </button>
                              <button
                                onClick={() => {
                                  setTargetDeleteStaff(s);
                                  setDeleteConfirmOpen(true);
                                }}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                title="Xóa tài khoản nhân viên"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit Staff */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-primary-950 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold tracking-wide">
                {modalMode === 'CREATE' ? 'Thêm Nhân Viên / Quản Trị Viên' : 'Chỉnh Sửa Quyền Hạn'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
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
                    placeholder="nhanvien@phohangma.vn"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    {modalMode === 'CREATE' ? 'Mật khẩu ban đầu' : 'Đổi mật khẩu mới (Nếu có)'}{' '}
                    {modalMode === 'CREATE' && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-600 font-mono"
                    required={modalMode === 'CREATE'}
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Chức vụ (Vai trò) <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-amber-600"
                >
                  <option value="STAFF">Thợ Cả / Nhân Viên Xưởng (STAFF)</option>
                  <option value="ADMIN">Quản Trị Viên (ADMIN)</option>
                  {isSuperAdmin && (
                    <option value="SUPER_ADMIN">Tổng Quản Trị Hệ Thống (SUPER_ADMIN)</option>
                  )}
                </select>
              </div>

              {/* Granular Permissions Checklist for STAFF */}
              {formData.role === 'STAFF' && (
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900 uppercase">
                      Danh Sách Quyền Truy Cập (Permissions)
                    </span>
                    <button
                      type="button"
                      onClick={handleSelectAllPermissions}
                      className="text-amber-800 hover:underline font-semibold"
                    >
                      {formData.permissions.length === availablePermissions.length
                        ? 'Bỏ chọn tất cả'
                        : 'Chọn tất cả'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {availablePermissions.map((perm) => {
                      const isChecked = formData.permissions.includes(perm.key);
                      return (
                        <label
                          key={perm.key}
                          className={`flex items-start gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                            isChecked
                              ? 'bg-amber-50 border-amber-300 text-amber-950 font-medium'
                              : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleTogglePermission(perm.key)}
                            className="mt-0.5 rounded text-amber-600 focus:ring-amber-500"
                          />
                          <span className="text-[11px] leading-tight">{perm.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-gray-200 flex items-center justify-end gap-3">
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
                  <span>{modalMode === 'CREATE' ? 'Thêm Nhân Viên' : 'Lưu Thay Đổi'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lock Confirm Modal */}
      <ConfirmModal
        isOpen={lockConfirmOpen}
        title={targetStaff?.isActive !== false ? 'Khóa Tài Khoản Nhân Viên' : 'Mở Khóa Tài Khoản'}
        message={`Bạn có chắc chắn muốn ${
          targetStaff?.isActive !== false ? 'khóa' : 'mở khóa'
        } tài khoản của nhân viên "${targetStaff?.name}" không?`}
        confirmColor={targetStaff?.isActive !== false ? 'red' : 'primary'}
        loading={locking}
        onConfirm={handleToggleLockConfirm}
        onCancel={() => setLockConfirmOpen(false)}
      />

      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={deleteConfirmOpen}
        title="Xóa Vĩnh Viễn Tài Khoản Nhân Sự"
        message={`Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản nhân sự "${targetDeleteStaff?.name}" (${targetDeleteStaff?.email}) khỏi cơ sở dữ liệu? Hành động này không thể hoàn tác.`}
        confirmColor="red"
        confirmText="Xác Nhận Xóa"
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirmOpen(false)}
      />
    </div>
  );
}
