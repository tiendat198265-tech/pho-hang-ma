import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SlidersHorizontal, ArrowRight, Sparkles, CheckCircle, Truck, Hammer, FileText } from 'lucide-react';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await fetch('/api/templates');
        const data = await res.json();
        if (data.success) {
          setTemplates(data.data);
        }
      } catch (err) {
        console.error('Error fetching templates:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
  }, []);

  const categories = ['ALL', ...new Set(templates.map((t) => t.category).filter(Boolean))];

  const filteredTemplates =
    selectedCategory === 'ALL'
      ? templates
      : templates.filter((t) => t.category === selectedCategory);

  return (
    <div className="w-full bg-[#FAF7F2] min-h-screen pb-20">
      {/* 1. Header Banner */}
      <div className="bg-[#F4EFEB] border-b border-[#E6DFD5] py-12">
        <div className="max-w-[1320px] mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F9F4E8] border border-[#C59B27] rounded-[3px] mb-3">
            <Sparkles size={14} className="text-[#8B1E21]" />
            <span className="text-[11px] font-bold text-[#8B1E21] tracking-wider uppercase">
              DANH MỤC MẪU THAM KHẢO
            </span>
          </div>

          <h1 className="font-serif text-[32px] sm:text-[42px] font-bold text-[#262626]">
            Các Bộ Mẫu Đàn Phủ Quy Chuẩn
          </h1>

          <p className="text-[15px] text-[#584140] max-w-[680px] mx-auto mt-2 leading-relaxed">
            Hệ thống mẫu đàn tràng và mâm lễ cổ truyền chuẩn mực. Quý khách có thể lựa chọn nguyên bộ hoặc tùy biến các thành phần linh vật, mũ nón, vàng mã theo đúng nhu cầu và phong tục riêng.
          </p>
        </div>
      </div>

      {/* 2. Quy Trình 4 Bước Đặt Hàng Theo Mẫu (Bám sát Stitch) */}
      <div className="max-w-[1320px] mx-auto px-4 -mt-6">
        <div className="bg-white border border-[#E6DFD5] rounded-[4px] p-6 shadow-antique-card grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-full bg-[#8B1E21] text-white flex items-center justify-center font-bold text-[14px] flex-shrink-0">
              1
            </div>
            <div>
              <h3 className="font-serif text-[15px] font-semibold text-[#262626]">Chọn Bộ Mẫu Chuẩn</h3>
              <p className="text-[12px] text-[#584140] mt-0.5">
                Chọn mẫu đàn Tứ Phủ hoặc bộ lễ theo dịp cần cúng tiến.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-full bg-[#C59B27] text-[#2B1D16] flex items-center justify-center font-bold text-[14px] flex-shrink-0">
              2
            </div>
            <div>
              <h3 className="font-serif text-[15px] font-semibold text-[#262626]">Tùy Biến Chi Tiết</h3>
              <p className="text-[12px] text-[#584140] mt-0.5">
                Thêm/bớt linh phẩm, chỉnh số lượng, ghi chú riêng và đính kèm ảnh mẫu.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-full bg-[#3E2723] text-white flex items-center justify-center font-bold text-[14px] flex-shrink-0">
              3
            </div>
            <div>
              <h3 className="font-serif text-[15px] font-semibold text-[#262626]">Nghệ Nhân Gia Công</h3>
              <p className="text-[12px] text-[#584140] mt-0.5">
                Thợ Cả tiếp nhận hồ sơ, gửi bảng báo giá chi tiết và tiến hành chế tác.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-full bg-[#5E1315] text-white flex items-center justify-center font-bold text-[14px] flex-shrink-0">
              4
            </div>
            <div>
              <h3 className="font-serif text-[15px] font-semibold text-[#262626]">Giao Xe Mui Kín</h3>
              <p className="text-[12px] text-[#584140] mt-0.5">
                Vận chuyển nguyên vẹn tận đền phủ, hỗ trợ sắp đặt linh mâm đúng giờ hoàng đạo.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Category Filter Tabs */}
      <div className="max-w-[1320px] mx-auto px-4 mt-12 mb-8">
        <div className="flex flex-wrap items-center justify-center gap-3">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-5 py-2 rounded-[3px] text-[13.5px] font-medium transition-all ${
                selectedCategory === cat
                  ? 'bg-[#8B1E21] text-white border border-[#5E1315] shadow-sm'
                  : 'bg-white border border-[#E6DFD5] text-[#3E2723] hover:border-[#C59B27]'
              }`}
            >
              {cat === 'ALL' ? 'Tất Cả Bộ Mẫu' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Templates Grid */}
      <div className="max-w-[1320px] mx-auto px-4">
        {loading ? (
          <div className="text-center py-20 text-[#584140]">Đang tải dữ liệu bộ mẫu từ MongoDB...</div>
        ) : filteredTemplates.length === 0 ? (
          <div className="text-center py-20 text-[#584140]">Chưa có bộ mẫu nào trong mục này.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredTemplates.map((tpl) => (
              <div key={tpl._id} className="card-frame bg-white flex flex-col justify-between overflow-hidden">
                <div>
                  {/* Thumbnail */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-[#FAF7F2]">
                    <img
                      src={tpl.thumbnail || 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&w=800&q=80'}
                      alt={tpl.name}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                    <div className="absolute top-3 left-3 bg-[#8B1E21] text-[#FAF7F2] text-[11px] font-semibold px-2.5 py-0.5 rounded-[2px]">
                      {tpl.category}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-6">
                    <h2 className="font-serif text-[21px] font-bold text-[#262626] mb-2 hover:text-[#8B1E21] transition-colors">
                      <Link to={`/bo-mau/${tpl.slug}`}>{tpl.name}</Link>
                    </h2>
                    <p className="text-[13.5px] text-[#584140] line-clamp-3 leading-relaxed">
                      {tpl.description || tpl.subtitle}
                    </p>

                    {/* Ritual Note / Guide */}
                    {tpl.ritualGuide && (
                      <div className="mt-4 p-2.5 bg-[#FAF7F2] border-l-2 border-[#C59B27] text-[12px] text-[#3E2723]">
                        <strong>Khoa nghi:</strong> {tpl.ritualGuide}
                      </div>
                    )}

                    {/* Items Breakdown list */}
                    <div className="mt-4 pt-3 border-t border-[#E6DFD5]">
                      <div className="text-[11.5px] font-bold text-[#8C6D18] tracking-wider uppercase mb-2">
                        Thành phần trong bộ ({tpl.items?.length || 0}):
                      </div>
                      <ul className="space-y-1.5 text-[12.5px] text-[#262626]">
                        {tpl.items?.slice(0, 4).map((it, idx) => (
                          <li key={idx} className="flex items-center justify-between">
                            <span className="truncate pr-2">
                              • {it.productNameSnapshot || it.productId?.name}
                            </span>
                            <span className="text-[#8B1E21] font-semibold flex-shrink-0">
                              x{it.defaultQuantity}
                            </span>
                          </li>
                        ))}
                        {(tpl.items?.length || 0) > 4 && (
                          <li className="text-[11.5px] text-[#8C6D18] italic">
                            + cùng {(tpl.items?.length || 0) - 4} thành phần phối vị khác...
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="p-6 pt-0 border-t border-[#E6DFD5] mt-4">
                  <div className="flex items-center justify-between py-3">
                    <span className="text-[12px] text-[#584140]">Hình thức giá:</span>
                    <div className="text-right">
                      {tpl.discountPrice > 0 ? (
                        <div className="flex items-center gap-1.5 justify-end">
                          <span className="text-[16px] font-bold text-[#8B1E21]">
                            {Number(tpl.discountPrice).toLocaleString('vi-VN')} đ
                          </span>
                          {tpl.basePrice > 0 && (
                            <span className="text-[11.5px] text-gray-400 line-through">
                              {Number(tpl.basePrice).toLocaleString('vi-VN')} đ
                            </span>
                          )}
                        </div>
                      ) : tpl.basePrice > 0 ? (
                        <span className="text-[16px] font-bold text-[#8B1E21]">
                          {Number(tpl.basePrice).toLocaleString('vi-VN')} đ
                        </span>
                      ) : (
                        <span className="text-[14px] font-medium text-[#8B1E21]">
                          Liên hệ để báo giá
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Link
                      to={`/bo-mau/${tpl.slug}`}
                      className="btn-secondary !py-2.5 justify-center text-[13px]"
                    >
                      Xem Chi Tiết
                    </Link>
                    <Link
                      to={`/tuy-chinh-mau/${tpl.slug}`}
                      className="btn-primary !py-2.5 justify-center text-[13px]"
                    >
                      <SlidersHorizontal size={15} />
                      <span>Tùy Chỉnh Mẫu</span>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
