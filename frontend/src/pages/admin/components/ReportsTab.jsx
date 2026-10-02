import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Calendar,
  Filter,
  Loader2,
  AlertCircle,
  TrendingUp,
  ShoppingBag,
  CreditCard,
  Ban,
  Search,
} from 'lucide-react';
import { formatVND, exportToExcel, exportToCSV, exportToPDF } from '../../../utils/exportUtils';
import { getStatusText } from '../../../utils/statusTranslations';

export default function ReportsTab({ token }) {
  const [groupBy, setGroupBy] = useState('month'); // 'day' | 'week' | 'month' | 'quarter' | 'year' | 'custom'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState({
    summary: { totalRevenue: 0, totalOrders: 0, averageOrderValue: 0, cancelledOrders: 0 },
    timeline: [],
    detailedOrders: [],
  });

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError(null);
      let url = `/api/admin/reports/revenue?groupBy=${groupBy}`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const result = await res.json();
      if (result.success) {
        setReportData(result.data);
      } else {
        setError(result.message || 'Không thể tải báo cáo doanh thu');
      }
    } catch (err) {
      console.error('Lỗi nạp báo cáo:', err);
      setError('Lỗi kết nối khi tải số liệu báo cáo doanh thu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [groupBy]);

  const handleApplyFilter = (e) => {
    e.preventDefault();
    fetchReport();
  };

  const getFilterLabel = () => {
    switch (groupBy) {
      case 'day':
        return 'Báo cáo theo Ngày';
      case 'week':
        return 'Báo cáo theo Tuần';
      case 'month':
        return 'Báo cáo theo Tháng';
      case 'quarter':
        return 'Báo cáo theo Quý';
      case 'year':
        return 'Báo cáo theo Năm';
      default:
        return 'Khoảng thời gian tùy chọn';
    }
  };

  const filterInfo = {
    label: getFilterLabel(),
    startDate: startDate || 'Toàn thời gian',
    endDate: endDate || 'Hiện tại',
  };

  const { summary = {}, timeline = [], detailedOrders = [] } = reportData;

  const filteredOrders = detailedOrders.filter((o) => {
    if (!orderSearch) return true;
    const term = orderSearch.toLowerCase();
    return (
      o.orderCode?.toLowerCase().includes(term) ||
      o.shippingAddress?.fullName?.toLowerCase().includes(term) ||
      o.shippingAddress?.phone?.includes(term)
    );
  });

  // Calculate max revenue for visual bar chart
  const maxRevenue = Math.max(...timeline.map((t) => t.revenue || 0), 1);

  return (
    <div className="space-y-6">
      {/* Header and Export Toolbar */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Báo Cáo Doanh Thu Thực Tế</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Tự động loại trừ các đơn hủy/hoàn tiền theo đúng quy chuẩn nghiệp vụ xưởng
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => exportToExcel(reportData, filterInfo)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors disabled:opacity-50"
            title="Xuất file Excel XML chuẩn format bảng tính"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Xuất Excel</span>
          </button>

          <button
            onClick={() => exportToCSV(reportData, filterInfo)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors disabled:opacity-50"
            title="Xuất file CSV mã hóa UTF-8 BOM"
          >
            <Download className="w-4 h-4" />
            <span>Xuất CSV</span>
          </button>

          <button
            onClick={() => exportToPDF(reportData, filterInfo)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors disabled:opacity-50"
            title="Xem và in báo cáo định dạng PDF"
          >
            <Printer className="w-4 h-4" />
            <span>Xuất PDF</span>
          </button>
        </div>
      </div>

      {/* Period Grouping & Custom Date Picker */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 bg-gray-100 p-1 rounded-lg">
            {[
              { id: 'day', label: 'Theo Ngày' },
              { id: 'week', label: 'Theo Tuần' },
              { id: 'month', label: 'Theo Tháng' },
              { id: 'quarter', label: 'Theo Quý' },
              { id: 'year', label: 'Theo Năm' },
              { id: 'custom', label: 'Tùy Chỉnh' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setGroupBy(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  groupBy === tab.id
                    ? 'bg-amber-400 text-black font-bold shadow-xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Date range form */}
          <form onSubmit={handleApplyFilter} className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-600">Từ:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2.5 py-1 text-xs border border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:border-amber-600"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-600">Đến:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2.5 py-1 text-xs border border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:border-amber-600"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-1 bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              Áp Dụng
            </button>
          </form>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin text-amber-600 mb-2" />
          <span className="text-sm">Đang tính toán số liệu doanh thu từ cơ sở dữ liệu...</span>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-red-700 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      ) : (
        <>
          {/* Summary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
              <div className="flex items-center justify-between text-xs text-gray-500 font-semibold uppercase">
                <span>Doanh Thu Thực Tế</span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="mt-2 text-2xl font-black text-emerald-700">
                {formatVND(summary.totalRevenue || 0)}
              </div>
              <div className="mt-2 text-xs text-gray-500">Đơn thành công hoặc đã thanh toán</div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
              <div className="flex items-center justify-between text-xs text-gray-500 font-semibold uppercase">
                <span>Tổng Đơn Thành Công</span>
                <ShoppingBag className="w-4 h-4 text-blue-600" />
              </div>
              <div className="mt-2 text-2xl font-black text-gray-900">
                {summary.totalOrders || 0} <span className="text-sm font-normal text-gray-500">đơn</span>
              </div>
              <div className="mt-2 text-xs text-gray-500">Số đơn ghi nhận doanh thu</div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
              <div className="flex items-center justify-between text-xs text-gray-500 font-semibold uppercase">
                <span>Giá Trị Đơn TB (AOV)</span>
                <CreditCard className="w-4 h-4 text-amber-600" />
              </div>
              <div className="mt-2 text-2xl font-black text-amber-800">
                {formatVND(Math.round(summary.averageOrderValue || 0))}
              </div>
              <div className="mt-2 text-xs text-gray-500">Bình quân trên 1 đơn hàng</div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
              <div className="flex items-center justify-between text-xs text-gray-500 font-semibold uppercase">
                <span>Đơn Đã Hủy / Hoàn Tiền</span>
                <Ban className="w-4 h-4 text-rose-600" />
              </div>
              <div className="mt-2 text-2xl font-black text-rose-700">
                {summary.cancelledOrders || 0} <span className="text-sm font-normal text-gray-500">đơn</span>
              </div>
              <div className="mt-2 text-xs text-rose-600 font-medium">Bị loại trừ khỏi tổng doanh thu</div>
            </div>
          </div>

          {/* Revenue Chart */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs">
            <h3 className="text-base font-bold text-gray-900 mb-1">
              Biểu Đồ Xu Hướng Doanh Thu ({getFilterLabel()})
            </h3>
            <p className="text-xs text-gray-500 mb-6">
              Mức tăng trưởng doanh thu theo chu kỳ được chọn
            </p>

            {timeline.length === 0 ? (
              <div className="py-12 text-center text-sm text-gray-400">
                Không có dữ liệu trong khoảng thời gian này
              </div>
            ) : (
              <div className="space-y-4">
                <div className="h-60 flex items-end gap-3 pt-6 pb-2 border-b border-gray-100 overflow-x-auto">
                  {timeline.map((item, idx) => {
                    const heightPercent = Math.max(Math.round((item.revenue / maxRevenue) * 100), 4);
                    return (
                      <div
                        key={idx}
                        className="flex-1 min-w-[42px] flex flex-col items-center group relative h-full justify-end"
                      >
                        <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-[11px] py-1 px-2.5 rounded-md shadow-md pointer-events-none whitespace-nowrap z-20">
                          <div className="font-bold text-white">{item.period}</div>
                          <div>{formatVND(item.revenue)}</div>
                          <div className="text-gray-300">{item.orders} đơn | TB: {formatVND(Math.round(item.aov))}</div>
                        </div>
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className="w-full max-w-[32px] bg-gradient-to-t from-primary-900 to-amber-600 rounded-t-md group-hover:brightness-110 transition-all cursor-pointer"
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500 font-mono">
                  <span>{timeline[0]?.period || ''}</span>
                  <span>{timeline[timeline.length - 1]?.period || ''}</span>
                </div>
              </div>
            )}
          </div>

          {/* Revenue Breakdown Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">Bảng Tổng Hợp Chi Tiết Theo Kỳ</h3>
              <span className="text-xs text-gray-500 font-mono">Tổng: {timeline.length} mốc</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-100 text-gray-700 font-semibold border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4">Mốc Thời Gian</th>
                    <th className="py-3 px-4 text-right">Doanh Thu Thực Tế</th>
                    <th className="py-3 px-4 text-right">Số Đơn Hàng</th>
                    <th className="py-3 px-4 text-right">Giá Trị TB / Đơn (AOV)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {timeline.map((item, idx) => (
                    <tr key={idx} className="hover:bg-amber-50/20 transition-colors">
                      <td className="py-3 px-4 font-bold text-gray-800">{item.period}</td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-700">
                        {formatVND(item.revenue)}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-700 font-medium">
                        {item.orders}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-700">
                        {formatVND(Math.round(item.aov || 0))}
                      </td>
                    </tr>
                  ))}
                  {/* Grand total row at bottom */}
                  <tr className="bg-amber-50 font-bold border-t-2 border-amber-300 text-amber-950">
                    <td className="py-3.5 px-4 uppercase tracking-wider">TỔNG CỘNG</td>
                    <td className="py-3.5 px-4 text-right text-emerald-800 text-sm font-black">
                      {formatVND(summary.totalRevenue || 0)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-sm">
                      {summary.totalOrders || 0}
                    </td>
                    <td className="py-3.5 px-4 text-right text-sm">
                      {formatVND(Math.round(summary.averageOrderValue || 0))}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Detailed Orders Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Danh Sách Đơn Hàng Ghi Nhận Doanh Thu</h3>
                <p className="text-xs text-gray-500">Các đơn hợp lệ cấu thành doanh thu thực tế</p>
              </div>

              {/* Search in table */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Tìm mã đơn, tên khách, số ĐT..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded-lg w-64 focus:outline-none focus:border-amber-600"
                />
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4">Mã Đơn</th>
                    <th className="py-3 px-4">Ngày Đặt</th>
                    <th className="py-3 px-4">Khách Hàng</th>
                    <th className="py-3 px-4">Trạng Thái Đơn</th>
                    <th className="py-3 px-4">Thanh Toán</th>
                    <th className="py-3 px-4 text-right">Giảm Giá</th>
                    <th className="py-3 px-4 text-right">Tổng Tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-400">
                        Không có đơn hàng nào khớp với tìm kiếm
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((o) => (
                      <tr key={o._id} className="hover:bg-amber-50/20 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-gray-900">{o.orderCode}</td>
                        <td className="py-3 px-4 text-gray-500 font-mono">
                          {new Date(o.createdAt).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-gray-800">{o.shippingAddress?.fullName || 'Khách vãng lai'}</div>
                          <div className="text-[11px] text-gray-500">{o.shippingAddress?.phone}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-800">
                            {getStatusText(o.orderStatus)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {o.paymentStatus === 'PAID' ? 'Đã thanh toán' : o.paymentStatus}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-gray-500">
                          {o.discount > 0 ? `-${formatVND(o.discount)}` : '0 đ'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-gray-900">
                          {formatVND(o.totalAmount)}
                        </td>
                      </tr>
                    ))
                  )}
                  {/* Grand total row at bottom */}
                  <tr className="bg-amber-50 font-bold border-t-2 border-amber-300 text-amber-950">
                    <td colSpan={6} className="py-3.5 px-4 uppercase tracking-wider text-right">
                      TỔNG CUỐI BẢNG DOANH THU:
                    </td>
                    <td className="py-3.5 px-4 text-right text-emerald-800 text-sm font-black font-mono">
                      {formatVND(summary.totalRevenue || 0)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
