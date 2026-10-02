import React, { useState } from 'react';
import { Phone, Send, CheckCircle2, Clock, ShieldCheck, Sparkles, User, Calendar, MessageSquare, AlertCircle } from 'lucide-react';

export default function ConsultationSection() {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    ritualType: 'Đàn Tứ Phủ & Lễ Mở Phủ',
    budget: 'Từ 5 - 15 triệu',
    preferredCallTime: 'Càng sớm càng tốt',
    note: '',
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Tùy chỉnh tự điền khi chọn "Mục khác"
  const [customRitual, setCustomRitual] = useState('');
  const [customCallTime, setCustomCallTime] = useState('');
  const [customBudget, setCustomBudget] = useState('');

  const OTHER_RITUAL = 'Mục khác (Tự điền khóa lễ / yêu cầu)...';
  const OTHER_CALL_TIME = 'Mục khác (Tự điền giờ thuận tiện)...';
  const OTHER_BUDGET = 'Mục khác (Tự điền ngân sách dự trù)...';

  const ritualOptions = [
    'Đàn Tứ Phủ & Lễ Mở Phủ',
    'Lễ Tiết Bốn Mùa / Rằm Tháng Bảy',
    'Lễ Gia Tiên & Bản Thổ Chu Niên',
    'Lễ Động Thổ, Cất Nóc, Khai Trương',
    'Lễ Tạ 3 Năm & Cải Táng Sang Cát',
    'Chế tác đồ mã thủ công theo kích thước riêng',
    'Cần thợ cả tư vấn mâm lễ phù hợp phong tục',
    OTHER_RITUAL,
  ];

  const budgetOptions = [
    'Dưới 3 triệu (Lễ gia tiên tiết chế)',
    'Từ 3 - 7 triệu (Lễ tạ/Lễ bản thổ chu tất)',
    'Từ 7 - 15 triệu (Đàn tràng tiêu chuẩn)',
    'Trên 15 triệu (Đại lễ & Chế tác kỳ công)',
    'Cần tư vấn ngân sách tối ưu theo nhu cầu',
    OTHER_BUDGET,
  ];

  const callTimeOptions = [
    'Càng sớm càng tốt',
    'Buổi sáng (08:00 - 11:30)',
    'Buổi chiều (13:30 - 17:30)',
    'Buổi tối (18:30 - 21:00)',
    'Ngày cuối tuần',
    OTHER_CALL_TIME,
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      setError('Vui lòng nhập họ và tên của quý khách.');
      return;
    }
    if (!formData.phone.trim()) {
      setError('Vui lòng nhập số điện thoại để Thợ cả liên hệ.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const finalRitual =
        formData.ritualType === OTHER_RITUAL
          ? (customRitual.trim() || 'Khóa lễ tự điền')
          : formData.ritualType;

      const finalCallTime =
        formData.preferredCallTime === OTHER_CALL_TIME
          ? (customCallTime.trim() || 'Giờ hẹn tự điền')
          : formData.preferredCallTime;

      const finalBudget =
        formData.budget === OTHER_BUDGET
          ? (customBudget.trim() || 'Ngân sách tự điền')
          : formData.budget;

      const res = await fetch('/api/consultations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          ritualType: finalRitual,
          preferredCallTime: finalCallTime,
          budget: finalBudget,
          source: 'HOMEPAGE_SECTION',
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(true);
      } else {
        setError(data.message || 'Có lỗi xảy ra, vui lòng thử lại.');
      }
    } catch (err) {
      setError('Lỗi kết nối máy chủ. Vui lòng gọi trực tiếp hotline 0396.163.773.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSuccess(false);
    setCustomRitual('');
    setCustomCallTime('');
    setCustomBudget('');
    setFormData({
      fullName: '',
      phone: '',
      ritualType: 'Đàn Tứ Phủ & Lễ Mở Phủ',
      budget: 'Từ 5 - 15 triệu',
      preferredCallTime: 'Càng sớm càng tốt',
      note: '',
    });
  };

  return (
    <section id="dang-ky-tu-van" className="py-12 sm:py-16 lg:py-20 bg-gradient-to-b from-[#2B1D16] to-[#1E120D] text-[#FAF7F2] relative overflow-hidden">
      {/* Background Motifs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#C59B27]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#8B1E21]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-[1320px] mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          {/* Cột trái: Giới thiệu dịch vụ tư vấn */}
          <div className="lg:col-span-5 space-y-5 sm:space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-400/10 border border-amber-400/30 rounded-full text-amber-300 text-xs font-semibold tracking-wider uppercase">
              <Sparkles size={14} className="text-amber-400" />
              <span>Dịch Vụ Tư Vấn Đàn Lễ Cổ Truyền</span>
            </div>

            <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight text-amber-100">
              Để Lại Thông Tin <br className="hidden sm:inline" />
              <span className="text-[#E5B54F]">Thợ Cả Gọi Lại Tư Vấn</span>
            </h2>

            <p className="text-stone-300 text-sm sm:text-base leading-relaxed">
              Mỗi bản đền, bản phủ hay gia đạo đều có nghi thức và lề lối riêng. Quý khách chỉ cần để lại số điện thoại, nghệ nhân thợ cả phố Hàng Mã sẽ trực tiếp gọi điện, tư vấn tỉ mỉ về quy chuẩn, kích thước mâm lễ và báo giá gốc tại xưởng hoàn toàn miễn phí.
            </p>

            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3.5 bg-black/20 p-3.5 rounded-lg border border-amber-500/20">
                <div className="w-9 h-9 rounded-md bg-amber-400/10 flex items-center justify-center text-amber-400 flex-shrink-0 mt-0.5">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Chuẩn Lề Lối & Thanh Sạch</h4>
                  <p className="text-xs text-stone-300 mt-0.5">Tư vấn đúng khoa nghi cổ truyền, không vẽ vời phát sinh chi phí.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 bg-black/20 p-3.5 rounded-lg border border-amber-500/20">
                <div className="w-9 h-9 rounded-md bg-amber-400/10 flex items-center justify-center text-amber-400 flex-shrink-0 mt-0.5">
                  <Clock size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Phản Hồi Nhanh Trong 15 Phút</h4>
                  <p className="text-xs text-stone-300 mt-0.5">Đội ngũ thợ cả túc trực tiếp nhận và gọi lại theo khung giờ thuận tiện nhất.</p>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <div className="text-stone-400 text-xs">Cần hỗ trợ hỏa tốc?</div>
                <a
                  href="tel:0396163773"
                  className="inline-flex items-center gap-1.5 text-amber-400 hover:text-amber-300 text-sm font-bold transition-colors"
                >
                  <Phone size={15} />
                  <span>0396.163.773</span>
                </a>
              </div>
            </div>
          </div>

          {/* Cột phải: Form nhập thông tin */}
          <div className="lg:col-span-7">
            <div className="bg-[#FAF7F2] text-[#262626] rounded-xl p-4 sm:p-6 lg:p-8 shadow-2xl border-2 border-[#C59B27]/40 relative">
              {/* Trang trí góc cổ truyền */}
              <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-[#8B1E21]" />
              <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-[#8B1E21]" />
              <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-[#8B1E21]" />
              <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-[#8B1E21]" />

              {success ? (
                <div className="py-8 text-center space-y-4">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle2 size={36} />
                  </div>
                  <h3 className="font-serif text-2xl font-bold text-[#8B1E21]">
                    Gửi Thông Tin Thành Công!
                  </h3>
                  <div className="max-w-md mx-auto text-sm text-[#584140] leading-relaxed">
                    Cảm tạ quý khách <strong>{formData.fullName}</strong> đã tin tưởng xưởng Phố Hàng Mã. Thợ cả sẽ liên hệ theo số <strong>{formData.phone}</strong> vào khung giờ quý khách đã chọn để tư vấn chu toàn.
                  </div>
                  <div className="pt-4">
                    <button
                      onClick={resetForm}
                      className="px-6 py-2.5 bg-[#8B1E21] hover:bg-[#A32427] text-white text-xs font-bold rounded shadow transition-colors"
                    >
                      Gửi Thêm Yêu Cầu Khác
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="border-b border-[#E6DFD5] pb-3 mb-4">
                    <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#8B1E21] flex items-center gap-2">
                      <span>Phiếu Đăng Ký Tư Vấn Đàn Lễ</span>
                    </h3>
                    <p className="text-xs text-[#6B5A55] mt-1">
                      Điền thông tin bên dưới, thợ cả sẽ gọi lại phân tích và báo giá minh bạch.
                    </p>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md flex items-center gap-2">
                      <AlertCircle size={16} className="flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Họ và tên */}
                    <div>
                      <label className="block text-xs font-bold text-[#3E2723] uppercase tracking-wider mb-1.5">
                        Họ và tên quý khách <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <User size={16} className="absolute left-3 top-3 text-stone-400" />
                        <input
                          type="text"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleChange}
                          placeholder="Ví dụ: Bác Trần Văn Nam / Cô Minh"
                          className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#D5CCC1] rounded text-sm text-[#262626] focus:outline-none focus:border-[#8B1E21] focus:ring-1 focus:ring-[#8B1E21]"
                          required
                        />
                      </div>
                    </div>

                    {/* Số điện thoại */}
                    <div>
                      <label className="block text-xs font-bold text-[#3E2723] uppercase tracking-wider mb-1.5">
                        Số điện thoại nhận tư vấn <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Phone size={16} className="absolute left-3 top-3 text-stone-400" />
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="Ví dụ: 0988 123 456"
                          className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#D5CCC1] rounded text-sm text-[#262626] focus:outline-none focus:border-[#8B1E21] focus:ring-1 focus:ring-[#8B1E21]"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Loại lễ / Nhu cầu tư vấn */}
                    <div>
                      <label className="block text-xs font-bold text-[#3E2723] uppercase tracking-wider mb-1.5">
                        Khóa lễ / Nhu cầu tư vấn
                      </label>
                      <select
                        name="ritualType"
                        value={formData.ritualType}
                        onChange={handleChange}
                        className="w-full px-3 py-2.5 bg-white border border-[#D5CCC1] rounded text-sm text-[#262626] focus:outline-none focus:border-[#8B1E21] focus:ring-1 focus:ring-[#8B1E21]"
                      >
                        {ritualOptions.map((opt, idx) => (
                          <option key={idx} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>

                      {formData.ritualType === OTHER_RITUAL && (
                        <div className="mt-2 animate-fadeIn">
                          <input
                            type="text"
                            value={customRitual}
                            onChange={(e) => setCustomRitual(e.target.value)}
                            placeholder="👉 Nhập cụ thể khóa lễ hoặc nhu cầu của quý khách..."
                            autoFocus
                            required
                            className="w-full px-3 py-2 bg-amber-50/70 border-2 border-amber-500 rounded text-sm text-[#262626] placeholder:text-stone-400 focus:outline-none focus:border-[#8B1E21] shadow-xs"
                          />
                        </div>
                      )}
                    </div>

                    {/* Khung giờ tiện nhận cuộc gọi */}
                    <div>
                      <label className="block text-xs font-bold text-[#3E2723] uppercase tracking-wider mb-1.5">
                        Thời gian tiện nghe máy
                      </label>
                      <div className="relative">
                        <Clock size={16} className="absolute left-3 top-3 text-stone-400 pointer-events-none" />
                        <select
                          name="preferredCallTime"
                          value={formData.preferredCallTime}
                          onChange={handleChange}
                          className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#D5CCC1] rounded text-sm text-[#262626] focus:outline-none focus:border-[#8B1E21] focus:ring-1 focus:ring-[#8B1E21]"
                        >
                          {callTimeOptions.map((opt, idx) => (
                            <option key={idx} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>

                      {formData.preferredCallTime === OTHER_CALL_TIME && (
                        <div className="mt-2 animate-fadeIn">
                          <input
                            type="text"
                            value={customCallTime}
                            onChange={(e) => setCustomCallTime(e.target.value)}
                            placeholder="👉 Nhập thời gian cụ thể (ví dụ: sau 19h tối nay)..."
                            autoFocus
                            required
                            className="w-full px-3 py-2 bg-amber-50/70 border-2 border-amber-500 rounded text-sm text-[#262626] placeholder:text-stone-400 focus:outline-none focus:border-[#8B1E21] shadow-xs"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Khoảng ngân sách dự kiến */}
                    <div>
                      <label className="block text-xs font-bold text-[#3E2723] uppercase tracking-wider mb-1.5">
                        Khoảng ngân sách dự trù
                      </label>
                      <select
                        name="budget"
                        value={formData.budget}
                        onChange={handleChange}
                        className="w-full px-3 py-2.5 bg-white border border-[#D5CCC1] rounded text-sm text-[#262626] focus:outline-none focus:border-[#8B1E21] focus:ring-1 focus:ring-[#8B1E21]"
                      >
                        {budgetOptions.map((opt, idx) => (
                          <option key={idx} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>

                      {formData.budget === OTHER_BUDGET && (
                        <div className="mt-2 animate-fadeIn">
                          <input
                            type="text"
                            value={customBudget}
                            onChange={(e) => setCustomBudget(e.target.value)}
                            placeholder="👉 Nhập mức ngân sách dự kiến của quý khách..."
                            autoFocus
                            required
                            className="w-full px-3 py-2 bg-amber-50/70 border-2 border-amber-500 rounded text-sm text-[#262626] placeholder:text-stone-400 focus:outline-none focus:border-[#8B1E21] shadow-xs"
                          />
                        </div>
                      )}
                    </div>

                    {/* Địa chỉ / Khu vực tổ chức (tùy chọn) */}
                    <div>
                      <label className="block text-xs font-bold text-[#3E2723] uppercase tracking-wider mb-1.5">
                        Khu vực / Tỉnh thành tổ chức
                      </label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address || ''}
                        onChange={handleChange}
                        placeholder="Ví dụ: Hoàn Kiếm, Hà Nội hoặc Bắc Ninh..."
                        className="w-full px-3 py-2.5 bg-white border border-[#D5CCC1] rounded text-sm text-[#262626] focus:outline-none focus:border-[#8B1E21] focus:ring-1 focus:ring-[#8B1E21]"
                      />
                    </div>
                  </div>

                  {/* Ghi chú chi tiết */}
                  <div>
                    <label className="block text-xs font-bold text-[#3E2723] uppercase tracking-wider mb-1.5">
                      Ghi chú thêm về mâm lễ / Tâm nguyện riêng (nếu có)
                    </label>
                    <textarea
                      rows="2"
                      name="note"
                      value={formData.note}
                      onChange={handleChange}
                      placeholder="Ví dụ: Đàn tràng cần thêm ngựa tím Quan Lớn Tuần Tranh, giao trước 6h sáng ngày 15 âm lịch..."
                      className="w-full px-3 py-2 bg-white border border-[#D5CCC1] rounded text-sm text-[#262626] focus:outline-none focus:border-[#8B1E21] focus:ring-1 focus:ring-[#8B1E21] resize-none"
                    ></textarea>
                  </div>

                  {/* Nút gửi */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 bg-[#8B1E21] hover:bg-[#A32427] text-white font-bold text-sm tracking-wide uppercase rounded shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Đang gửi thông tin lên xưởng...</span>
                        </>
                      ) : (
                        <>
                          <Send size={16} />
                          <span>Gửi Thông Tin Để Thợ Cả Gọi Lại Tư Vấn</span>
                        </>
                      )}
                    </button>
                    <p className="text-[11px] text-center text-[#735F5B] mt-2 italic">
                      * Cam kết bảo mật thông tin gia chủ · Tư vấn thành tâm không chèo kéo
                    </p>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
