import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Phone, X, Send, CheckCircle2, Clock, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';

export default function QuickConsultModal() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [ritualType, setRitualType] = useState('Đàn Tứ Phủ & Lễ Mở Phủ');
  const [customRitual, setCustomRitual] = useState('');
  const [preferredCallTime, setPreferredCallTime] = useState('Càng sớm càng tốt');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const { showToast } = useNotification();

  // Lắng nghe sự kiện mở modal từ mọi nơi trong app
  useEffect(() => {
    const handleOpen = (e) => {
      if (e.detail?.ritualType) {
        setRitualType(e.detail.ritualType);
      }
      setIsOpen(true);
    };
    window.addEventListener('open-consult-modal', handleOpen);
    return () => window.removeEventListener('open-consult-modal', handleOpen);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Vui lòng nhập họ và tên của quý khách.');
      return;
    }
    if (!phone.trim()) {
      setError('Vui lòng nhập số điện thoại để Thợ cả gọi lại.');
      return;
    }

    if (ritualType === 'KHAC' && !customRitual.trim()) {
      setError('Vui lòng nhập khóa lễ hoặc nhu cầu quý khách cần tư vấn.');
      return;
    }

    setLoading(true);
    setError('');

    const finalRitualType =
      ritualType === 'KHAC'
        ? (customRitual.trim() ? `Khác: ${customRitual.trim()}` : 'Khác (Theo nhu cầu riêng)')
        : ritualType;

    try {
      const res = await fetch('/api/consultations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          phone,
          ritualType: finalRitualType,
          preferredCallTime,
          note,
          source: 'QUICK_MODAL_WIDGET',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        if (showToast) {
          showToast({
            type: 'success',
            title: 'Tiếp nhận yêu cầu tư vấn',
            message: 'Thợ cả xưởng Phố Hàng Mã đã nhận thông tin và sẽ gọi lại cho bạn sớm!',
            duration: 4500,
          });
        }
      } else {
        setError(data.message || 'Có lỗi xảy ra, vui lòng thử lại');
      }
    } catch (err) {
      setError('Lỗi kết nối máy chủ. Vui lòng gọi trực tiếp hotline 0396.163.773.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => {
      setSuccess(false);
      setError('');
      setFullName('');
      setPhone('');
      setNote('');
      setCustomRitual('');
    }, 300);
  };

  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <>
      {/* Đã gỡ bỏ nút nổi theo yêu cầu người dùng - form đã được đưa thành bảng trực tiếp trên màn hình web */}

      {/* 2. MODAL FORM ĐỂ LẠI THÔNG TIN */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div
            className="bg-[#FAF7F2] w-full max-w-md rounded-xl shadow-2xl border-2 border-[#C59B27] overflow-hidden relative animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="bg-[#8B1E21] text-white p-4 sm:p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-amber-400 text-stone-900 flex items-center justify-center flex-shrink-0">
                  <Phone size={16} />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold leading-tight text-amber-200">
                    Đăng Ký Tư Vấn Đàn Lễ
                  </h3>
                  <p className="text-[11px] text-amber-100/80">
                    Nghệ nhân Thợ Cả Hàng Mã sẽ gọi lại chu tất
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body Modal */}
            <div className="p-5 sm:p-6">
              {success ? (
                <div className="text-center py-6 space-y-3">
                  <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 size={32} />
                  </div>
                  <h4 className="font-serif text-xl font-bold text-[#8B1E21]">
                    Gửi Thông Tin Thành Công!
                  </h4>
                  <p className="text-xs text-stone-600 leading-relaxed max-w-xs mx-auto">
                    Cảm tạ <strong>{fullName}</strong>. Thợ cả xưởng Phố Hàng Mã sẽ xem xét và gọi lại ngay qua số <strong>{phone}</strong>.
                  </p>
                  <div className="pt-3">
                    <button
                      onClick={handleClose}
                      className="px-6 py-2 bg-[#8B1E21] text-white text-xs font-bold rounded shadow hover:bg-[#A32427] transition-colors"
                    >
                      Đã Hiểu
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3.5">
                  {error && (
                    <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded flex items-center gap-2">
                      <AlertCircle size={14} className="flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                      Họ và tên của quý khách <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Bác Nam / Cô Lan..."
                      className="w-full px-3 py-2 bg-white border border-stone-300 rounded text-xs text-stone-900 focus:outline-none focus:border-[#8B1E21]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                      Số điện thoại nhận cuộc gọi <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Số điện thoại nhận tư vấn..."
                      className="w-full px-3 py-2 bg-white border border-stone-300 rounded text-xs text-stone-900 focus:outline-none focus:border-[#8B1E21]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                      Khóa lễ quan tâm
                    </label>
                    <select
                      value={ritualType}
                      onChange={(e) => setRitualType(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-stone-300 rounded text-xs text-stone-900 focus:outline-none focus:border-[#8B1E21]"
                    >
                      <option value="Đàn Tứ Phủ & Lễ Mở Phủ">Đàn Tứ Phủ & Lễ Mở Phủ</option>
                      <option value="Lễ Tiết Bốn Mùa / Rằm Tháng Bảy">Lễ Tiết Bốn Mùa / Rằm Tháng Bảy</option>
                      <option value="Lễ Gia Tiên & Bản Thổ Chu Niên">Lễ Gia Tiên & Bản Thổ Chu Niên</option>
                      <option value="Lễ Khai Trương, Cất Nóc, Động Thổ">Lễ Khai Trương, Cất Nóc, Động Thổ</option>
                      <option value="Chế tác đồ mã thủ công theo yêu cầu">Chế tác đồ mã thủ công theo yêu cầu</option>
                      <option value="Tư vấn tổng thể mâm lễ phong tục">Tư vấn tổng thể mâm lễ phong tục</option>
                      <option value="KHAC">Khác (Tự điền theo nhu cầu...)</option>
                    </select>

                    {/* Ô nhập tùy chỉnh khi chọn Khác */}
                    {ritualType === 'KHAC' && (
                      <div className="mt-2">
                        <input
                          type="text"
                          value={customRitual}
                          onChange={(e) => setCustomRitual(e.target.value)}
                          placeholder="Nhập khóa lễ hoặc nhu cầu quý khách cần tư vấn..."
                          className="w-full px-3 py-2 bg-amber-50/60 border border-amber-400 rounded text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-[#8B1E21] focus:ring-1 focus:ring-[#8B1E21]"
                          autoFocus
                          required
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                      Thời gian tiện nghe máy
                    </label>
                    <select
                      value={preferredCallTime}
                      onChange={(e) => setPreferredCallTime(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-stone-300 rounded text-xs text-stone-900 focus:outline-none focus:border-[#8B1E21]"
                    >
                      <option value="Càng sớm càng tốt">Càng sớm càng tốt</option>
                      <option value="Buổi sáng (08:00 - 11:30)">Buổi sáng (08:00 - 11:30)</option>
                      <option value="Buổi chiều (13:30 - 17:30)">Buổi chiều (13:30 - 17:30)</option>
                      <option value="Buổi tối (18:30 - 21:00)">Buổi tối (18:30 - 21:00)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                      Ghi chú thêm (nếu có)
                    </label>
                    <textarea
                      rows="2"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Ghi chú về ngày giờ cúng, kích thước hoặc yêu cầu riêng..."
                      className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded text-xs text-stone-900 focus:outline-none focus:border-[#8B1E21] resize-none"
                    ></textarea>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2.5 bg-[#8B1E21] hover:bg-[#A32427] text-white font-bold text-xs uppercase tracking-wider rounded shadow transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Đang gửi...</span>
                        </>
                      ) : (
                        <>
                          <Send size={14} />
                          <span>Đăng Ký Gọi Lại Tư Vấn</span>
                        </>
                      )}
                    </button>
                    <p className="text-[10px] text-center text-stone-500 mt-1.5 italic">
                      * Thợ cả sẽ gọi trực tiếp hỗ trợ, hoàn toàn miễn phí
                    </p>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
