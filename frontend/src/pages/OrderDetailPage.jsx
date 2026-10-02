import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import {
  CheckCircle2,
  ShieldCheck,
  Truck,
  Phone,
  PackageCheck,
  Printer,
  Download,
  X,
  PhoneCall,
  Clock,
  Sparkles,
} from 'lucide-react';
import { getStatusText } from '../utils/statusTranslations';

export default function OrderDetailPage() {
  const { code } = useParams();
  const location = useLocation();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // 5-second prominent notification modal state
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders/code/${code}`);
        const data = await res.json();
        if (data.success) {
          setOrder(data.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [code]);

  // Check if order was just placed to trigger 5-second announcement modal
  useEffect(() => {
    if (!order) return;
    const isJustPlaced =
      location.state?.justPlaced ||
      sessionStorage.getItem(`order_just_placed_${order.orderCode}`);
    if (isJustPlaced) {
      setShowOrderModal(true);
      try {
        sessionStorage.removeItem(`order_just_placed_${order.orderCode}`);
      } catch (e) {}
    }
  }, [order, location.state]);

  // 5-second countdown timer for the order confirmation modal
  useEffect(() => {
    if (!showOrderModal) return;
    if (countdown <= 0) {
      setShowOrderModal(false);
      return;
    }
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [showOrderModal, countdown]);

  // Handler: Export / Print Invoice to PDF via native browser dialog
  const handlePrintInvoice = () => {
    window.print();
  };

  // Handler: Download text invoice file
  const handleDownloadTxtInvoice = () => {
    if (!order) return;
    const divider = '=======================================================';
    const subDivider = '-------------------------------------------------------';
    let content = `${divider}\n`;
    content += `   XƯỞNG THỦ CÔNG TRUYỀN THỐNG HÀNG MÃ TUYẾT MÃ\n`;
    content += `   Làng nghề Thường Tín & Phố cổ Hàng Mã, Hà Nội\n`;
    content += `   Hotline Thợ Cả: 0396.163.773\n`;
    content += `${divider}\n\n`;
    content += `           HÓA ĐƠN BÁN LẺ & GIAO HÀNG ĐỒ LỄ\n\n`;
    content += `Mã đơn hàng: ${order.orderCode}\n`;
    content += `Ngày đặt:    ${new Date(order.createdAt).toLocaleString('vi-VN')}\n`;
    content += `Trạng thái:  ${getStatusText(order.orderStatus)}\n\n`;
    content += `${subDivider}\n`;
    content += `THÔNG TIN NGƯỜI NHẬN:\n`;
    content += `- Họ và tên:    ${order.shippingAddress?.fullName || 'N/A'}\n`;
    content += `- Số điện thoại: ${order.shippingAddress?.phone || 'N/A'}\n`;
    content += `- Địa chỉ:      ${order.shippingAddress?.address || ''}, ${order.shippingAddress?.city || ''}\n`;
    if (order.shippingAddress?.deliveryDate) {
      content += `- Giờ hoàng đạo: ${order.shippingAddress.deliveryDate}\n`;
    }
    content += `- Thanh toán:   ${order.paymentMethod === 'BANK_TRANSFER' ? 'Chuyển khoản VietQR' : 'Tiền mặt khi nhận đồ lễ (COD)'}\n`;
    content += `${subDivider}\n\n`;
    content += `DANH SÁCH LINH PHẨM:\n`;
    order.items?.forEach((it, idx) => {
      content += `${idx + 1}. ${it.productName}\n`;
      content += `   Số lượng: ${it.quantity} | Đơn giá: ${Number(it.price).toLocaleString('vi-VN')} đ | Thành tiền: ${Number(it.price * it.quantity).toLocaleString('vi-VN')} đ\n`;
    });
    content += `\n${subDivider}\n`;
    content += `Tiền linh phẩm:   ${Number(order.itemsTotal).toLocaleString('vi-VN')} đ\n`;
    if (order.craftFee > 0) {
      content += `Công nghệ nhân:   ${Number(order.craftFee).toLocaleString('vi-VN')} đ\n`;
    }
    content += `Cước xe mui kín:  ${Number(order.shippingFee).toLocaleString('vi-VN')} đ\n`;
    content += `TỔNG THANH TOÁN:  ${Number(order.totalAmount).toLocaleString('vi-VN')} đ\n`;
    content += `${divider}\n\n`;
    content += `XÁC NHẬN XUẤT XƯỞNG:\n`;
    content += `[XƯỞNG HÀNG MÃ TUYẾT MÃ - ĐÃ DUYỆT XUẤT XE MUI KÍN]\n\n`;
    content += `Người lập phiếu                 Người nhận đồ lễ\n`;
    content += `(Ký và đóng dấu)               (Ký và ghi rõ họ tên)\n\n`;
    content += `* Quý khách vui lòng kiểm tra đủ số lượng linh phẩm khi bàn giao.\n`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Hoa-Don-${order.orderCode}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="max-w-[800px] mx-auto px-4 py-20 text-center text-[#584140]">Đang tải dữ liệu đơn hàng...</div>;
  }

  if (!order) {
    return (
      <div className="max-w-[800px] mx-auto px-4 py-20 text-center">
        <h2 className="font-serif text-[22px] font-bold text-[#8B1E21]">Không tìm thấy đơn hàng này</h2>
        <Link to="/" className="btn-secondary mt-4">Về trang chủ</Link>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#FAF7F2] min-h-screen py-10">
      {/* 5-Second Success Notification Modal */}
      {showOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm no-print">
          <div className="bg-[#FAF7F2] border-2 border-[#8B1E21] rounded-lg shadow-2xl max-w-lg w-full p-6 text-center relative overflow-hidden">
            {/* Top progress bar counting down 5s */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#E6DFD5]">
              <div
                className="h-full bg-[#8B1E21] transition-all duration-1000 ease-linear"
                style={{ width: `${(countdown / 5) * 100}%` }}
              />
            </div>

            <button
              onClick={() => setShowOrderModal(false)}
              className="absolute top-3 right-3 text-[#7B6F66] hover:text-[#8B1E21] p-1 transition-colors"
              title="Đóng thông báo"
            >
              <X size={20} />
            </button>

            <div className="w-16 h-16 mx-auto mt-2 mb-3 bg-red-100 text-[#8B1E21] rounded-full flex items-center justify-center border-2 border-[#8B1E21]/20">
              <PhoneCall size={30} className="animate-pulse" />
            </div>

            <span className="seal-badge mb-2">TIẾP NHẬN ĐƠN HÀNG THÀNH CÔNG</span>

            <h2 className="font-serif text-[22px] sm:text-[24px] font-bold text-[#8B1E21] mt-1 mb-2">
              Xác Nhận Đặt Đồ Lễ Thành Công!
            </h2>

            <div className="bg-white border border-[#E6DFD5] rounded-md p-4 mb-4 text-left shadow-inner space-y-2">
              <p className="text-[14px] text-[#262626] font-medium leading-relaxed">
                Mã đơn hàng: <strong className="font-mono text-[#8B1E21]">{order.orderCode}</strong>
              </p>
              <div className="p-3 bg-[#FFF9E6] border border-[#E0C379] rounded text-[13.5px] text-[#5A3A00] leading-relaxed flex items-start gap-2.5">
                <Phone size={18} className="text-[#8B1E21] shrink-0 mt-0.5" />
                <div>
                  <strong>Bộ phận Nghệ nhân / Nhân viên xưởng sẽ gọi điện xác nhận</strong> theo số điện thoại{' '}
                  <span className="font-bold text-[#8B1E21]">{order.shippingAddress?.phone || 'của Quý khách'}</span>{' '}
                  trong ít phút để chốt chi tiết từng món đồ lễ, giờ hoàng đạo thụ lễ và sắp xếp xe mui kín chuyên biệt.
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="text-[12px] text-[#7B6F66] flex items-center gap-1">
                <Clock size={14} />
                <span>Tự động đóng sau <strong className="text-[#8B1E21]">{countdown}s</strong></span>
              </div>
              <button
                onClick={() => setShowOrderModal(false)}
                className="w-full sm:w-auto px-5 py-2.5 bg-[#8B1E21] hover:bg-[#9E2A2B] text-white text-[13.5px] font-semibold rounded-[3px] transition-colors shadow"
              >
                Tôi Đã Hiểu - Xem Đơn Hàng
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-[900px] mx-auto px-4 space-y-6">
        {/* Top Success Banner */}
        <div className="bg-white border-2 border-[#C59B27] p-6 rounded-[4px] shadow-antique-card text-center space-y-2 no-print">
          <div className="w-14 h-14 rounded-full bg-green-50 text-green-700 flex items-center justify-center mx-auto border border-green-200">
            <CheckCircle2 size={32} />
          </div>
          <span className="seal-badge">ĐƠN HÀNG THƯƠNG MẠI ĐÃ XÁC NHẬN</span>
          <h1 className="font-serif text-[26px] font-bold text-[#262626]">
            Cảm Ơn Quý Khách Đã Đặt Đồ Lễ
          </h1>
          <p className="text-[13.5px] text-[#584140] max-w-md mx-auto">
            Mã đơn hàng: <strong className="font-mono text-[#8B1E21]">{order.orderCode}</strong>. Xưởng Hàng Mã đang chuẩn bị nan giang và giấy dó để bao gói xe mui kín.
          </p>
          <div className="pt-2 text-[13px] text-[#8C6D18] flex items-center justify-center gap-1.5 font-medium">
            <Phone size={14} />
            <span>Nhân viên xưởng sẽ sớm gọi điện tới số {order.shippingAddress?.phone} để xác nhận giao hàng.</span>
          </div>
        </div>

        {/* Action Toolbar for Invoice Export */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 border border-[#E6DFD5] rounded-[4px] shadow-sm no-print">
          <div className="text-[13px] text-[#584140]">
            Tra cứu, in ấn và lưu trữ hóa đơn đồ lễ:
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintInvoice}
              className="px-3.5 py-2 bg-white border border-[#C59B27] text-[#8B1E21] hover:bg-[#F9F4E8] text-[13px] font-semibold rounded-[3px] flex items-center gap-2 transition-colors shadow-sm"
              title="In hoặc Lưu hóa đơn dạng PDF"
            >
              <Printer size={15} />
              <span>Xuất / In Hóa Đơn (PDF)</span>
            </button>
            <button
              onClick={handleDownloadTxtInvoice}
              className="px-3.5 py-2 bg-[#8B1E21] hover:bg-[#9E2A2B] text-white text-[13px] font-semibold rounded-[3px] flex items-center gap-2 transition-colors shadow-sm"
              title="Tải tệp văn bản hóa đơn về máy"
            >
              <Download size={15} />
              <span>Tải Hóa Đơn</span>
            </button>
          </div>
        </div>

        {/* Invoice Card */}
        <div className="bg-white border border-[#E6DFD5] p-6 sm:p-8 rounded-[4px] shadow-antique-card space-y-6 printable-invoice">
          {/* Printable Workshop Header */}
          <div className="pb-4 border-b-2 border-[#8B1E21] flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <div className="font-serif text-[18px] sm:text-[20px] font-bold text-[#8B1E21] tracking-wide uppercase">
                Xưởng Thủ Công Truyền Thống Hàng Mã Tuyết Mã
              </div>
              <div className="text-[12px] text-[#584140] mt-0.5">
                Làng nghề Thường Tín & 48 Phố Hàng Mã, Hoàn Kiếm, Hà Nội
              </div>
              <div className="text-[12px] text-[#584140]">
                Hotline Thợ Cả: <strong>0396.163.773</strong> | Xe mui kín vận chuyển chuyên biệt
              </div>
            </div>
            <div className="text-left sm:text-right">
              <span className="seal-badge">HÓA ĐƠN GIAO HÀNG ĐỒ LỄ</span>
              <div className="font-mono text-[14px] font-bold text-[#8B1E21] mt-1">
                {order.orderCode}
              </div>
            </div>
          </div>

          <div className="flex justify-between items-start pb-2 border-b border-[#E6DFD5]">
            <div>
              <div className="text-[11px] font-bold text-[#8C6D18] tracking-widest uppercase">
                CHI TIẾT ĐƠN ĐỒ LỄ
              </div>
              <div className="font-serif text-[17px] font-semibold text-[#262626] mt-0.5">
                Ngày đặt: {new Date(order.createdAt).toLocaleString('vi-VN')}
              </div>
            </div>
            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-amber-50 text-amber-800 border border-amber-300 rounded text-[12px] font-semibold">
                TRẠNG THÁI: {getStatusText(order.orderStatus)}
              </span>
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full text-left text-[13.5px]">
            <thead>
              <tr className="border-b border-[#E6DFD5] bg-[#FAF7F2] text-[#3E2723]">
                <th className="py-2.5 px-3">Linh Phẩm</th>
                <th className="py-2.5 px-3 text-center">Đơn Giá</th>
                <th className="py-2.5 px-3 text-center">Số Lượng</th>
                <th className="py-2.5 px-3 text-right">Thành Tiền</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6DFD5]">
              {order.items?.map((it, idx) => (
                <tr key={idx}>
                  <td className="py-3 px-3 font-medium text-[#262626]">{it.productName}</td>
                  <td className="py-3 px-3 text-center text-[#584140]">
                    {Number(it.price).toLocaleString('vi-VN')} đ
                  </td>
                  <td className="py-3 px-3 text-center font-bold text-[#8B1E21]">x{it.quantity}</td>
                  <td className="py-3 px-3 text-right font-semibold text-[#262626]">
                    {Number(it.price * it.quantity).toLocaleString('vi-VN')} đ
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="pt-4 border-t border-[#E6DFD5] space-y-2 text-[14px] max-w-xs ml-auto">
            <div className="flex justify-between text-[#584140]">
              <span>Tiền linh phẩm:</span>
              <span>{Number(order.itemsTotal).toLocaleString('vi-VN')} đ</span>
            </div>
            {order.craftFee > 0 && (
              <div className="flex justify-between text-[#584140]">
                <span>Công nghệ nhân:</span>
                <span>{Number(order.craftFee).toLocaleString('vi-VN')} đ</span>
              </div>
            )}
            <div className="flex justify-between text-[#584140]">
              <span>Cước xe mui kín:</span>
              <span>{Number(order.shippingFee).toLocaleString('vi-VN')} đ</span>
            </div>
            <div className="flex justify-between text-[17px] font-bold text-[#8B1E21] pt-2 border-t border-[#E6DFD5]">
              <span>Tổng thanh toán:</span>
              <span>{Number(order.totalAmount).toLocaleString('vi-VN')} đ</span>
            </div>
          </div>

          {/* Shipping Details */}
          <div className="p-4 bg-[#FAF7F2] border border-[#E6DFD5] rounded-[4px] grid grid-cols-1 sm:grid-cols-2 gap-4 text-[13px]">
            <div>
              <div className="font-semibold text-[#8B1E21] mb-1">Địa chỉ nhận đồ lễ:</div>
              <div>{order.shippingAddress?.fullName} - {order.shippingAddress?.phone}</div>
              <div>{order.shippingAddress?.address}, {order.shippingAddress?.city}</div>
              {order.shippingAddress?.deliveryDate && (
                <div className="mt-1 text-[#8C6D18]">
                  <strong>Giờ hoàng đạo:</strong> {order.shippingAddress.deliveryDate}
                </div>
              )}
            </div>
            <div>
              <div className="font-semibold text-[#8B1E21] mb-1">Phương thức thanh toán:</div>
              <div>{order.paymentMethod === 'BANK_TRANSFER' ? 'Chuyển khoản VietQR' : 'Thanh toán khi nhận đồ lễ (COD)'}</div>
              <div className="text-[12px] text-[#584140] mt-0.5">
                Tình trạng: <strong>{getStatusText(order.paymentStatus)}</strong>
              </div>
            </div>
          </div>

          {/* Invoice Footer with Official Seal & Signatures */}
          <div className="pt-6 border-t border-[#E6DFD5] mt-6">
            <div className="text-[12px] italic text-[#584140] text-center mb-6">
              * Ghi chú: Đồ mã thủ công truyền thống được bao gói cẩn trọng và vận chuyển bằng xe mui kín chuyên biệt. Quý khách vui lòng đồng kiểm số lượng và quy cách linh phẩm khi bàn giao.
            </div>

            <div className="grid grid-cols-2 gap-8 text-center text-[13px] text-[#262626]">
              <div>
                <div className="font-bold uppercase text-[#8B1E21]">Người Nhận Đồ Lễ</div>
                <div className="text-[11px] text-[#7B6F66] italic">(Ký và ghi rõ họ tên)</div>
                <div className="h-16 flex items-end justify-center font-medium text-[#262626]">
                  {order.shippingAddress?.fullName}
                </div>
              </div>

              <div className="relative">
                <div className="font-bold uppercase text-[#8B1E21]">Xưởng Hàng Mã Tuyết Mã</div>
                <div className="text-[11px] text-[#7B6F66] italic">(Thợ cả ký & đóng dấu xác nhận)</div>
                <div className="h-16 flex items-center justify-center relative">
                  {/* Red circular workshop seal */}
                  <div className="border-2 border-[#C0392B] text-[#C0392B] rounded-full w-24 h-24 flex flex-col items-center justify-center font-bold text-[8.5px] uppercase tracking-tighter transform -rotate-12 opacity-85 select-none p-1 shadow-sm">
                    <span className="text-[7.5px]">XƯỞNG HÀNG MÃ</span>
                    <span className="text-[9.5px] text-[#8B1E21]">★ TUYẾT MÃ ★</span>
                    <span className="text-[7px]">ĐÃ DUYỆT XUẤT XƯỞNG</span>
                    <span className="text-[6.5px]">THƯỜNG TÍN - HÀ NỘI</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="text-center pt-2 flex items-center justify-center gap-4 no-print">
          <button
            onClick={handlePrintInvoice}
            className="btn-secondary !py-2.5 !text-[14px]"
          >
            <Printer size={16} />
            <span>Xuất / In Hóa Đơn</span>
          </button>
          <Link to="/" className="btn-primary !py-2.5 !text-[14px]">
            Quay Về Trang Chủ
          </Link>
        </div>
      </div>
    </div>
  );
}
