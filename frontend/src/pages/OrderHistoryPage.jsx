import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Package,
  SlidersHorizontal,
  ArrowRight,
  Clock,
  CheckCircle,
  FileText,
  User,
  RotateCcw,
  Loader2,
  Calendar,
  AlertCircle,
  ShoppingBag,
} from 'lucide-react';
import { getStatusText, getRoleText } from '../utils/statusTranslations';

export default function OrderHistoryPage() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('CUSTOM_ORDERS'); // 'CUSTOM_ORDERS' | 'COMMERCIAL_ORDERS'
  const [customOrders, setCustomOrders] = useState([]);
  const [commercialOrders, setCommercialOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token) {
      setCustomOrders([]);
      setCommercialOrders([]);
      navigate('/dang-nhap');
      return;
    }

    fetchOrders();
  }, [token, navigate]);

  const fetchOrders = async () => {
    try {
      setLoadingOrders(true);
      setErrorMsg('');
      const [reqRes, ordersRes] = await Promise.all([
        fetch('/api/custom-orders/my-requests', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/orders/my-orders', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const [reqData, ordersData] = await Promise.all([reqRes.json(), ordersRes.json()]);

      if (reqData.success) {
        setCustomOrders(reqData.data || []);
      }
      if (ordersData.success) {
        setCommercialOrders(ordersData.data || []);
      }
    } catch (err) {
      console.error('Error fetching order history:', err);
      setErrorMsg('Không thể tải dữ liệu đơn hàng. Vui lòng thử lại sau.');
    } finally {
      setLoadingOrders(false);
    }
  };

  return (
    <div className="w-full bg-[#FAF7F2] min-h-screen py-10">
      <div className="max-w-[1200px] mx-auto px-4">
        {/* Header Breadcrumb & Top Bar */}
        <div className="bg-white border border-[#E6DFD5] p-6 rounded-[6px] shadow-antique-card mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 rounded-full bg-gradient-to-br from-[#8B1E21] to-[#A32427] text-white flex items-center justify-center shadow-sm">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-serif text-[22px] font-bold text-[#262626]">Lịch Sử Đơn & Yêu Cầu</h1>
                <span className="seal-badge text-[10px]">THEO DÕI ĐƠN HÀNG</span>
              </div>
              <div className="text-[13px] text-[#584140] mt-0.5">
                Quản lý các yêu cầu đàn tràng tùy chỉnh và đơn hàng mua sắm của bạn
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/tai-khoan"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[4px] border border-[#C59B27] bg-[#F9F4E8] text-[#8B1E21] hover:bg-[#8B1E21] hover:text-[#FAF7F2] text-[13px] font-medium transition-all"
            >
              <User size={15} />
              <span>Tài Khoản Của Tôi</span>
            </Link>

            <button
              onClick={fetchOrders}
              disabled={loadingOrders}
              className="btn-secondary !text-[12.5px] !py-2 flex items-center gap-1.5"
              title="Làm mới dữ liệu"
            >
              <RotateCcw size={14} className={loadingOrders ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Làm mới</span>
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[#E6DFD5] mb-8 gap-2 sm:gap-6 text-[14px] overflow-x-auto">
          <button
            onClick={() => setActiveTab('CUSTOM_ORDERS')}
            className={`pb-3 px-2 font-semibold transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'CUSTOM_ORDERS'
                ? 'border-[#8B1E21] text-[#8B1E21]'
                : 'border-transparent text-[#584140] hover:text-[#262626]'
            }`}
          >
            <SlidersHorizontal size={16} />
            <span>Yêu Cầu Đặt Theo Mẫu ({customOrders.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('COMMERCIAL_ORDERS')}
            className={`pb-3 px-2 font-semibold transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'COMMERCIAL_ORDERS'
                ? 'border-[#8B1E21] text-[#8B1E21]'
                : 'border-transparent text-[#584140] hover:text-[#262626]'
            }`}
          >
            <ShoppingBag size={16} />
            <span>Đơn Hàng Linh Phẩm ({commercialOrders.length})</span>
          </button>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* TAB 1: YÊU CẦU ĐẶT THEO MẪU */}
        {activeTab === 'CUSTOM_ORDERS' && (
          <div>
            {loadingOrders ? (
              <div className="py-16 text-center text-[#584140]">
                <Loader2 className="w-8 h-8 animate-spin text-[#8B1E21] mx-auto mb-3" />
                <span className="text-sm">Đang tải danh sách yêu cầu đặt mâm lễ...</span>
              </div>
            ) : customOrders.length === 0 ? (
              <div className="bg-white border border-[#E6DFD5] p-12 text-center rounded-[6px] shadow-sm">
                <SlidersHorizontal className="w-12 h-12 text-[#C59B27] mx-auto mb-3 opacity-60" />
                <h3 className="font-serif text-[17px] font-bold text-[#262626] mb-1">
                  Chưa có yêu cầu đặt mâm lễ nào
                </h3>
                <p className="text-[#584140] text-[13.5px] max-w-md mx-auto mb-6">
                  Bạn có thể chọn một bộ mẫu đàn tràng theo nghi lễ cổ truyền và tùy chỉnh kích thước, màu sắc linh phẩm theo ý nguyện.
                </p>
                <Link to="/bo-mau" className="btn-primary inline-flex items-center gap-2">
                  <span>Khám Phá Bộ Mẫu Đàn Tràng</span>
                  <ArrowRight size={15} />
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {customOrders.map((req) => (
                  <div
                    key={req._id}
                    className="bg-white border border-[#E6DFD5] p-5 sm:p-6 rounded-[6px] shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-[#C59B27] transition-all group"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-mono font-bold text-[#8B1E21] text-[15.5px]">
                          {req.requestCode}
                        </span>
                        <span className="seal-badge !bg-[#F4EFEB] !text-[#3E2723] text-[11px]">
                          {getStatusText(req.status)}
                        </span>
                        <span className="text-[11px] text-gray-400 flex items-center gap-1 font-mono">
                          <Calendar size={12} />
                          {new Date(req.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                      <div className="text-[14px] text-[#262626] font-semibold">
                        Bộ mẫu: {req.templateSnapshot?.templateName || 'Đàn lễ tùy chỉnh'}
                      </div>
                      <div className="text-[12.5px] text-[#584140]">
                        Số linh phẩm thành phần: <strong>{req.items?.length || 0}</strong> món
                        {req.ceremonyDate && (
                          <span className="ml-3 text-amber-800">
                            • Ngày hành lễ dự kiến: {new Date(req.ceremonyDate).toLocaleDateString('vi-VN')}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-gray-100">
                      {req.adminQuote?.finalQuote > 0 ? (
                        <div className="text-left md:text-right">
                          <div className="text-[11px] text-[#584140]">Báo giá Thợ Cả:</div>
                          <div className="font-bold text-[#8B1E21] text-[16px]">
                            {Number(req.adminQuote.finalQuote).toLocaleString('vi-VN')} đ
                          </div>
                        </div>
                      ) : (
                        <div className="text-left md:text-right">
                          <div className="text-[11px] text-[#8C6D18]">Trạng thái giá:</div>
                          <div className="text-[13px] text-gray-500 italic">Đang thẩm định</div>
                        </div>
                      )}
                      <Link
                        to={`/tra-cuu-bao-gia/${req.requestCode}`}
                        className="btn-primary !text-[12.5px] !py-2.5 flex items-center gap-1"
                      >
                        <span>Chi Tiết Báo Giá</span>
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ĐƠN HÀNG THƯƠNG MẠI */}
        {activeTab === 'COMMERCIAL_ORDERS' && (
          <div>
            {loadingOrders ? (
              <div className="py-16 text-center text-[#584140]">
                <Loader2 className="w-8 h-8 animate-spin text-[#8B1E21] mx-auto mb-3" />
                <span className="text-sm">Đang tải danh sách đơn hàng...</span>
              </div>
            ) : commercialOrders.length === 0 ? (
              <div className="bg-white border border-[#E6DFD5] p-12 text-center rounded-[6px] shadow-sm">
                <Package className="w-12 h-12 text-[#C59B27] mx-auto mb-3 opacity-60" />
                <h3 className="font-serif text-[17px] font-bold text-[#262626] mb-1">
                  Chưa có đơn hàng thương mại nào
                </h3>
                <p className="text-[#584140] text-[13.5px] max-w-md mx-auto mb-6">
                  Bạn có thể chọn mua các vật phẩm lẻ như hình nhân, ngựa ngũ sắc, tiền vàng, đồ thờ tại kho linh phẩm.
                </p>
                <Link to="/san-pham" className="btn-primary inline-flex items-center gap-2">
                  <span>Khám Phá Kho Linh Phẩm</span>
                  <ArrowRight size={15} />
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {commercialOrders.map((ord) => (
                  <div
                    key={ord._id}
                    className="bg-white border border-[#E6DFD5] p-5 sm:p-6 rounded-[6px] shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-[#C59B27] transition-all"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-mono font-bold text-[#8B1E21] text-[15.5px]">
                          {ord.orderCode}
                        </span>
                        <span className="seal-badge !bg-emerald-50 !text-emerald-800 text-[11px]">
                          {getStatusText(ord.orderStatus)}
                        </span>
                        <span className="text-[11px] text-gray-400 flex items-center gap-1 font-mono">
                          <Calendar size={12} />
                          {new Date(ord.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                      <div className="text-[13px] text-[#584140]">
                        Số sản phẩm: <strong>{ord.items?.length || 0}</strong> món
                      </div>
                      <div className="text-[14px] text-[#262626] font-semibold">
                        Tổng thanh toán: <span className="text-[#8B1E21]">{Number(ord.totalAmount).toLocaleString('vi-VN')} đ</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 border-gray-100">
                      <Link
                        to={`/don-hang/${ord.orderCode}`}
                        className="btn-secondary !text-[12.5px] !py-2 flex items-center gap-1"
                      >
                        <FileText size={14} />
                        <span>Xem Hóa Đơn Chi Tiết</span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
