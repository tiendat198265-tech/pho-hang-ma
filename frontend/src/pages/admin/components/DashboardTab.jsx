import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  ShoppingBag,
  Users,
  CreditCard,
  Calendar,
  ArrowUpRight,
  Package,
  Clock,
  CheckCircle,
  Truck,
  RotateCcw,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { formatVND } from '../../../utils/exportUtils';
import { getStatusText } from '../../../utils/statusTranslations';

export default function DashboardTab({ token, onNavigateTab }) {
  const [period, setPeriod] = useState('30days');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    summary: { totalRevenue: 0, totalOrders: 0, averageOrderValue: 0, newCustomers: 0 },
    revenueTimeline: [],
    statusBreakdown: [],
    topSellingProducts: [],
  });

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      let url = `/api/admin/dashboard?period=${period}`;
      if (period === 'custom' && customStart && customEnd) {
        url += `&startDate=${customStart}&endDate=${customEnd}`;
      }

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const result = await res.json();
      if (result.success) {
        setData(result.data);
      } else {
        setError(result.message || 'Không thể tải dữ liệu bảng điều khiển');
      }
    } catch (err) {
      console.error('Lỗi nạp dashboard:', err);
      setError('Lỗi kết nối máy chủ khi nạp số liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [period]);

  const handleApplyCustom = (e) => {
    e.preventDefault();
    if (customStart && customEnd) {
      fetchDashboardData();
    }
  };

  const { summary, revenueTimeline = [], statusBreakdown = [], topSellingProducts = [] } = data;

  // Calculate max revenue for SVG bar chart scaling
  const maxRevenue = Math.max(...revenueTimeline.map((item) => item.revenue || 0), 1);

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Tổng Quan Hoạt Động Xưởng Mã</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Dữ liệu doanh thu thực tế, tình trạng đơn hàng và mặt hàng tâm linh bán chạy
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-gray-100 p-1 rounded-lg">
          {[
            { id: 'today', label: 'Hôm nay' },
            { id: '7days', label: '7 ngày' },
            { id: '30days', label: '30 ngày qua' },
            { id: 'thisMonth', label: 'Tháng này' },
            { id: 'thisYear', label: 'Năm nay' },
            { id: 'custom', label: 'Tùy chọn' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setPeriod(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                period === tab.id
                  ? 'bg-amber-400 text-black font-bold shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Date Picker row */}
      {period === 'custom' && (
        <form
          onSubmit={handleApplyCustom}
          className="bg-amber-50/60 border border-amber-200 p-4 rounded-xl flex flex-wrap items-center gap-4"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-700">Từ ngày:</span>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-amber-600"
              required
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-700">Đến ngày:</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-amber-600"
              required
            />
          </div>
          <button
            type="submit"
            className="px-4 py-1.5 bg-amber-400 hover:bg-amber-500 text-black text-xs font-bold rounded-lg transition-colors"
          >
            Lọc Thống Kê
          </button>
        </form>
      )}

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin text-amber-600 mb-2" />
          <span className="text-sm">Đang tổng hợp dữ liệu thời gian thực từ MongoDB...</span>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-red-700 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1 */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs relative overflow-hidden group hover:border-amber-300 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Tổng Doanh Thu
                </span>
                <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-black text-gray-900">
                {formatVND(summary.totalRevenue || 0)}
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                <span>Doanh thu thực tế (đã trừ hủy/hoàn)</span>
              </div>
            </div>

            {/* KPI 2 */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs relative overflow-hidden group hover:border-amber-300 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Tổng Số Đơn Hàng
                </span>
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-black text-gray-900">
                {summary.totalOrders || 0}
                <span className="text-sm font-normal text-gray-500 ml-1.5">đơn</span>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Đơn hàng phát sinh trong chu kỳ
              </div>
            </div>

            {/* KPI 3 */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs relative overflow-hidden group hover:border-amber-300 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Giá Trị Đơn TB (AOV)
                </span>
                <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-black text-gray-900">
                {formatVND(Math.round(summary.averageOrderValue || 0))}
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Trung bình trên mỗi đơn chốt
              </div>
            </div>

            {/* KPI 4 */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs relative overflow-hidden group hover:border-amber-300 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Khách Hàng Mới
                </span>
                <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-black text-gray-900">
                {summary.newCustomers || 0}
                <span className="text-sm font-normal text-gray-500 ml-1.5">người</span>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Tài khoản đăng ký mới
              </div>
            </div>
          </div>

          {/* Revenue Timeline Chart & Status Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Visual Revenue Bar Chart */}
            <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-xs">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-base font-bold text-gray-900">Biểu Đồ Doanh Thu Thực Tế</h3>
                  <p className="text-xs text-gray-500">Theo các mốc thời gian trong khoảng lọc</p>
                </div>
                <button
                  onClick={() => onNavigateTab('REPORTS')}
                  className="text-xs text-amber-700 hover:text-amber-800 font-semibold flex items-center gap-1"
                >
                  <span>Xem báo cáo chi tiết</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {revenueTimeline.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-sm text-gray-400">
                  Không có giao dịch nào trong khoảng thời gian này
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="h-56 flex items-end gap-2 pt-6 pb-2 border-b border-gray-100 overflow-x-auto">
                    {revenueTimeline.map((item, idx) => {
                      const heightPercent = Math.max(Math.round((item.revenue / maxRevenue) * 100), 4);
                      return (
                        <div
                          key={idx}
                          className="flex-1 min-w-[36px] flex flex-col items-center group relative h-full justify-end"
                        >
                          {/* Tooltip */}
                          <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-[10px] py-1 px-2 rounded-md shadow-md pointer-events-none whitespace-nowrap z-20">
                            <div>{item.period}</div>
                            <div className="font-bold text-white">{formatVND(item.revenue)}</div>
                            <div>{item.orders} đơn</div>
                          </div>

                          {/* Bar */}
                          <div
                            style={{ height: `${heightPercent}%` }}
                            className="w-full max-w-[28px] bg-gradient-to-t from-red-800 to-amber-600 rounded-t-md group-hover:brightness-110 transition-all cursor-pointer"
                          />
                        </div>
                      );
                    })}
                  </div>
                  {/* Labels below chart */}
                  <div className="flex items-center justify-between text-[11px] text-gray-400 font-mono">
                    <span>{revenueTimeline[0]?.period || ''}</span>
                    <span>{revenueTimeline[revenueTimeline.length - 1]?.period || ''}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Order Status Breakdown */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900 mb-1">Đơn Theo Trạng Thái</h3>
                <p className="text-xs text-gray-500 mb-4">Phân bổ tiến độ đơn xưởng</p>

                <div className="space-y-3">
                  {statusBreakdown.length === 0 ? (
                    <div className="text-xs text-gray-400 py-8 text-center">Chưa có dữ liệu đơn hàng</div>
                  ) : (
                    statusBreakdown.map((item, idx) => {
                      const totalOrders = statusBreakdown.reduce((acc, curr) => acc + curr.count, 0) || 1;
                      const percent = Math.round((item.count / totalOrders) * 100);

                      let badgeColor = 'bg-gray-100 text-gray-700';
                      if (item.status === 'PENDING') badgeColor = 'bg-amber-100 text-amber-800';
                      if (item.status === 'CONFIRMED') badgeColor = 'bg-blue-100 text-blue-800';
                      if (item.status === 'PROCESSING') badgeColor = 'bg-indigo-100 text-indigo-800';
                      if (item.status === 'SHIPPING') badgeColor = 'bg-purple-100 text-purple-800';
                      if (item.status === 'DELIVERED') badgeColor = 'bg-emerald-100 text-emerald-800';
                      if (item.status === 'CANCELLED') badgeColor = 'bg-rose-100 text-rose-800';

                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className={`px-2 py-0.5 rounded-full font-medium ${badgeColor}`}>
                              {getStatusText(item.status)}
                            </span>
                            <span className="font-bold text-gray-800">
                              {item.count} <span className="text-gray-400 font-normal">({percent}%)</span>
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${percent}%` }}
                              className="h-full bg-amber-600 rounded-full"
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <button
                onClick={() => onNavigateTab('ORDERS')}
                className="w-full mt-6 py-2 px-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold border border-gray-200 transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Xử Lý Đơn Hàng</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Best Selling Products */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900">Sản Phẩm Bán Chạy Nhất</h3>
                <p className="text-xs text-gray-500">Mặt hàng đồ mã được cung tiến và đặt thỉnh nhiều nhất</p>
              </div>
              <button
                onClick={() => onNavigateTab('PRODUCTS')}
                className="text-xs text-amber-700 hover:text-amber-800 font-semibold flex items-center gap-1"
              >
                <span>Quản lý kho sản phẩm</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4">Sản Phẩm</th>
                    <th className="py-3 px-4">Mã SKU</th>
                    <th className="py-3 px-4 text-right">Đơn Giá</th>
                    <th className="py-3 px-4 text-right">Đã Bán</th>
                    <th className="py-3 px-4 text-right">Tồn Kho Hiện Tại</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {topSellingProducts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-400">
                        Chưa có dữ liệu sản phẩm bán ra
                      </td>
                    </tr>
                  ) : (
                    topSellingProducts.map((p, idx) => (
                      <tr key={idx} className="hover:bg-amber-50/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={p.thumbnail || 'https://via.placeholder.com/60'}
                              alt={p.name}
                              className="w-10 h-10 rounded-lg object-cover border border-gray-200 shrink-0"
                            />
                            <div>
                              <div className="font-bold text-gray-900">{p.name}</div>
                              <div className="text-[11px] text-gray-500">{p.category?.name || 'Đồ mã'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono font-medium text-gray-600">{p.sku || '-'}</td>
                        <td className="py-3 px-4 text-right font-medium text-gray-900">
                          {formatVND(p.price)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            {p.soldCount || 0}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-gray-700">
                          {p.stockQuantity}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
