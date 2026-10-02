import React, { useState, useEffect } from 'react';
import {
  Phone,
  PhoneCall,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Calendar,
  User,
  Filter,
  RefreshCw,
  Trash2,
  MessageSquare,
  Edit3,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

export default function ConsultationsTab({ token }) {
  const [consultations, setConsultations] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, called: 0, confirmed: 0, cancelled: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [adminNote, setAdminNote] = useState('');
  const [newStatus, setNewStatus] = useState('PENDING');

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/consultations/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchConsultations = async () => {
    try {
      setLoading(true);
      let url = `/api/consultations?limit=50`;
      if (statusFilter !== 'ALL') {
        url += `&status=${statusFilter}`;
      }
      if (searchQuery.trim()) {
        url += `&search=${encodeURIComponent(searchQuery.trim())}`;
      }

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setConsultations(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching consultations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchConsultations();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchConsultations();
  };

  const handleOpenDetail = (item) => {
    setSelectedItem(item);
    setAdminNote(item.adminNote || '');
    setNewStatus(item.status || 'PENDING');
  };

  const handleUpdate = async () => {
    if (!selectedItem) return;
    setUpdateLoading(true);
    try {
      const res = await fetch(`/api/consultations/${selectedItem._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: newStatus,
          adminNote: adminNote,
        }),
      });

      const data = await res.json();
      if (data.success) {
        // Cập nhật lại danh sách tại chỗ
        setConsultations((prev) =>
          prev.map((c) => (c._id === selectedItem._id ? data.data : c))
        );
        setSelectedItem(null);
        fetchStats();
      } else {
        alert(data.message || 'Cập nhật thất bại');
      }
    } catch (err) {
      alert('Lỗi cập nhật: ' + err.message);
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Quý vị có chắc chắn muốn xóa yêu cầu tư vấn này?')) return;
    try {
      const res = await fetch(`/api/consultations/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setConsultations((prev) => prev.filter((c) => c._id !== id));
        fetchStats();
      } else {
        alert(data.message || 'Không thể xóa');
      }
    } catch (err) {
      alert('Lỗi xóa: ' + err.message);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
            <Clock size={12} />
            Chờ Gọi Tư Vấn
          </span>
        );
      case 'CALLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
            <PhoneCall size={12} />
            Đã Gọi Tư Vấn
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 size={12} />
            Đã Chốt Đàn Lễ
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-300">
            <XCircle size={12} />
            Không Nghe / Hủy
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Thống kê */}
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <PhoneCall className="text-[#8B1E21]" />
              <span>Khách Để Lại Thông Tin Tư Vấn</span>
            </h2>
            <p className="text-xs text-gray-600 mt-0.5">
              Danh sách khách hàng đăng ký nhận tư vấn từ website cần thợ cả gọi điện hỗ trợ
            </p>
          </div>
          <button
            onClick={() => {
              fetchStats();
              fetchConsultations();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-50 shadow-sm"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Làm Mới</span>
          </button>
        </div>

        {/* 4 Cards Thống kê */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            onClick={() => setStatusFilter('ALL')}
            className={`p-4 rounded-xl border bg-white cursor-pointer transition-all ${
              statusFilter === 'ALL' ? 'border-[#8B1E21] shadow-md ring-2 ring-[#8B1E21]/20' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-xs font-medium text-gray-500 uppercase">Tất Cả Yêu Cầu</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</div>
            <div className="text-[11px] text-gray-400 mt-1">Từ các form website</div>
          </div>

          <div
            onClick={() => setStatusFilter('PENDING')}
            className={`p-4 rounded-xl border bg-white cursor-pointer transition-all ${
              statusFilter === 'PENDING' ? 'border-amber-500 shadow-md ring-2 ring-amber-500/20' : 'border-gray-200 hover:border-amber-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-700 uppercase">Cần Gọi Ngay</span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
            </div>
            <div className="text-2xl font-bold text-amber-600 mt-1">{stats.pending}</div>
            <div className="text-[11px] text-amber-600/80 mt-1">Đang chờ liên hệ</div>
          </div>

          <div
            onClick={() => setStatusFilter('CALLED')}
            className={`p-4 rounded-xl border bg-white cursor-pointer transition-all ${
              statusFilter === 'CALLED' ? 'border-blue-500 shadow-md ring-2 ring-blue-500/20' : 'border-gray-200 hover:border-blue-300'
            }`}
          >
            <div className="text-xs font-medium text-blue-700 uppercase">Đã Gọi Tư Vấn</div>
            <div className="text-2xl font-bold text-blue-600 mt-1">{stats.called}</div>
            <div className="text-[11px] text-gray-400 mt-1">Đang theo sát trao đổi</div>
          </div>

          <div
            onClick={() => setStatusFilter('CONFIRMED')}
            className={`p-4 rounded-xl border bg-white cursor-pointer transition-all ${
              statusFilter === 'CONFIRMED' ? 'border-emerald-500 shadow-md ring-2 ring-emerald-500/20' : 'border-gray-200 hover:border-emerald-300'
            }`}
          >
            <div className="text-xs font-medium text-emerald-700 uppercase">Đã Chốt Đàn Lễ</div>
            <div className="text-2xl font-bold text-emerald-600 mt-1">{stats.confirmed}</div>
            <div className="text-[11px] text-emerald-600/80 mt-1">Thành công lên đơn</div>
          </div>
        </div>
      </div>

      {/* Bộ Lọc & Tìm Kiếm */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-3">
        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <span className="text-xs font-medium text-gray-500 mr-1 flex items-center gap-1">
            <Filter size={14} /> Lọc:
          </span>
          {[
            { id: 'ALL', label: 'Tất cả' },
            { id: 'PENDING', label: 'Chờ gọi' },
            { id: 'CALLED', label: 'Đã gọi' },
            { id: 'CONFIRMED', label: 'Đã chốt' },
            { id: 'CANCELLED', label: 'Hủy/KNL' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === tab.id
                  ? 'bg-[#8B1E21] text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search input */}
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
          <Search size={15} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên, SĐT, loại lễ..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#8B1E21] focus:bg-white"
          />
        </form>
      </div>

      {/* Danh Sách Khách Hàng Chờ Tư Vấn */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500 text-xs">
            <div className="w-8 h-8 border-2 border-[#8B1E21] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Đang tải dữ liệu yêu cầu tư vấn...
          </div>
        ) : consultations.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <PhoneCall className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <div className="text-sm font-bold text-gray-800">Chưa có yêu cầu tư vấn nào</div>
            <div className="text-xs text-gray-500 mt-1">
              Khi khách hàng gửi form trên trang chủ hoặc popup, thông tin sẽ xuất hiện ngay tại đây.
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-stone-50 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Thời gian</th>
                  <th className="py-3 px-4">Khách Hàng & Số ĐT</th>
                  <th className="py-3 px-4">Khóa Lễ & Dự Trù</th>
                  <th className="py-3 px-4">Giờ Tiện Nghe Máy</th>
                  <th className="py-3 px-4">Ghi Chú Khách</th>
                  <th className="py-3 px-4">Trạng Thái</th>
                  <th className="py-3 px-4">Xử Lý / Ghi Chú</th>
                  <th className="py-3 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {consultations.map((item) => {
                  const dateStr = new Date(item.createdAt).toLocaleString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  });

                  return (
                    <tr
                      key={item._id}
                      onClick={() => handleOpenDetail(item)}
                      className="hover:bg-amber-50/50 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-4 text-gray-500 whitespace-nowrap">
                        <div className="font-mono text-[11px]">{dateStr}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">
                          {item.source === 'QUICK_MODAL_WIDGET' ? 'Popup Nhanh' : 'Form Trang Chủ'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-gray-900 text-sm">{item.fullName}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <a
                            href={`tel:${item.phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-[#8B1E21] font-mono font-bold hover:underline"
                            title="Bấm để gọi trực tiếp"
                          >
                            <Phone size={12} />
                            {item.phone}
                          </a>
                        </div>
                        {item.address && (
                          <div className="text-[11px] text-gray-500 truncate max-w-[160px]">
                            {item.address}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-gray-900">{item.ritualType}</div>
                        {item.budget && (
                          <div className="text-[11px] text-amber-700 bg-amber-50 inline-block px-1.5 py-0.5 rounded mt-0.5">
                            {item.budget}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1 text-gray-600">
                          <Clock size={12} className="text-gray-400" />
                          <span>{item.preferredCallTime || 'Càng sớm càng tốt'}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 max-w-[180px]">
                        <p className="text-gray-600 line-clamp-2 italic text-[11px]">
                          {item.note || '— Không có ghi chú —'}
                        </p>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getStatusBadge(item.status)}
                      </td>

                      <td className="py-3.5 px-4 max-w-[160px]">
                        {item.adminNote ? (
                          <div>
                            <span className="text-emerald-700 font-medium text-[11px] line-clamp-2">
                              {item.adminNote}
                            </span>
                            {item.handledBy && (
                              <span className="text-[10px] text-gray-400 block mt-0.5">
                                NV: {item.handledBy.name}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-[11px] italic">Chưa có ghi chú</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDetail(item);
                            }}
                            className="p-1.5 bg-[#8B1E21]/10 text-[#8B1E21] hover:bg-[#8B1E21] hover:text-white rounded transition-colors"
                            title="Xử lý cuộc gọi"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={(e) => handleDelete(item._id, e)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Xóa yêu cầu"
                          >
                            <Trash2 size={14} />
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

      {/* Modal Chi Tiết & Cập Nhật Cuộc Gọi */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-[#8B1E21] text-white p-4 sm:p-5 flex items-center justify-between">
              <div>
                <h3 className="font-serif text-lg font-bold text-amber-200 flex items-center gap-2">
                  <PhoneCall size={18} />
                  <span>Xử Lý Cuộc Gọi Tư Vấn</span>
                </h3>
                <p className="text-xs text-amber-100/80 mt-0.5">
                  Khách: <strong>{selectedItem.fullName}</strong> — SĐT:{' '}
                  <strong>{selectedItem.phone}</strong>
                </p>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs text-gray-700">
              {/* Box bấm gọi ngay */}
              <div className="p-3.5 bg-amber-50 rounded-lg border border-amber-200 flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-amber-800 font-semibold uppercase">Số điện thoại liên hệ:</div>
                  <div className="text-lg font-mono font-bold text-[#8B1E21]">{selectedItem.phone}</div>
                </div>
                <a
                  href={`tel:${selectedItem.phone}`}
                  className="px-4 py-2 bg-[#8B1E21] hover:bg-[#A32427] text-white font-bold rounded-lg flex items-center gap-1.5 shadow transition-colors"
                >
                  <Phone size={14} />
                  <span>Bấm Gọi Ngay</span>
                </a>
              </div>

              {/* Thông tin chi tiết khách gửi */}
              <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3.5 rounded-lg border border-gray-200">
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Khóa lễ cần tư vấn</span>
                  <span className="font-semibold text-gray-900">{selectedItem.ritualType}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Khoảng ngân sách</span>
                  <span className="font-semibold text-amber-800">{selectedItem.budget || 'Chưa chọn'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Giờ tiện nghe máy</span>
                  <span className="font-medium text-gray-800">{selectedItem.preferredCallTime || 'Càng sớm càng tốt'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Địa chỉ / Tỉnh thành</span>
                  <span className="font-medium text-gray-800">{selectedItem.address || 'Chưa cung cấp'}</span>
                </div>
              </div>

              {/* Ghi chú của khách */}
              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                  Ghi chú hoặc tâm nguyện của gia chủ:
                </label>
                <div className="p-3 bg-stone-50 rounded border border-gray-200 text-gray-800 italic">
                  {selectedItem.note || '— Khách không để lại ghi chú thêm —'}
                </div>
              </div>

              {/* Cập nhật trạng thái */}
              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1.5">
                  Trạng thái cuộc gọi tư vấn <span className="text-red-500">*</span>
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded font-semibold text-gray-800 focus:outline-none focus:border-[#8B1E21]"
                >
                  <option value="PENDING">Chờ Gọi Tư Vấn (Chưa liên hệ)</option>
                  <option value="CALLED">Đã Gọi Tư Vấn (Đang tư vấn / Khách hẹn gọi lại)</option>
                  <option value="CONFIRMED">Đã Chốt Đàn Lễ (Chuyển sang lên đơn hàng)</option>
                  <option value="CANCELLED">Hủy / Không Nghe Máy / Sai Số</option>
                </select>
              </div>

              {/* Ghi chú kết quả tư vấn nội bộ */}
              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1.5">
                  Ghi chú kết quả sau khi gọi (Dành cho thợ cả / nhân viên):
                </label>
                <textarea
                  rows="3"
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Ví dụ: Đã gọi lúc 14h, khách cần đàn Tứ Phủ trọn gói về đền Mẫu Đầm Đa vào ngày 18/8 âm lịch. Đã báo giá 12.5 triệu, khách đã đồng ý..."
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-[#8B1E21]"
                ></textarea>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 border border-gray-300 rounded text-xs font-semibold text-gray-700 hover:bg-gray-100"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleUpdate}
                disabled={updateLoading}
                className="px-5 py-2 bg-[#8B1E21] hover:bg-[#A32427] text-white rounded text-xs font-bold shadow flex items-center gap-1.5 disabled:opacity-50"
              >
                {updateLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} />
                    <span>Lưu Kết Quả Tư Vấn</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
