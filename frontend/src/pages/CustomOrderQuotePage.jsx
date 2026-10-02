import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  ShieldCheck,
  Phone,
  ArrowRight,
  XCircle,
  FileCheck,
  AlertCircle,
  Printer,
  Hammer,
  Truck,
} from 'lucide-react';

export default function CustomOrderQuotePage() {
  const { code } = useParams();
  const navigate = useNavigate();

  const [searchCode, setSearchCode] = useState(code || '');
  const [requestData, setRequestData] = useState(null);
  const [loading, setLoading] = useState(Boolean(code));
  const [errorMsg, setErrorMsg] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchRequest = async (targetCode) => {
    if (!targetCode) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/custom-orders/code/${targetCode}`);
      const data = await res.json();
      if (data.success && data.data) {
        setRequestData(data.data);
      } else {
        setErrorMsg(data.message || 'Không tìm thấy hồ sơ yêu cầu với mã này');
        setRequestData(null);
      }
    } catch (err) {
      console.error('Lỗi tra cứu đơn:', err);
      setErrorMsg('Không thể kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (code) {
      fetchRequest(code);
    }
  }, [code]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchCode.trim()) {
      navigate(`/tra-cuu-bao-gia/${searchCode.trim()}`);
      fetchRequest(searchCode.trim());
    }
  };

  // Customer responds to quote (Accept / Reject)
  const handleQuoteResponse = async (action) => {
    if (!requestData?._id) return;
    const confirmMsg =
      action === 'ACCEPT'
        ? 'Bạn có chắc chắn muốn xác nhận đặt hàng theo bảng báo giá này không? Đơn hàng thương mại chính thức sẽ được khởi tạo.'
        : 'Bạn có chắc chắn muốn từ chối bảng báo giá này không?';

    if (!window.confirm(confirmMsg)) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/custom-orders/${requestData._id}/respond-quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        fetchRequest(requestData.requestCode);
      } else {
        alert(data.message || 'Lỗi xử lý phản hồi');
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi kết nối máy chủ');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'SUBMITTED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-50 text-amber-800 border border-amber-300 rounded text-[12px] font-semibold">
            <Clock size={14} /> ĐÃ TIẾP NHẬN HỒ SƠ
          </span>
        );
      case 'UNDER_REVIEW':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-800 border border-blue-300 rounded text-[12px] font-semibold">
            <Hammer size={14} /> THỢ CẢ ĐANG KHẢO GIÁ
          </span>
        );
      case 'QUOTED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-50 text-purple-800 border border-purple-300 rounded text-[12px] font-semibold">
            <FileCheck size={14} /> ĐÃ CÓ BÁO GIÁ · CHỜ XÁC NHẬN
          </span>
        );
      case 'CUSTOMER_ACCEPTED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-800 border border-green-300 rounded text-[12px] font-semibold">
            <CheckCircle2 size={14} /> ĐÃ XÁC NHẬN ĐẶT HÀNG
          </span>
        );
      case 'CUSTOMER_REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 border border-gray-300 rounded text-[12px] font-semibold">
            <XCircle size={14} /> KHÁCH ĐÃ TỪ CHỐI
          </span>
        );
      case 'IN_PRODUCTION':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-800 border border-indigo-300 rounded text-[12px] font-semibold">
            <Hammer size={14} /> ĐANG GIA CÔNG KHUNG GIANG BỒI DÓ
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded text-[12px] font-semibold">
            <Truck size={14} /> HOÀN TẤT & BÀN GIAO ĐÀN LỄ
          </span>
        );
      default:
        return <span className="seal-badge">{status}</span>;
    }
  };

  return (
    <div className="w-full bg-[#FAF7F2] min-h-screen py-10">
      <div className="max-w-[1100px] mx-auto px-4">
        {/* Lookup Box if no code */}
        {!code && (
          <div className="bg-white border border-[#E6DFD5] p-6 rounded-[4px] shadow-antique-card mb-8">
            <h1 className="font-serif text-[24px] font-bold text-[#262626] mb-2">
              Tra Cứu Hồ Sơ & Báo Giá Đàn Lễ
            </h1>
            <p className="text-[13.5px] text-[#584140] mb-4">
              Nhập mã yêu cầu (dạng <code className="text-[#8B1E21] font-mono">YC-YYYYMMDD-XXXX</code>) đã được cấp khi quý khách gửi yêu cầu đặt theo mẫu.
            </p>
            <form onSubmit={handleSearchSubmit} className="flex gap-3 max-w-md">
              <input
                type="text"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                placeholder="VD: YC-20260929-1234"
                className="flex-1 bg-[#FAF7F2] border border-[#D5CCC1] text-[14px] rounded px-3 py-2 font-mono uppercase focus:border-[#8B1E21] focus:outline-none"
              />
              <button type="submit" className="btn-primary !py-2">
                Tra Cứu
              </button>
            </form>
          </div>
        )}

        {loading && (
          <div className="py-20 text-center text-[#584140]">
            Đang tra cứu dữ liệu hồ sơ đàn lễ...
          </div>
        )}

        {errorMsg && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-[4px] flex items-center gap-2 mb-6">
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        {requestData && (
          <div className="space-y-8">
            {/* Top Status Header */}
            <div className="bg-white border-2 border-[#C59B27] p-6 rounded-[4px] shadow-antique-card">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-[#E6DFD5] gap-3">
                <div>
                  <div className="text-[12px] font-bold text-[#8C6D18] tracking-widest uppercase">
                    HỒ SƠ TIẾP NHẬN YÊU CẦU ĐÀN LỄ
                  </div>
                  <div className="font-mono text-[22px] font-bold text-[#8B1E21] mt-0.5">
                    {requestData.requestCode}
                  </div>
                </div>
                <div>{getStatusBadge(requestData.status)}</div>
              </div>

              {/* Success Message Banner */}
              <div className="mt-4 p-4 bg-[#F9F4E8] border border-[#C59B27] rounded-[3px] flex items-start gap-3">
                <CheckCircle2 size={20} className="text-[#8B1E21] flex-shrink-0 mt-0.5" />
                <div className="text-[13px] text-[#3E2723] leading-relaxed">
                  <strong>Hồ sơ đàn lễ đã được chuyển tới Thợ Cả phố Hàng Mã.</strong> Quý khách có thể theo dõi tiến độ khảo giá và duyệt đơn trực tiếp trên trang này hoặc qua điện thoại đã đăng ký.
                </div>
              </div>
            </div>

            {/* QUOTE SECTION (If status is QUOTED or later) */}
            {requestData.adminQuote?.finalQuote > 0 && (
              <div className="bg-white border-2 border-[#8B1E21] p-6 rounded-[4px] shadow-antique-card">
                <div className="flex items-center justify-between pb-3 border-b border-[#E6DFD5]">
                  <div>
                    <span className="seal-badge">BẢNG BÁO GIÁ CHÍNH THỨC TỪ THỢ CẢ</span>
                    <h2 className="font-serif text-[22px] font-bold text-[#262626] mt-1">
                      Chi Tiết Chiết Tính & Kinh Phí Đàn Lễ
                    </h2>
                  </div>
                  {requestData.adminQuote.validUntil && (
                    <div className="text-[12px] text-[#584140]">
                      Thời hạn báo giá:{' '}
                      <strong>{new Date(requestData.adminQuote.validUntil).toLocaleDateString('vi-VN')}</strong>
                    </div>
                  )}
                </div>

                {/* Breakdown Table */}
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-left text-[13.5px] border-collapse">
                    <tbody>
                      <tr className="border-b border-[#E6DFD5]">
                        <td className="py-2.5 px-3 text-[#584140]">Tiền linh phẩm đồ mã (vàng mã, mũ nón, ngựa, xe):</td>
                        <td className="py-2.5 px-3 text-right font-semibold text-[#262626]">
                          {Number(requestData.adminQuote.itemsTotal || 0).toLocaleString('vi-VN')} đ
                        </td>
                      </tr>
                      <tr className="border-b border-[#E6DFD5]">
                        <td className="py-2.5 px-3 text-[#584140]">Công nghệ nhân đan nan giang già & bồi giấy dó theo yêu cầu:</td>
                        <td className="py-2.5 px-3 text-right font-semibold text-[#262626]">
                          {Number(requestData.adminQuote.craftFee || 0).toLocaleString('vi-VN')} đ
                        </td>
                      </tr>
                      <tr className="border-b border-[#E6DFD5]">
                        <td className="py-2.5 px-3 text-[#584140]">Cước vận chuyển xe mui kín chuyên biệt bảo đảm nguyên vẹn:</td>
                        <td className="py-2.5 px-3 text-right font-semibold text-[#262626]">
                          {Number(requestData.adminQuote.shippingFee || 0).toLocaleString('vi-VN')} đ
                        </td>
                      </tr>
                      {requestData.adminQuote.discount > 0 && (
                        <tr className="border-b border-[#E6DFD5] text-[#8B1E21]">
                          <td className="py-2.5 px-3">Giảm trừ tri ân lễ đàn:</td>
                          <td className="py-2.5 px-3 text-right font-semibold">
                            -{Number(requestData.adminQuote.discount).toLocaleString('vi-VN')} đ
                          </td>
                        </tr>
                      )}
                      <tr className="bg-[#FAF7F2] font-bold text-[16px] text-[#8B1E21]">
                        <td className="py-3 px-3">TỔNG KINH PHÍ BÁO GIÁ:</td>
                        <td className="py-3 px-3 text-right text-[18px]">
                          {Number(requestData.adminQuote.finalQuote).toLocaleString('vi-VN')} đ
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Thợ Cả Note */}
                {requestData.adminQuote.customerNote && (
                  <div className="mt-4 p-3 bg-[#FAF7F2] border-l-4 border-[#8B1E21] text-[13px] text-[#3E2723]">
                    <strong>Ghi chú từ Thợ Cả:</strong> {requestData.adminQuote.customerNote}
                  </div>
                )}

                {/* Action Buttons for customer */}
                {requestData.status === 'QUOTED' && (
                  <div className="mt-6 pt-4 border-t border-[#E6DFD5] flex flex-col sm:flex-row items-center justify-end gap-3">
                    <button
                      onClick={() => handleQuoteResponse('REJECT')}
                      disabled={actionLoading}
                      className="px-5 py-2.5 border border-red-300 text-red-700 hover:bg-red-50 rounded-[4px] text-[13.5px] font-medium"
                    >
                      Từ Chối Báo Giá
                    </button>
                    <button
                      onClick={() => handleQuoteResponse('ACCEPT')}
                      disabled={actionLoading}
                      className="btn-primary text-[14px] px-6 py-2.5"
                    >
                      <CheckCircle2 size={16} />
                      <span>XÁC NHẬN ĐẶT HÀNG NGAY</span>
                    </button>
                  </div>
                )}

                {requestData.status === 'CUSTOMER_ACCEPTED' && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 text-green-800 rounded text-[13px]">
                    ✓ Quý khách đã xác nhận báo giá. Đơn hàng thương mại đã được kích hoạt và chuyển vào xưởng chế tác!
                  </div>
                )}
              </div>
            )}

            {/* 1. BẢNG TỔNG KẾT BỘ MẪU: ĐÀN TỨ PHỦ (ĐÃ TÙY CHỈNH) (Bám sát Stitch màn dfc1b559) */}
            <div className="bg-white border border-[#E6DFD5] p-6 rounded-[4px] shadow-antique-card">
              <h2 className="font-serif text-[20px] font-bold text-[#262626] mb-1">
                BẢNG TỔNG KẾT BỘ MẪU: {requestData.templateSnapshot?.templateName || 'ĐÀN LỄ'} (ĐÃ TÙY CHỈNH)
              </h2>
              <p className="text-[12.5px] text-[#584140] mb-4">
                So sánh các thành phần trong bộ mẫu gốc và những điều chỉnh của quý khách.
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px] border-collapse">
                  <thead>
                    <tr className="bg-[#FAF7F2] text-[#3E2723] border-b border-[#E6DFD5]">
                      <th className="py-2.5 px-3">STT</th>
                      <th className="py-2.5 px-3">Thành Phần Linh Phẩm</th>
                      <th className="py-2.5 px-3 text-center">Trạng Thái Tùy Chỉnh</th>
                      <th className="py-2.5 px-3 text-center">Số Lượng Đặt</th>
                      <th className="py-2.5 px-3">Ghi Chú Riêng</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6DFD5]">
                    {requestData.items?.map((it, idx) => (
                      <tr
                        key={idx}
                        className={it.removedFromTemplate ? 'bg-gray-50 opacity-40 line-through' : ''}
                      >
                        <td className="py-2.5 px-3 font-mono">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-medium text-[#262626]">
                          <div className="flex items-center gap-2">
                            {(it.customImage || it.referenceImages?.[0]?.url || it.productId?.thumbnail) && (
                              <img
                                src={it.customImage || it.referenceImages?.[0]?.url || it.productId?.thumbnail}
                                alt={it.productNameSnapshot}
                                className="w-8 h-8 rounded object-cover border border-[#E6DFD5] shrink-0"
                              />
                            )}
                            <div>
                              <div>{it.productNameSnapshot}</div>
                              {it.unit && (
                                <div className="text-[11px] text-[#584140] font-normal">ĐVT: {it.unit}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          {it.removedFromTemplate ? (
                            <span className="text-[11px] text-red-600 font-semibold">Đã loại bỏ</span>
                          ) : it.isCustomItem || (!it.productId && it.addedManually) ? (
                            <span className="text-[11px] text-purple-900 font-bold bg-purple-100 px-2 py-0.5 rounded border border-purple-300">
                              ✦ Tự yêu cầu riêng
                            </span>
                          ) : it.addedManually ? (
                            <span className="text-[11px] text-black font-bold">Thêm ngoài mẫu</span>
                          ) : it.originalQuantityInTemplate > 0 && it.quantity !== it.originalQuantityInTemplate ? (
                            <span className="text-[11px] text-blue-600 font-semibold">Đổi số lượng</span>
                          ) : (
                            <span className="text-[11px] text-green-700 font-semibold">Giữ nguyên mẫu</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-[#8B1E21]">
                          {it.removedFromTemplate ? '0' : `x${it.quantity}`}
                        </td>
                        <td className="py-2.5 px-3 text-[#584140] text-[12px]">
                          {it.note || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 2. Thông Tin Tiếp Nhận Đơn Lễ */}
            <div className="bg-white border border-[#E6DFD5] p-6 rounded-[4px] shadow-antique-card grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-serif text-[17px] font-bold text-[#262626] mb-3 pb-2 border-b border-[#E6DFD5]">
                  Thông Tin Tiếp Nhận Đơn Lễ
                </h3>
                <dl className="space-y-2 text-[13px]">
                  <div className="flex">
                    <dt className="w-36 text-[#584140]">Người đặt lễ:</dt>
                    <dd className="font-semibold text-[#262626]">{requestData.contactInfo?.fullName}</dd>
                  </div>
                  <div className="flex">
                    <dt className="w-36 text-[#584140]">Điện thoại liên hệ:</dt>
                    <dd className="font-semibold text-[#8B1E21]">{requestData.contactInfo?.phone}</dd>
                  </div>
                  {requestData.contactInfo?.email && (
                    <div className="flex">
                      <dt className="w-36 text-[#584140]">Email:</dt>
                      <dd className="text-[#262626]">{requestData.contactInfo?.email}</dd>
                    </div>
                  )}
                  <div className="flex">
                    <dt className="w-36 text-[#584140]">Ngày khai đàn / Cần hàng:</dt>
                    <dd className="font-medium text-[#262626]">
                      {requestData.contactInfo?.eventDate || 'Theo thỏa thuận với Thợ Cả'}
                    </dd>
                  </div>
                  <div className="flex">
                    <dt className="w-36 text-[#584140]">Địa chỉ lập đàn:</dt>
                    <dd className="text-[#262626]">
                      {requestData.contactInfo?.altarAddress || 'Nhận tại xưởng Hàng Mã'}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Notes & Reference Images */}
              <div>
                <h3 className="font-serif text-[17px] font-bold text-[#262626] mb-3 pb-2 border-b border-[#E6DFD5]">
                  Ghi Chú & Hình Ảnh Tham Khảo
                </h3>
                <div className="text-[13px] text-[#584140] mb-3">
                  <strong>Ghi chú chung:</strong>{' '}
                  {requestData.generalNotes ? (
                    <span className="italic text-[#262626]">{requestData.generalNotes}</span>
                  ) : (
                    <span className="text-gray-400">Không có</span>
                  )}
                </div>

                <div>
                  <div className="text-[12px] font-semibold text-[#3E2723] mb-1.5">
                    Hình ảnh đính kèm ({requestData.globalReferenceImages?.length || 0}):
                  </div>
                  {requestData.globalReferenceImages?.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {requestData.globalReferenceImages.map((img, idx) => (
                        <a
                          key={idx}
                          href={img.url}
                          target="_blank"
                          rel="noreferrer"
                          className="w-16 h-16 rounded border border-[#E6DFD5] overflow-hidden hover:opacity-80 transition-opacity"
                        >
                          <img src={img.url} alt="Tham khảo" className="w-full h-full object-cover" />
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[12px] text-gray-400 italic">Không có hình ảnh đính kèm</div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-4">
              <Link to="/bo-mau" className="btn-secondary !text-[13px]">
                Xem Thêm Mẫu Đàn Khác
              </Link>
              <a
                href="tel:0396163773"
                className="btn-primary !text-[13px]"
              >
                <Phone size={15} />
                <span>Liên Hệ Trực Tiếp Thợ Cả: 0396.163.773</span>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
