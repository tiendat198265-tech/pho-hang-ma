import React, { useState, useEffect } from 'react';
import {
  Search,
  SlidersHorizontal,
  BookmarkPlus,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Package,
  Layers,
  ShoppingBag,
} from 'lucide-react';
import { formatVND } from '../../../utils/exportUtils';
import { getStatusText } from '../../../utils/statusTranslations';

export default function CustomOrdersTab({ token, onNavigateOrders }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Detail Modal
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [requestComparison, setRequestComparison] = useState(null);
  const [converting, setConverting] = useState(false);

  // Quote form state
  const [quoteForm, setQuoteForm] = useState({
    itemsTotal: 0,
    craftFee: 0,
    shippingFee: 0,
    discount: 0,
    finalQuote: 0,
    validDays: 7,
    internalNote: '',
    customerNote: '',
  });

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/custom-orders/admin', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setRequests(data.data);
      }
    } catch (err) {
      console.error('Lỗi tải yêu cầu đặt hàng:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const openRequestDetail = async (reqId) => {
    try {
      const res = await fetch(`/api/custom-orders/admin/${reqId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setSelectedRequest(data.data);
        setRequestComparison(data.comparison);

        const q = data.data.adminQuote || {};
        setQuoteForm({
          itemsTotal: q.itemsTotal || 0,
          craftFee: q.craftFee || 0,
          shippingFee: q.shippingFee || 0,
          discount: q.discount || 0,
          finalQuote: q.finalQuote || 0,
          validDays: 7,
          internalNote: q.internalNote || '',
          customerNote: q.customerNote || '',
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendQuote = async (e) => {
    e.preventDefault();
    if (!selectedRequest) return;
    try {
      const res = await fetch(`/api/custom-orders/admin/${selectedRequest._id}/quote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(quoteForm),
      });
      const data = await res.json();
      if (data.success) {
        alert('Gửi bảng báo giá tới khách hàng thành công!');
        openRequestDetail(selectedRequest._id);
        fetchRequests();
      } else {
        alert(data.message || 'Lỗi gửi báo giá');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStatus = async (status) => {
    if (!selectedRequest) return;
    try {
      const res = await fetch(`/api/custom-orders/admin/${selectedRequest._id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Đã cập nhật trạng thái: ${status}`);
        openRequestDetail(selectedRequest._id);
        fetchRequests();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Convert custom order to commercial Order
  const handleConvertToOrder = async () => {
    if (!selectedRequest) return;
    if (
      !window.confirm(
        'Bạn có chắc chắn muốn chuyển yêu cầu này thành Đơn Hàng chính thức không?'
      )
    )
      return;

    try {
      setConverting(true);
      const res = await fetch(`/api/custom-orders/${selectedRequest._id}/respond-quote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'ACCEPT',
          note: 'Xác nhận tạo đơn hàng từ trang quản trị',
        }),
      });
      const result = await res.json();
      if (result.success) {
        alert(`Đã tạo đơn hàng thành công! Mã đơn: ${result.order?.orderCode || 'Mới'}`);
        setSelectedRequest(null);
        fetchRequests();
        if (onNavigateOrders) onNavigateOrders();
      } else {
        alert(result.message || 'Không thể chuyển thành đơn hàng');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setConverting(false);
    }
  };

  const handleSaveAsTemplate = async () => {
    if (!selectedRequest) return;
    const name = window.prompt(
      'Nhập tên bộ mẫu mới muốn lưu từ đơn hàng này:',
      `Bộ Mẫu Tạo Từ ${selectedRequest.requestCode}`
    );
    if (!name) return;

    try {
      const res = await fetch('/api/templates/create-from-custom-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          customOrderId: selectedRequest._id,
          name,
          category: selectedRequest.templateSnapshot?.templateName || 'Đàn Tràng Tứ Phủ',
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Đã lưu cấu hình thành bộ mẫu mới thành công!');
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = requests.filter((r) => {
    const matchSearch =
      !searchQuery ||
      r.requestCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.contactInfo?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.contactInfo?.phone?.includes(searchQuery);

    const matchStatus = statusFilter === 'ALL' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Đặt Theo Yêu Cầu</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Tiếp nhận yêu cầu tùy biến của khách, ảnh tham khảo và gửi bảng báo giá
          </p>
        </div>
        <div className="text-xs text-gray-500 font-mono">
          Tổng hồ sơ: <span className="font-bold text-gray-800">{requests.length}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Tìm theo mã hồ sơ, tên khách, số điện thoại..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-amber-600"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-xs border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-amber-600"
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="SUBMITTED">Chờ duyệt báo giá</option>
          <option value="QUOTED">Đã gửi báo giá</option>
          <option value="CUSTOMER_ACCEPTED">Khách đã đồng ý</option>
          <option value="IN_PRODUCTION">Đang chế tác</option>
          <option value="COMPLETED">Đã bàn giao</option>
          <option value="CANCELLED">Đã hủy</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">Mã Hồ Sơ</th>
                <th className="py-3 px-4">Khách Hàng</th>
                <th className="py-3 px-4">Bộ Mẫu Gốc</th>
                <th className="py-3 px-4">Ngày Cần Lễ</th>
                <th className="py-3 px-4 text-center">Trạng Thái</th>
                <th className="py-3 px-4 text-right">Báo Giá</th>
                <th className="py-3 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin text-amber-600 mx-auto mb-2" />
                    <span>Đang nạp hồ sơ đặt lễ...</span>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    Không tìm thấy hồ sơ nào
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r._id} className="hover:bg-amber-50/20 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-primary-900">
                      {r.requestCode}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-gray-800">
                        {r.contactInfo?.fullName}
                      </div>
                      <div className="text-[11px] text-gray-500 font-mono">
                        {r.contactInfo?.phone}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-700 font-medium">
                      {r.templateSnapshot?.templateName || r.templateId?.name || 'Mẫu tự do'}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {r.contactInfo?.eventDate || 'Thỏa thuận'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          r.status === 'SUBMITTED'
                            ? 'bg-amber-100 text-amber-800'
                            : r.status === 'QUOTED'
                            ? 'bg-blue-100 text-blue-800'
                            : r.status === 'CUSTOMER_ACCEPTED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : r.status === 'IN_PRODUCTION'
                            ? 'bg-purple-100 text-purple-800'
                            : r.status === 'COMPLETED'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {getStatusText(r.status)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-primary-900">
                      {r.adminQuote?.finalQuote > 0 ? formatVND(r.adminQuote.finalQuote) : '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => openRequestDetail(r._id)}
                        className="px-3 py-1 bg-amber-400 hover:bg-amber-500 text-black font-bold rounded-md transition-colors flex items-center gap-1 ml-auto"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        <span>Xử Lý Báo Giá</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comparison Diff & Quote Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col border border-gray-200 overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-primary-950 text-white">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold tracking-wide">
                    HỒ SƠ ĐÀN LỄ: {selectedRequest.requestCode}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500 text-primary-950 font-bold">
                    {getStatusText(selectedRequest.status)}
                  </span>
                </div>
                <div className="text-[11px] text-gray-300 mt-0.5">
                  Khách hàng: <strong>{selectedRequest.contactInfo?.fullName}</strong> (
                  {selectedRequest.contactInfo?.phone})
                </div>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="text-gray-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
              {/* 1. VISUAL DIFF COMPARISON */}
              <div className="bg-amber-50/50 border border-amber-200 p-4 rounded-xl">
                <div className="font-bold text-gray-900 uppercase tracking-wide mb-3">
                  ✦ Bảng So Sánh Thay Đổi So Với Mẫu Gốc
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-white border border-emerald-200 rounded-lg">
                    <span className="text-emerald-700 font-semibold block">Giữ nguyên:</span>
                    <span className="text-base font-bold text-gray-800">
                      {requestComparison?.keptItems?.length || 0} món
                    </span>
                  </div>
                  <div className="p-3 bg-white border border-blue-200 rounded-lg">
                    <span className="text-blue-700 font-semibold block">Đổi số lượng:</span>
                    <span className="text-base font-bold text-gray-800">
                      {requestComparison?.quantityChangedItems?.length || 0} món
                    </span>
                  </div>
                  <div className="p-3 bg-white border border-rose-200 rounded-lg">
                    <span className="text-rose-700 font-semibold block">Khách bỏ (-):</span>
                    <span className="text-base font-bold text-gray-800">
                      {requestComparison?.removedItems?.length || 0} món
                    </span>
                  </div>
                  <div className="p-3 bg-white border border-amber-300 rounded-lg">
                    <span className="text-amber-800 font-semibold block">Thêm mới (+):</span>
                    <span className="text-base font-bold text-gray-800">
                      {requestComparison?.addedItems?.length || 0} món
                    </span>
                  </div>
                </div>

                {/* Diff table */}
                <div className="mt-3.5 border border-gray-200 rounded-lg overflow-hidden bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">Linh Phẩm</th>
                        <th className="py-2.5 px-3 text-center">Phân Loại</th>
                        <th className="py-2.5 px-3 text-center">Mẫu Gốc</th>
                        <th className="py-2.5 px-3 text-center">Khách Chọn</th>
                        <th className="py-2.5 px-3">Ghi Chú Khách</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {selectedRequest.items?.map((it, idx) => (
                        <tr
                          key={idx}
                          className={it.removedFromTemplate ? 'bg-rose-50/50' : 'hover:bg-gray-50'}
                        >
                          <td className="py-2.5 px-3 font-semibold text-gray-900">
                            <div className="flex items-center gap-2.5">
                              {(it.customImage || it.referenceImages?.[0]?.url || it.productId?.thumbnail) && (
                                <img
                                  src={it.customImage || it.referenceImages?.[0]?.url || it.productId?.thumbnail}
                                  alt={it.productNameSnapshot}
                                  className="w-9 h-9 rounded object-cover border border-gray-200 shrink-0 cursor-pointer hover:ring-2 hover:ring-amber-500 transition-all shadow-xs"
                                  onClick={() => window.open(it.customImage || it.referenceImages?.[0]?.url || it.productId?.thumbnail, '_blank')}
                                  title="Bấm để xem ảnh phóng to trong tab mới"
                                />
                              )}
                              <div>
                                <div className="leading-tight">{it.productNameSnapshot}</div>
                                {it.unit && (
                                  <div className="text-[10.5px] text-gray-400 font-normal mt-0.5">ĐVT: {it.unit}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            {it.removedFromTemplate ? (
                              <span className="text-rose-600 font-bold text-[10px] bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                                - ĐÃ BỎ
                              </span>
                            ) : it.isCustomItem || (!it.productId && it.addedManually) ? (
                              <span className="text-purple-800 font-bold text-[10px] bg-purple-100 px-2 py-0.5 rounded border border-purple-300">
                                ✦ TỰ YÊU CẦU
                              </span>
                            ) : it.addedManually ? (
                              <span className="text-amber-700 font-bold text-[10px] bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                + THÊM MỚI
                              </span>
                            ) : it.originalQuantityInTemplate > 0 &&
                              it.quantity !== it.originalQuantityInTemplate ? (
                              <span className="text-blue-600 font-bold text-[10px] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                ± ĐỔI SL
                              </span>
                            ) : (
                              <span className="text-emerald-700 font-medium text-[10px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                = Giữ nguyên
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono text-gray-500">
                            {it.originalQuantityInTemplate
                              ? `x${it.originalQuantityInTemplate}`
                              : '—'}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-primary-900">
                            {it.removedFromTemplate ? '0' : `x${it.quantity}`}
                          </td>
                          <td className="py-2.5 px-3 text-gray-600 italic">{it.note || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 2. Customer Notes & Reference Images */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
                  <div className="font-bold text-gray-700 uppercase">Ghi Chú Của Khách Hàng:</div>
                  <div className="p-3 bg-white rounded border border-gray-200 text-gray-800">
                    {selectedRequest.generalNotes || 'Không có ghi chú thêm.'}
                  </div>
                  <div className="text-gray-600">
                    <strong>Nơi lập đàn:</strong>{' '}
                    {selectedRequest.contactInfo?.altarAddress || 'Nhận tại xưởng'}
                  </div>
                </div>

                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
                  <div className="font-bold text-gray-700 uppercase">
                    Ảnh Khách Gửi Kèm ({selectedRequest.globalReferenceImages?.length || 0}):
                  </div>
                  {selectedRequest.globalReferenceImages?.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedRequest.globalReferenceImages.map((img, idx) => (
                        <a
                          key={idx}
                          href={img.url}
                          target="_blank"
                          rel="noreferrer"
                          className="w-16 h-16 rounded-lg border border-gray-200 overflow-hidden hover:border-amber-600 transition-colors"
                        >
                          <img src={img.url} alt="Ảnh mẫu" className="w-full h-full object-cover" />
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-400 italic">Khách không tải lên ảnh mẫu</div>
                  )}
                </div>
              </div>

              {/* 3. BẢNG BÁO GIÁ THỢ CẢ */}
              <form
                onSubmit={handleSendQuote}
                className="p-5 bg-white border border-gray-300 rounded-xl shadow-xs space-y-4"
              >
                <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                  <span className="font-bold text-gray-900 uppercase">Bảng Báo Giá Chính Thức</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-900 font-bold">
                    GỬI CHO KHÁCH DUYỆT
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-600 mb-1">
                      Tiền sản phẩm (đ)
                    </label>
                    <input
                      type="number"
                      value={quoteForm.itemsTotal}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setQuoteForm({
                          ...quoteForm,
                          itemsTotal: val,
                          finalQuote:
                            val + quoteForm.craftFee + quoteForm.shippingFee - quoteForm.discount,
                        });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono font-bold focus:outline-none focus:border-amber-600"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-600 mb-1">
                      Công nghệ nhân (đ)
                    </label>
                    <input
                      type="number"
                      value={quoteForm.craftFee}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setQuoteForm({
                          ...quoteForm,
                          craftFee: val,
                          finalQuote:
                            quoteForm.itemsTotal + val + quoteForm.shippingFee - quoteForm.discount,
                        });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono font-bold focus:outline-none focus:border-amber-600"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-600 mb-1">
                      Cước xe mui kín (đ)
                    </label>
                    <input
                      type="number"
                      value={quoteForm.shippingFee}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setQuoteForm({
                          ...quoteForm,
                          shippingFee: val,
                          finalQuote:
                            quoteForm.itemsTotal + quoteForm.craftFee + val - quoteForm.discount,
                        });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono font-bold focus:outline-none focus:border-amber-600"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-600 mb-1">
                      Giảm trừ tri ân (đ)
                    </label>
                    <input
                      type="number"
                      value={quoteForm.discount}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setQuoteForm({
                          ...quoteForm,
                          discount: val,
                          finalQuote:
                            quoteForm.itemsTotal +
                            quoteForm.craftFee +
                            quoteForm.shippingFee -
                            val,
                        });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono font-bold focus:outline-none focus:border-amber-600"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <span className="font-bold text-gray-800 uppercase">TỔNG BÁO GIÁ CHO KHÁCH:</span>
                  <span className="text-xl font-black text-primary-900 font-mono">
                    {formatVND(quoteForm.finalQuote)}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-600 mb-1">
                      Lời dặn gửi khách hàng
                    </label>
                    <input
                      type="text"
                      value={quoteForm.customerNote}
                      onChange={(e) =>
                        setQuoteForm({ ...quoteForm, customerNote: e.target.value })
                      }
                      placeholder="Nan giang cật già bồi giấy dó ngũ sắc..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-600"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-600 mb-1">
                      Ghi chú nội bộ xưởng
                    </label>
                    <input
                      type="text"
                      value={quoteForm.internalNote}
                      onChange={(e) =>
                        setQuoteForm({ ...quoteForm, internalNote: e.target.value })
                      }
                      placeholder="Giao cho thợ Bùi Đức Thắng phụ trách..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-600"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-400 hover:bg-amber-500 text-black font-bold rounded-lg shadow-sm transition-colors"
                  >
                    Gửi Báo Giá Tới Khách Hàng
                  </button>
                </div>
              </form>

              {/* Status Update & Actions */}
              <div className="pt-2 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-600">Đổi trạng thái:</span>
                  <button
                    onClick={() => handleUpdateStatus('IN_PRODUCTION')}
                    className="px-3 py-1 font-semibold bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100"
                  >
                    Vào Gia Công
                  </button>
                  <button
                    onClick={() => handleUpdateStatus('COMPLETED')}
                    className="px-3 py-1 font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100"
                  >
                    Bàn Giao Xong
                  </button>
                </div>

                {/* When customer accepted -> Convert to Order button */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleConvertToOrder}
                    disabled={converting}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {converting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Chuyển Thành Đơn Hàng (Order)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveAsTemplate}
                    className="px-3 py-1.5 text-primary-900 hover:bg-amber-50 border border-amber-300 font-semibold rounded-lg transition-colors flex items-center gap-1"
                  >
                    <BookmarkPlus className="w-3.5 h-3.5" />
                    <span>Lưu Thành Bộ Mẫu Mới</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-gray-200 flex justify-end bg-gray-50">
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="px-4 py-2 font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 rounded-lg"
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
