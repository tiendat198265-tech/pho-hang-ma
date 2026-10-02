import React, { useState, useEffect } from 'react';
import {
  Boxes,
  ArrowUpRight,
  ArrowDownRight,
  RotateCcw,
  Search,
  Filter,
  History,
  Plus,
  Minus,
  Sliders,
  AlertTriangle,
  Loader2,
  Calendar,
} from 'lucide-react';
import { formatVND } from '../../../utils/exportUtils';

export default function InventoryTab({ token }) {
  const [stockSummary, setStockSummary] = useState([]);
  const [logs, setLogs] = useState([]);
  const [activeSubTab, setActiveSubTab] = useState('OVERVIEW'); // 'OVERVIEW' | 'LOGS'
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [logTypeFilter, setLogTypeFilter] = useState('');

  // Stock Action Modal (IN / OUT / ADJUST)
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState('IN'); // 'IN' | 'OUT' | 'ADJUST'
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [actionQuantity, setActionQuantity] = useState(1);
  const [actionReason, setActionReason] = useState('');
  const [actionRefCode, setActionRefCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch Inventory Summary
  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/inventory/summary', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setStockSummary(data.data);
      }
    } catch (err) {
      console.error('Lỗi tải tồn kho:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Inventory Logs
  const fetchLogs = async () => {
    try {
      setLoading(true);
      let url = '/api/admin/inventory/logs?limit=50';
      if (logTypeFilter) url += `&changeType=${logTypeFilter}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setLogs(data.data);
      }
    } catch (err) {
      console.error('Lỗi tải lịch sử kho:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'OVERVIEW') {
      fetchInventory();
    } else {
      fetchLogs();
    }
  }, [activeSubTab, logTypeFilter]);

  const handleOpenAction = (product, type) => {
    setSelectedProduct(product);
    setActionType(type);
    setActionQuantity(1);
    setActionReason('');
    setActionRefCode('');
    setIsActionModalOpen(true);
  };

  const handleStockActionSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;

    try {
      setSubmitting(true);
      const res = await fetch('/api/admin/inventory/adjust', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: selectedProduct._id,
          changeType: actionType,
          quantity: Number(actionQuantity),
          reason: actionReason,
          referenceCode: actionRefCode,
        }),
      });
      const result = await res.json();
      if (result.success) {
        setIsActionModalOpen(false);
        fetchInventory();
        alert('Cập nhật kho hàng thành công!');
      } else {
        alert(result.message || 'Lỗi cập nhật kho');
      }
    } catch (err) {
      console.error('Lỗi submit kho:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Low stock calculation
  const totalStockItems = stockSummary.reduce((acc, p) => acc + (p.stockQuantity || 0), 0);
  const lowStockCount = stockSummary.filter((p) => (p.stockQuantity || 0) <= 5).length;
  const outOfStockCount = stockSummary.filter((p) => (p.stockQuantity || 0) === 0).length;

  const filteredProducts = stockSummary.filter((p) => {
    const matchSearch =
      !search ||
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase());
    const matchLow = !lowStockFilter || (p.stockQuantity || 0) <= 5;
    return matchSearch && matchLow;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Quản Lý Tồn Kho & Lịch Sử Xuất Nhập</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Ghi nhận chi tiết mọi biến động nhập hàng, xuất giao lễ hoặc điều chỉnh định kỳ
          </p>
        </div>

        {/* Sub-tab pills */}
        <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveSubTab('OVERVIEW')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeSubTab === 'OVERVIEW'
                ? 'bg-amber-400 text-black shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Tồn Kho Hiện Tại
          </button>
          <button
            onClick={() => setActiveSubTab('LOGS')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeSubTab === 'LOGS'
                ? 'bg-amber-400 text-black shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Lịch Sử Biến Động (Logs)
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase">Tổng Tồn Kho Xưởng</div>
            <div className="text-2xl font-black text-gray-900 mt-1">
              {totalStockItems} <span className="text-sm font-normal text-gray-500">món</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Boxes className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase">Sắp Hết Nan/Giấy (≤ 5)</div>
            <div className="text-2xl font-black text-amber-600 mt-1">
              {lowStockCount} <span className="text-sm font-normal text-gray-500">mặt hàng</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase">Hết Hàng Trong Kho (0)</div>
            <div className="text-2xl font-black text-rose-600 mt-1">
              {outOfStockCount} <span className="text-sm font-normal text-gray-500">mặt hàng</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
            <RotateCcw className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* OVERVIEW SUBTAB */}
      {activeSubTab === 'OVERVIEW' && (
        <div className="space-y-4">
          {/* Search & Warning Filter */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Tìm mặt hàng, mã SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-amber-600"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            </div>

            <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={lowStockFilter}
                onChange={(e) => setLowStockFilter(e.target.checked)}
                className="rounded text-amber-600 focus:ring-amber-500"
              />
              <span>Chỉ hiện sản phẩm sắp hết (≤ 5)</span>
            </label>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4">Sản Phẩm</th>
                    <th className="py-3 px-4">Mã SKU</th>
                    <th className="py-3 px-4">Danh Mục</th>
                    <th className="py-3 px-4 text-right">Đơn Giá</th>
                    <th className="py-3 px-4 text-center">Tồn Kho</th>
                    <th className="py-3 px-4 text-center">Tình Trạng</th>
                    <th className="py-3 px-4 text-right">Thao Tác Kho</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-400">
                        <Loader2 className="w-6 h-6 animate-spin text-amber-600 mx-auto mb-2" />
                        <span>Đang nạp tồn kho xưởng...</span>
                      </td>
                    </tr>
                  ) : filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-400">
                        Không có sản phẩm nào
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((p) => {
                      const stock = p.stockQuantity || 0;
                      return (
                        <tr key={p._id} className="hover:bg-amber-50/20 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={p.thumbnail || 'https://via.placeholder.com/60'}
                                alt={p.name}
                                className="w-10 h-10 rounded-lg object-cover border border-gray-200 shrink-0"
                              />
                              <div>
                                <div className="font-bold text-gray-900">{p.name}</div>
                                <div className="text-[11px] text-gray-500 font-mono">
                                  ĐVT: {p.unit || 'chiếc'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono font-medium text-gray-600">
                            {p.sku || '-'}
                          </td>
                          <td className="py-3 px-4 text-gray-600">{p.category?.name || '-'}</td>
                          <td className="py-3 px-4 text-right font-bold text-gray-900 font-mono">
                            {formatVND(p.price)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="text-sm font-black font-mono text-gray-900">
                              {stock}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {stock === 0 ? (
                              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                Hết hàng
                              </span>
                            ) : stock <= 5 ? (
                              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                Cảnh báo tồn
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Sẵn sàng
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenAction(p, 'IN')}
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-md flex items-center gap-1 shadow-2xs"
                                title="Nhập kho"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Nhập</span>
                              </button>
                              <button
                                onClick={() => handleOpenAction(p, 'OUT')}
                                className="px-2 py-1 bg-amber-700 hover:bg-amber-800 text-white font-semibold rounded-md flex items-center gap-1 shadow-2xs"
                                title="Xuất kho"
                              >
                                <Minus className="w-3 h-3" />
                                <span>Xuất</span>
                              </button>
                              <button
                                onClick={() => handleOpenAction(p, 'ADJUST')}
                                className="px-2 py-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-md flex items-center gap-1 shadow-2xs"
                                title="Điều chỉnh kiểm kê"
                              >
                                <Sliders className="w-3 h-3" />
                                <span>Chỉnh</span>
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
        </div>
      )}

      {/* LOGS SUBTAB */}
      {activeSubTab === 'LOGS' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-700">Loại biến động:</span>
              <select
                value={logTypeFilter}
                onChange={(e) => setLogTypeFilter(e.target.value)}
                className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-amber-600"
              >
                <option value="">Tất cả (Nhập, Xuất, Điều chỉnh)</option>
                <option value="IN">Nhập kho (+)</option>
                <option value="OUT">Xuất kho (-)</option>
                <option value="ADJUST">Điều chỉnh (Kiểm kê)</option>
              </select>
            </div>
            <div className="text-xs text-gray-500 font-mono">
              Hiển thị: <span className="font-bold text-gray-800">{logs.length}</span> bản ghi gần nhất
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4">Thời Gian</th>
                    <th className="py-3 px-4">Sản Phẩm</th>
                    <th className="py-3 px-4 text-center">Hành Động</th>
                    <th className="py-3 px-4 text-center">Biến Động</th>
                    <th className="py-3 px-4 text-center">Tồn Trước → Sau</th>
                    <th className="py-3 px-4">Lý Do / Mã Chứng Từ</th>
                    <th className="py-3 px-4">Người Thực Hiện</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-400">
                        <Loader2 className="w-6 h-6 animate-spin text-amber-600 mx-auto mb-2" />
                        <span>Đang tải nhật ký kho...</span>
                      </td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-400">
                        Chưa có lịch sử biến động kho
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log._id} className="hover:bg-amber-50/20 transition-colors">
                        <td className="py-3 px-4 text-gray-500 font-mono">
                          {new Date(log.createdAt).toLocaleString('vi-VN')}
                        </td>
                        <td className="py-3 px-4 font-bold text-gray-900">{log.productName}</td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                              log.changeType === 'IN'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : log.changeType === 'OUT'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}
                          >
                            {log.changeType === 'IN'
                              ? 'Nhập kho'
                              : log.changeType === 'OUT'
                              ? 'Xuất kho'
                              : 'Điều chỉnh'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-bold font-mono">
                          {log.changeType === 'IN' && (
                            <span className="text-emerald-700">+{log.quantity}</span>
                          )}
                          {log.changeType === 'OUT' && (
                            <span className="text-rose-700">-{log.quantity}</span>
                          )}
                          {log.changeType === 'ADJUST' && (
                            <span className="text-blue-700">={log.quantity}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-gray-600">
                          {log.previousStock} → <strong className="text-gray-900">{log.newStock}</strong>
                        </td>
                        <td className="py-3 px-4 text-gray-700">
                          <div>{log.reason || 'Không có lý do ghi chú'}</div>
                          {log.referenceCode && (
                            <div className="text-[10px] text-gray-400 font-mono">
                              Mã: {log.referenceCode}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {log.createdBy?.name || 'Quản trị viên'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Stock IN / OUT / ADJUST Modal */}
      {isActionModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-primary-950 text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold">
                  {actionType === 'IN'
                    ? 'Nhập Thêm Tồn Kho'
                    : actionType === 'OUT'
                    ? 'Xuất Giảm Tồn Kho'
                    : 'Điều Chỉnh Tồn Kho Thực Tế'}
                </h3>
                <p className="text-[11px] text-gray-300">{selectedProduct.name}</p>
              </div>
              <button
                onClick={() => setIsActionModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleStockActionSubmit} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 flex items-center justify-between">
                <span className="text-gray-600">Tồn kho hiện tại:</span>
                <span className="text-base font-bold font-mono text-gray-900">
                  {selectedProduct.stockQuantity} {selectedProduct.unit || 'chiếc'}
                </span>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  {actionType === 'ADJUST'
                    ? 'Số lượng tồn kho thực tế sau khi đếm:'
                    : 'Số lượng thay đổi:'}{' '}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={actionType === 'ADJUST' ? '0' : '1'}
                  value={actionQuantity}
                  onChange={(e) => setActionQuantity(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono font-bold focus:outline-none focus:border-amber-600 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Lý do xuất nhập <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder={
                    actionType === 'IN'
                      ? 'Nghệ nhân vừa hoàn thành mẻ nan giang mới...'
                      : actionType === 'OUT'
                      ? 'Xuất giao bản đền gấp hoặc hao hụt vận chuyển...'
                      : 'Kiểm kê định kỳ cuối tháng...'
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-600"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Mã tham chiếu / Số phiếu kho (Tùy chọn)
                </label>
                <input
                  type="text"
                  value={actionRefCode}
                  onChange={(e) => setActionRefCode(e.target.value)}
                  placeholder="NK-2026-001 hoặc DH-102"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono focus:outline-none focus:border-amber-600"
                />
              </div>

              <div className="pt-3 border-t border-gray-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsActionModalOpen(false)}
                  className="px-4 py-2 font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 font-bold text-black bg-amber-400 hover:bg-amber-500 rounded-lg shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Xác Nhận Cập Nhật</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
