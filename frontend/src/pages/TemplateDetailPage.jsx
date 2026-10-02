import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { SlidersHorizontal, ArrowRight, ShieldCheck, Check, Sparkles, AlertCircle, X, ZoomIn, Image as ImageIcon } from 'lucide-react';

export default function TemplateDetailPage() {
  const { slug } = useParams();
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [isZoomed, setIsZoomed] = useState(false);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setZoomPos({ x, y });
  };

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [slug]);

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const res = await fetch(`/api/templates/${slug}`);
        const data = await res.json();
        if (data.success) {
          setTemplate(data.data);
          setSelectedImage(data.data.thumbnail || data.data.images?.[0] || '');
        }
      } catch (err) {
        console.error('Error fetching template detail:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTemplate();
  }, [slug]);

  if (loading) {
    return <div className="max-w-[1320px] mx-auto px-4 py-20 text-center text-[#584140]">Đang tải dữ liệu bộ mẫu...</div>;
  }

  if (!template) {
    return (
      <div className="max-w-[1320px] mx-auto px-4 py-20 text-center">
        <h2 className="font-serif text-[24px] font-bold text-[#8B1E21]">Không tìm thấy bộ mẫu này</h2>
        <Link to="/bo-mau" className="btn-secondary mt-4">
          Quay lại danh mục mẫu
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#FAF7F2] py-10 min-h-screen">
      <div className="max-w-[1320px] mx-auto px-4">
        {/* Breadcrumb */}
        <div className="text-[13px] text-[#584140] mb-6 flex items-center gap-2">
          <Link to="/" className="hover:text-[#8B1E21]">Trang Chủ</Link>
          <span>/</span>
          <Link to="/bo-mau" className="hover:text-[#8B1E21]">Bộ Mẫu Hàng Mã</Link>
          <span>/</span>
          <span className="text-[#262626] font-medium">{template.name}</span>
        </div>

        {/* Top Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 bg-white border border-[#E6DFD5] p-6 lg:p-8 rounded-[4px] shadow-antique-card">
          {/* Gallery Col */}
          <div className="lg:col-span-6 space-y-4">
            {(() => {
              const currentMainImage =
                selectedImage ||
                template.thumbnail ||
                template.images?.[0] ||
                'https://images.unsplash.com/photo-1582650625119-3a31f8fa2699?auto=format&fit=crop&w=1000&q=80';

              return (
                <>
                  <div
                    className="relative aspect-[4/3] rounded-[3px] overflow-hidden bg-[#FAF7F2] border border-[#E6DFD5] cursor-crosshair group shadow-xs select-none"
                    onMouseEnter={() => setIsZoomed(true)}
                    onMouseLeave={() => setIsZoomed(false)}
                    onMouseMove={handleMouseMove}
                    onClick={() => setPreviewImage({ url: currentMainImage, name: template.name })}
                    title="Rê chuột để soi chi tiết hoặc bấm để xem ảnh to"
                  >
                    <img
                      src={currentMainImage}
                      alt={template.name}
                      className={`w-full h-full object-cover transition-transform duration-150 ease-out pointer-events-none ${
                        isZoomed ? 'scale-[2.4]' : 'scale-100'
                      }`}
                      style={
                        isZoomed
                          ? {
                              transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                            }
                          : undefined
                      }
                    />

                    {/* Badge hướng dẫn khi chưa zoom */}
                    <div
                      className={`absolute bottom-3 right-3 bg-black/65 backdrop-blur-xs text-white text-[11px] px-2.5 py-1 rounded-full flex items-center gap-1.5 pointer-events-none transition-opacity duration-200 ${
                        isZoomed ? 'opacity-0' : 'opacity-90'
                      }`}
                    >
                      <ZoomIn size={13} className="text-[#C59B27]" />
                      <span>Rê chuột để phóng to chi tiết</span>
                    </div>

                    {/* Tag báo tỉ lệ phóng to */}
                    {isZoomed && (
                      <div className="absolute top-3 left-3 bg-[#8B1E21]/85 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded shadow pointer-events-none animate-fadeIn flex items-center gap-1">
                        <span>Phóng to 2.4x</span>
                      </div>
                    )}
                  </div>

                  {/* Thumbnail list if multiple images */}
                  {template.images?.length > 1 && (
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5">
                      {template.images.map((img, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedImage(img)}
                          className={`aspect-video rounded-[3px] overflow-hidden border transition-all cursor-pointer ${
                            currentMainImage === img
                              ? 'border-[#8B1E21] ring-2 ring-[#8B1E21]/30 shadow-xs'
                              : 'border-[#E6DFD5] opacity-75 hover:opacity-100 hover:border-[#8B1E21]'
                          }`}
                        >
                          <img
                            src={img}
                            alt={`${template.name} ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </>
              );
            })()}
          </div>

          {/* Details Col */}
          <div className="lg:col-span-6 flex flex-col justify-between">
            <div className="space-y-4">
              <span className="seal-badge">{template.category}</span>
              <h1 className="font-serif text-[28px] sm:text-[34px] font-bold text-[#262626] leading-tight">
                {template.name}
              </h1>
              <p className="text-[15px] text-[#584140] leading-relaxed">
                {template.description || template.subtitle}
              </p>

              {template.ritualGuide && (
                <div className="p-3.5 bg-[#F9F4E8] border-l-4 border-[#C59B27] text-[13px] text-[#3E2723]">
                  <strong className="block text-[#8B1E21] mb-1">Hướng dẫn khoa nghi:</strong>
                  {template.ritualGuide}
                </div>
              )}

              <div className="py-3 border-y border-[#E6DFD5]">
                <div className="text-[13px] text-[#584140]">Quy chuẩn giá tham khảo:</div>
                <div className="flex items-baseline gap-3 mt-0.5">
                  {template.discountPrice && template.discountPrice > 0 ? (
                    <>
                      <span className="text-[26px] font-bold text-[#8B1E21]">
                        {Number(template.discountPrice).toLocaleString('vi-VN')} đ
                      </span>
                      {template.basePrice && template.basePrice > template.discountPrice && (
                        <span className="text-[16px] text-gray-400 line-through">
                          {Number(template.basePrice).toLocaleString('vi-VN')} đ
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-[24px] font-bold text-[#8B1E21]">
                      {template.basePrice && template.basePrice > 0
                        ? `${Number(template.basePrice).toLocaleString('vi-VN')} đ`
                        : 'Liên hệ để Thợ Cả báo giá'}
                    </span>
                  )}
                </div>
                <div className="text-[12px] text-[#8C6D18] italic mt-1">
                  * Giá thực tế có thể thay đổi sau khi quý khách tùy biến số lượng hoặc thêm linh phẩm ngoài mẫu.
                </div>
              </div>
            </div>

            <div className="pt-6 space-y-3">
              <Link
                to={`/tuy-chinh-mau/${template.slug}`}
                className="btn-primary w-full text-[15px] py-3.5 justify-center"
              >
                <SlidersHorizontal size={18} />
                <span>Tùy Chỉnh & Gửi Yêu Cầu Báo Giá</span>
              </Link>
              <div className="flex items-center justify-center gap-4 text-[12.5px] text-[#584140]">
                <span className="flex items-center gap-1">
                  <ShieldCheck size={14} className="text-[#8B1E21]" /> Giấy dó thủ công
                </span>
                <span>•</span>
                <span>Vận chuyển xe mui kín</span>
                <span>•</span>
                <span>Báo giá minh bạch</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Danh Sách Các Thành Phần Trong Bộ Mẫu */}
        <div className="mt-12 bg-white border border-[#E6DFD5] rounded-[4px] p-6 lg:p-8 shadow-antique-card">
          <div className="border-b border-[#E6DFD5] pb-4 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h2 className="font-serif text-[22px] font-bold text-[#262626]">
                Các Thành Phần Quy Chuẩn Trong Mẫu ({template.items?.length || 0})
              </h2>
              <p className="text-[13px] text-[#584140]">
                Quý khách có thể giữ nguyên toàn bộ hoặc bấm "Tùy Chỉnh" để thay đổi từng thành phần.
              </p>
            </div>
            <Link
              to={`/tuy-chinh-mau/${template.slug}`}
              className="btn-secondary !text-[13px] !py-2"
            >
              <span>Mở Trình Tùy Chỉnh</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13.5px] border-collapse">
              <thead>
                <tr className="bg-[#FAF7F2] text-[#3E2723] border-b border-[#E6DFD5]">
                  <th className="py-3 px-3 font-semibold text-center w-12">STT</th>
                  <th className="py-3 px-3 font-semibold text-center w-20">Hình Ảnh</th>
                  <th className="py-3 px-4 font-semibold">Thành Phần Linh Phẩm</th>
                  <th className="py-3 px-4 font-semibold text-center">Số Lượng Mặc Định</th>
                  <th className="py-3 px-4 font-semibold text-center">Quy Tắc Tùy Biến</th>
                  <th className="py-3 px-4 font-semibold">Ghi Chú Nghệ Nhân</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6DFD5]">
                {template.items?.map((item, idx) => {
                  const itemName = item.productNameSnapshot || item.productId?.name || 'Linh phẩm';
                  const itemImg =
                    item.image ||
                    item.productId?.thumbnail ||
                    (item.productId?.images && item.productId.images[0]);

                  return (
                    <tr key={idx} className="hover:bg-[#FAF7F2]/60 transition-colors">
                      <td className="py-3.5 px-3 text-center font-mono text-[#584140] font-semibold">
                        {idx + 1}
                      </td>

                      {/* Cột Hình Ảnh Linh Phẩm */}
                      <td className="py-3 px-3 text-center">
                        {itemImg ? (
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewImage({
                                url: itemImg,
                                name: itemName,
                                dimensions: item.productId?.dimensions,
                                material: item.productId?.material,
                                slug: item.productId?.slug,
                              })
                            }
                            className="relative inline-block w-14 h-14 rounded-[4px] border border-[#E6DFD5] overflow-hidden bg-[#FAF7F2] shadow-xs group hover:border-[#8B1E21] hover:ring-2 hover:ring-[#8B1E21]/20 transition-all cursor-pointer"
                            title="Bấm để xem ảnh phóng to"
                          >
                            <img
                              src={itemImg}
                              alt={itemName}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                            <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                              <ZoomIn size={16} />
                            </div>
                          </button>
                        ) : (
                          <div
                            className="inline-flex w-14 h-14 rounded-[4px] border border-dashed border-[#D5CCC1] bg-[#FAF7F2] items-center justify-center text-gray-400"
                            title="Chưa có ảnh đại diện"
                          >
                            <ImageIcon size={18} className="opacity-40" />
                          </div>
                        )}
                      </td>

                      {/* Cột Tên & Quy cách */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#262626] text-[14px]">
                          {item.productId?.slug ? (
                            <Link
                              to={`/san-pham/${item.productId.slug}`}
                              className="hover:text-[#8B1E21] hover:underline transition-colors"
                            >
                              {itemName}
                            </Link>
                          ) : (
                            <span>{itemName}</span>
                          )}
                        </div>
                        {item.productId?.dimensions && (
                          <div className="text-[12px] text-[#584140] mt-0.5">
                            Quy cách: <strong>{item.productId.dimensions}</strong>
                          </div>
                        )}
                        {item.productId?.material && (
                          <div className="text-[11.5px] text-[#8C6D18]">
                            Chất liệu: {item.productId.material}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center font-bold text-[#8B1E21]">
                        {item.defaultQuantity} {item.productId?.unit || 'bộ'}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {item.required ? (
                          <span className="inline-block px-2 py-0.5 bg-[#8B1E21]/10 text-[#8B1E21] border border-[#8B1E21]/30 rounded text-[11px] font-semibold">
                            Bắt buộc trong mẫu
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 bg-[#C59B27]/10 text-[#775a00] border border-[#C59B27]/30 rounded text-[11px] font-medium">
                            Có thể bỏ / thêm
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-[#584140] text-[12.5px]">
                        {item.note || 'Quy chuẩn theo lề lối truyền thống'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Lightbox Modal Xem Ảnh Phóng To */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="bg-white rounded-lg shadow-2xl max-w-lg w-full overflow-hidden border border-[#E6DFD5] animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-[#E6DFD5] flex items-center justify-between bg-[#FAF7F2]">
              <div>
                <h3 className="font-serif text-[17px] font-bold text-[#262626]">
                  {previewImage.name}
                </h3>
                {previewImage.dimensions && (
                  <div className="text-xs text-[#584140] mt-0.5">
                    Kích thước quy cách: <strong>{previewImage.dimensions}</strong>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-red-600 hover:border-red-300 transition-colors cursor-pointer"
                title="Đóng (ESC)"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-3 bg-neutral-900 flex items-center justify-center max-h-[65vh] overflow-hidden">
              <img
                src={previewImage.url}
                alt={previewImage.name}
                className="max-h-[60vh] w-auto max-w-full object-contain rounded shadow-lg"
              />
            </div>

            <div className="p-3.5 bg-white border-t border-[#E6DFD5] flex items-center justify-between">
              <div className="text-xs text-[#584140] flex items-center gap-1.5">
                <Sparkles size={14} className="text-[#C59B27]" />
                <span>Nghệ nhân Hàng Mã thủ công truyền thống</span>
              </div>
              {previewImage.slug && (
                <Link
                  to={`/san-pham/${previewImage.slug}`}
                  className="btn-secondary !text-xs !py-1.5 px-3 flex items-center gap-1"
                >
                  <span>Xem sản phẩm này</span>
                  <ArrowRight size={13} />
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
