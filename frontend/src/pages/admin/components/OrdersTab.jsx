import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Eye,
  CheckCircle2,
  Clock,
  Truck,
  Package,
  XCircle,
  Loader2,
  Printer,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { formatVND } from '../../../utils/exportUtils';
import { getStatusText } from '../../../utils/statusTranslations';

export default function OrdersTab({ token }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);

  // Detail Modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [updatePaymentStatus, setUpdatePaymentStatus] = useState('');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page,
        limit,
      });
      if (search) params.append('search', search);
      if (statusFilter) params.append('orderStatus', statusFilter);
      if (paymentFilter) params.append('paymentStatus', paymentFilter);

      const res = await fetch(`/api/orders?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        const list = Array.isArray(data.data) ? data.data : (data.data?.orders || []);
        setOrders(list);
        setTotalPages(data.pagination?.totalPages || data.data?.pagination?.pages || 1);
        setTotalOrders(data.pagination?.total || data.data?.pagination?.total || list.length);
      }
    } catch (err) {
      console.error('Lỗi tải đơn hàng:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, limit, statusFilter, paymentFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchOrders();
  };

  const handleOpenDetail = (order) => {
    setSelectedOrder(order);
    setNewStatus(order.orderStatus);
    setUpdatePaymentStatus(order.paymentStatus);
    setStatusNote('');
    setCancelReason('');
    setIsDetailOpen(true);
  };

  const handleUpdateOrderStatus = async () => {
    if (!selectedOrder) return;
    try {
      setUpdatingStatus(true);
      const res = await fetch(`/api/orders/${selectedOrder._id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderStatus: newStatus,
          paymentStatus: updatePaymentStatus,
          note: statusNote,
          cancelReason: newStatus === 'CANCELLED' ? cancelReason : '',
        }),
      });
      const result = await res.json();
      if (result.success) {
        setSelectedOrder(result.data);
        fetchOrders();
        alert('Cập nhật trạng thái đơn hàng thành công!');
      } else {
        alert(result.message || 'Lỗi khi cập nhật trạng thái');
      }
    } catch (err) {
      console.error('Lỗi cập nhật đơn:', err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Helper for timeline stepper
  const orderSteps = [
    { key: 'PENDING', label: 'Chờ Tiếp Nhận', icon: Clock },
    { key: 'CONFIRMED', label: 'Đã Xác Nhận', icon: CheckCircle2 },
    { key: 'PROCESSING', label: 'Xưởng Chế Tác', icon: Package },
    { key: 'SHIPPING', label: 'Đang Giao Hàng', icon: Truck },
    { key: 'DELIVERED', label: 'Đã Hoàn Thành', icon: CheckCircle2 },
  ];

  const getStepIndex = (status) => {
    return orderSteps.findIndex((s) => s.key === status);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Đơn Hàng</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Theo dõi tiến trình từ xác nhận, chế tác, bọc xe chuyên biệt đến khi giao tận nơi
          </p>
        </div>
        <div className="text-xs text-gray-500 font-mono">
          Tổng cộng: <span className="font-bold text-gray-800">{totalOrders}</span> đơn hàng
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Tìm theo mã đơn, người nhận, số điện thoại..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-amber-600"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-amber-600"
          >
            <option value="">Tất cả trạng thái đơn</option>
            <option value="PENDING">Chờ tiếp nhận</option>
            <option value="CONFIRMED">Đã xác nhận</option>
            <option value="PROCESSING">Đang chế tác/bọc xe</option>
            <option value="SHIPPING">Đang vận chuyển</option>
            <option value="DELIVERED">Đã hoàn thành</option>
            <option value="CANCELLED">Đã hủy</option>
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => {
              setPaymentFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-amber-600"
          >
            <option value="">Tất cả thanh toán</option>
            <option value="PENDING">Chờ thanh toán</option>
            <option value="PAID">Đã thanh toán</option>
            <option value="REFUNDED">Đã hoàn tiền</option>
          </select>

          <button
            type="submit"
            className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Tìm Kiếm
          </button>
        </form>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">Mã Đơn</th>
                <th className="py-3 px-4">Ngày Đặt</th>
                <th className="py-3 px-4">Người Nhận / Địa Chỉ</th>
                <th className="py-3 px-4">Sản Phẩm Đặt</th>
                <th className="py-3 px-4 text-right">Tổng Tiền</th>
                <th className="py-3 px-4 text-center">Thanh Toán</th>
                <th className="py-3 px-4 text-center">Trạng Thái</th>
                <th className="py-3 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin text-amber-600 mx-auto mb-2" />
                    <span>Đang nạp danh sách đơn hàng...</span>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    Không tìm thấy đơn hàng nào
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o._id} className="hover:bg-amber-50/20 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-gray-900">
                      {o.orderCode}
                    </td>
                    <td className="py-3 px-4 text-gray-500 font-mono">
                      {new Date(o.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-gray-800">
                        {o.shippingAddress?.fullName}
                      </div>
                      <div className="text-[11px] text-gray-500">{o.shippingAddress?.phone}</div>
                      <div className="text-[11px] text-gray-400 truncate max-w-xs">
                        {o.shippingAddress?.address}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-700">
                      <div className="line-clamp-2">
                        {o.items?.map((it) => `${it.productName} (x${it.quantity})`).join(', ')}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-gray-900 font-mono">
                      {formatVND(o.totalAmount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          o.paymentStatus === 'PAID'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : o.paymentStatus === 'REFUNDED'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {o.paymentStatus === 'PAID'
                          ? 'Đã TT'
                          : o.paymentStatus === 'REFUNDED'
                          ? 'Hoàn tiền'
                          : 'Chờ TT'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          o.orderStatus === 'DELIVERED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : o.orderStatus === 'CANCELLED'
                            ? 'bg-rose-100 text-rose-800'
                            : o.orderStatus === 'SHIPPING'
                            ? 'bg-purple-100 text-purple-800'
                            : o.orderStatus === 'PROCESSING'
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {getStatusText(o.orderStatus)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleOpenDetail(o)}
                        className="px-2.5 py-1 bg-amber-400 hover:bg-amber-500 text-black font-semibold rounded-md transition-colors flex items-center gap-1 ml-auto"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Chi Tiết</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <div>
            Hiển thị trang <span className="font-semibold text-gray-800">{page}</span> /{' '}
            <span className="font-semibold text-gray-800">{totalPages}</span> (Tổng {totalOrders} đơn)
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-gray-700 px-2">{page}</span>
            <button
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Detail & Status Progression Modal */}
      {isDetailOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-primary-950 text-white">
              <div className="flex items-center gap-3">
                <span className="text-xl">🏮</span>
                <div>
                  <h3 className="text-sm font-bold tracking-wide">
                    ĐƠN HÀNG: {selectedOrder.orderCode}
                  </h3>
                  <div className="text-[11px] text-gray-300 font-mono">
                    Ngày đặt: {new Date(selectedOrder.createdAt).toLocaleString('vi-VN')}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsDetailOpen(false)}
                className="text-gray-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
              {/* Stepper Progress Bar */}
              {selectedOrder.orderStatus !== 'CANCELLED' ? (
                <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl">
                  <div className="flex items-center justify-between relative">
                    <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-0.5 bg-gray-200 -z-0" />
                    {orderSteps.map((step, idx) => {
                      const Icon = step.icon;
                      const currentIdx = getStepIndex(selectedOrder.orderStatus);
                      const isCompleted = idx <= currentIdx;
                      const isCurrent = idx === currentIdx;

                      return (
                        <div
                          key={step.key}
                          className="flex flex-col items-center gap-1.5 z-10 bg-amber-50 px-2"
                        >
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                              isCompleted
                                ? 'bg-amber-400 text-black shadow-sm'
                                : 'bg-gray-200 text-gray-400'
                            } ${isCurrent ? 'ring-2 ring-amber-500 ring-offset-2' : ''}`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <span
                            className={`text-[11px] font-semibold whitespace-nowrap ${
                              isCompleted ? 'text-primary-950' : 'text-gray-400'
                            }`}
                          >
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-800">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <div>
                    <div className="font-bold">Đơn hàng này đã bị hủy</div>
                    <div className="text-[11px] text-rose-600">
                      Lý do: {selectedOrder.cancelReason || 'Không có ghi chú lý do'}
                    </div>
                  </div>
                </div>
              )}

              {/* Customer & Shipping info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-2">
                  <div className="font-bold text-gray-900 uppercase tracking-wide border-b border-gray-200 pb-1.5">
                    Thông Tin Người Nhận
                  </div>
                  <div>
                    <span className="text-gray-500">Họ và tên:</span>{' '}
                    <span className="font-semibold text-gray-800">
                      {selectedOrder.shippingAddress?.fullName}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Số điện thoại:</span>{' '}
                    <span className="font-mono font-semibold text-gray-800">
                      {selectedOrder.shippingAddress?.phone}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Địa chỉ giao:</span>{' '}
                    <span className="text-gray-800">
                      {selectedOrder.shippingAddress?.address}, {selectedOrder.shippingAddress?.city}
                    </span>
                  </div>
                  {selectedOrder.shippingAddress?.note && (
                    <div className="p-2 bg-amber-50 rounded border border-amber-200 text-amber-900 mt-2">
                      <span className="font-bold">Ghi chú giao:</span>{' '}
                      {selectedOrder.shippingAddress.note}
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-2">
                  <div className="font-bold text-gray-900 uppercase tracking-wide border-b border-gray-200 pb-1.5">
                    Thanh Toán & Cước Vận Chuyển
                  </div>
                  <div>
                    <span className="text-gray-500">Phương thức:</span>{' '}
                    <span className="font-semibold text-gray-800">
                      {selectedOrder.paymentMethod === 'BANK_TRANSFER'
                        ? 'Chuyển khoản ngân hàng'
                        : 'Thanh toán khi nhận hàng (COD)'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Trạng thái thanh toán:</span>{' '}
                    <span className="font-bold text-emerald-700">
                      {selectedOrder.paymentStatus === 'PAID'
                        ? 'ĐÃ THANH TOÁN ĐỦ'
                        : selectedOrder.paymentStatus}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Phí chế tác đặc biệt:</span>{' '}
                    <span className="font-mono">{formatVND(selectedOrder.craftFee || 0)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Cước xe chuyên biệt:</span>{' '}
                    <span className="font-mono">{formatVND(selectedOrder.shippingFee || 0)}</span>
                  </div>
                  {selectedOrder.discount > 0 && (
                    <div className="text-emerald-700 font-medium">
                      <span>Mã giảm ({selectedOrder.couponCode || 'Voucher'}):</span>{' '}
                      <span>-{formatVND(selectedOrder.discount)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="p-3 bg-gray-100 font-bold text-gray-800 border-b border-gray-200">
                  Danh Sách Sản Phẩm Trong Đơn
                </div>
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                    <tr>
                      <th className="py-2.5 px-4">Tên Sản Phẩm</th>
                      <th className="py-2.5 px-4 text-center">Số Lượng</th>
                      <th className="py-2.5 px-4 text-right">Đơn Giá</th>
                      <th className="py-2.5 px-4 text-right">Thành Tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selectedOrder.items?.map((it, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 px-4 font-semibold text-gray-800">
                          {it.productName}
                          {it.note && (
                            <div className="text-[10px] text-amber-700 italic">{it.note}</div>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-center font-bold text-gray-700">
                          {it.quantity}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono">{formatVND(it.price)}</td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-gray-900">
                          {formatVND(it.price * it.quantity)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-amber-50 font-bold text-amber-950 border-t border-amber-200">
                      <td colSpan={3} className="py-2.5 px-4 text-right uppercase">
                        Tổng thanh toán:
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-sm font-black text-emerald-800">
                        {formatVND(selectedOrder.totalAmount)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Timeline History */}
              <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/50">
                <div className="font-bold text-gray-900 mb-3">Lịch Sử Cập Nhật & Ghi Chú</div>
                <div className="space-y-3">
                  {selectedOrder.timeline?.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-3 text-xs">
                      <div className="w-2 h-2 rounded-full bg-amber-600 mt-1.5 shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-800">
                            {getStatusText(step.status)}
                          </span>
                          <span className="text-[11px] text-gray-400 font-mono">
                            {new Date(step.changedAt).toLocaleString('vi-VN')}
                          </span>
                          <span className="text-[10px] bg-gray-200 text-gray-700 px-1.5 py-0.2 rounded font-medium">
                            {step.changedBy}
                          </span>
                        </div>
                        {step.note && (
                          <div className="text-gray-600 mt-0.5 italic">"{step.note}"</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status Update Form */}
              <div className="p-4 bg-amber-50/40 border border-amber-300 rounded-xl space-y-3">
                <div className="font-bold text-gray-900">Điều Chỉnh Tiến Trình Đơn Hàng</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      Chuyển sang trạng thái đơn:
                    </label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-amber-600"
                    >
                      <option value="PENDING">Chờ tiếp nhận (PENDING)</option>
                      <option value="CONFIRMED">Xác nhận đơn (CONFIRMED)</option>
                      <option value="PROCESSING">Đang chế tác/bọc xe (PROCESSING)</option>
                      <option value="SHIPPING">Giao hàng mui kín (SHIPPING)</option>
                      <option value="DELIVERED">Hoàn thành giao lễ (DELIVERED)</option>
                      <option value="CANCELLED">Hủy đơn hàng (CANCELLED)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      Trạng thái thanh toán:
                    </label>
                    <select
                      value={updatePaymentStatus}
                      onChange={(e) => setUpdatePaymentStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-amber-600"
                    >
                      <option value="PENDING">Chưa thanh toán (PENDING)</option>
                      <option value="PAID">Đã thanh toán (PAID)</option>
                      <option value="REFUNDED">Đã hoàn tiền (REFUNDED)</option>
                    </select>
                  </div>
                </div>

                {newStatus === 'CANCELLED' && (
                  <div>
                    <label className="block font-semibold text-red-700 mb-1">
                      Lý do hủy đơn <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      placeholder="Khách đổi ngày lễ, hết nan giang già..."
                      className="w-full px-3 py-2 border border-red-300 rounded-lg focus:outline-none focus:border-red-600"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Ghi chú tiến trình (Lưu vào lịch sử đơn)
                  </label>
                  <input
                    type="text"
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    placeholder="Ví dụ: Đã kiểm tra đủ 5 ngựa, chuẩn bị xe mui kín khởi hành..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-600"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleUpdateOrderStatus}
                    disabled={updatingStatus}
                    className="px-5 py-2 bg-amber-400 hover:bg-amber-500 text-black font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    {updatingStatus && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>Cập Nhật Tiến Trình</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-end bg-gray-50">
              <button
                type="button"
                onClick={() => setIsDetailOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
