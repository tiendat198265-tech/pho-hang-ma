import React, { useState, useEffect } from 'react';
import { History, Search, Filter, Loader2, ShieldAlert, ArrowRight, UserCheck, Key, User } from 'lucide-react';

export default function AuditLogsTab({ token }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      let url = '/api/admin/audit-logs?limit=100';
      if (entityFilter) url += `&entity=${entityFilter}`;
      if (actionFilter) url += `&action=${actionFilter}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setLogs(data.data || data.logs || []);
      }
    } catch (err) {
      console.error('Lỗi tải nhật ký kiểm toán:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [entityFilter, actionFilter]);

  const filtered = logs.filter((log) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      log.userName?.toLowerCase().includes(term) ||
      log.action?.toLowerCase().includes(term) ||
      log.details?.toLowerCase().includes(term) ||
      log.entity?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <History className="w-5 h-5 text-[#8B1E21]" />
            <span>Nhật Ký Hoạt Động & Kiểm Toán (Audit Log)</span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Lưu vết tự động mọi thao tác: Đổi tên tài khoản, đổi mật khẩu, quản lý đơn hàng và cấu hình hệ thống
          </p>
        </div>
        <div className="text-xs text-gray-500 font-mono">
          Bản ghi: <span className="font-bold text-gray-800">{logs.length}</span> lượt gần nhất
        </div>
      </div>

      {/* Filter and Quick Chips */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <input
              type="text"
              placeholder="Tìm theo người thực hiện, tên cũ, tên mới, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-amber-600"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="px-3 py-2 text-xs border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-amber-600"
            >
              <option value="">Tất cả phân hệ (Entity)</option>
              <option value="USER">Người dùng (USER)</option>
              <option value="Product">Sản phẩm (Product)</option>
              <option value="Order">Đơn hàng (Order)</option>
              <option value="CustomOrder">Đơn đặt theo mẫu</option>
              <option value="Category">Danh mục (Category)</option>
              <option value="Inventory">Kho hàng (Inventory)</option>
              <option value="Coupon">Mã giảm giá (Coupon)</option>
              <option value="Review">Đánh giá (Review)</option>
              <option value="Setting">Cài đặt hệ thống</option>
            </select>
          </div>
        </div>

        {/* Quick Filter Buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-gray-100 text-xs">
          <span className="text-gray-500 font-medium">Lọc nhanh:</span>
          <button
            type="button"
            onClick={() => {
              setActionFilter('');
              setEntityFilter('');
            }}
            className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
              !actionFilter && !entityFilter
                ? 'bg-gray-800 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            Tất cả hoạt động
          </button>
          <button
            type="button"
            onClick={() => {
              setActionFilter('CHANGE_NAME');
              setEntityFilter('USER');
            }}
            className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors flex items-center gap-1 ${
              actionFilter === 'CHANGE_NAME'
                ? 'bg-purple-700 text-white'
                : 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100'
            }`}
          >
            <UserCheck size={13} />
            <span>🔄 Ai Đã Đổi Tên (CHANGE_NAME)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActionFilter('CHANGE_PASSWORD');
              setEntityFilter('USER');
            }}
            className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors flex items-center gap-1 ${
              actionFilter === 'CHANGE_PASSWORD'
                ? 'bg-cyan-700 text-white'
                : 'bg-cyan-50 text-cyan-700 border border-cyan-200 hover:bg-cyan-100'
            }`}
          >
            <Key size={13} />
            <span>🔑 Đổi Mật Khẩu</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">Thời Gian</th>
                <th className="py-3 px-4">Người Thực Hiện</th>
                <th className="py-3 px-4 text-center">Hành Động</th>
                <th className="py-3 px-4">Đối Tượng (Entity)</th>
                <th className="py-3 px-4">Chi Tiết Thao Tác</th>
                <th className="py-3 px-4 text-right">Địa Chỉ IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin text-amber-600 mx-auto mb-2" />
                    <span>Đang nạp nhật ký kiểm toán...</span>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400">
                    Chưa có nhật ký hoạt động nào phù hợp với bộ lọc
                  </td>
                </tr>
              ) : (
                filtered.map((log) => (
                  <tr key={log._id} className="hover:bg-amber-50/20 transition-colors">
                    <td className="py-3 px-4 text-gray-500 font-mono whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('vi-VN')}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-gray-900">{log.userName}</div>
                      <div className="text-[10px] text-gray-400 font-mono">
                        {log.userRole || 'Hệ thống'}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {log.action === 'CHANGE_NAME' ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-300 shadow-xs inline-flex items-center gap-1">
                          <UserCheck size={11} />
                          <span>ĐỔI HỌ TÊN</span>
                        </span>
                      ) : log.action === 'CHANGE_PASSWORD' ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-cyan-100 text-cyan-800 border border-cyan-300 inline-flex items-center gap-1">
                          <Key size={11} />
                          <span>ĐỔI MẬT KHẨU</span>
                        </span>
                      ) : (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            log.action?.includes('CREATE')
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : log.action?.includes('DELETE')
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : log.action?.includes('STATUS')
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {log.action}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-800 whitespace-nowrap">
                      {log.entity}
                      {log.entityId && (
                        <div className="text-[10px] text-gray-400 font-mono truncate max-w-[120px]">
                          ID: {log.entityId}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-700 max-w-[340px]">
                      {log.action === 'CHANGE_NAME' && log.metadata?.oldName ? (
                        <div className="leading-snug">
                          <div className="font-semibold text-purple-900">
                            Đã đổi họ tên tài khoản:
                          </div>
                          <div className="text-[11px] mt-0.5 text-gray-600">
                            Cũ: <span className="line-through text-rose-600 font-medium">{log.metadata.oldName}</span> ➔ Mới:{' '}
                            <strong className="text-emerald-700">{log.metadata.newName}</strong>
                          </div>
                          <div className="text-[10px] text-gray-400 mt-0.5">Email: {log.metadata.email}</div>
                        </div>
                      ) : (
                        <div className="line-clamp-2 leading-relaxed">{log.details}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-gray-500 whitespace-nowrap">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
