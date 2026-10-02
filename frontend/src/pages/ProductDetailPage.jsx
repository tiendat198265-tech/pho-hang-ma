import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { ShoppingCart, ShieldCheck, Truck, ArrowLeft, Check, SlidersHorizontal, ZoomIn, Sparkles } from 'lucide-react';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState('');
  const [loading, setLoading] = useState(true);
  const [addedNotice, setAddedNotice] = useState(false);
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
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/products/${slug}`);
        const data = await res.json();
        if (data.success && data.data) {
          setProduct(data.data);
          setSelectedImage(data.data.thumbnail || data.data.images?.[0] || '');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [slug]);

  const handleAddToCart = () => {
    if (!product) return;
    const added = addToCart(product, quantity);
    if (added) {
      setAddedNotice(true);
      setTimeout(() => setAddedNotice(false), 2500);
    }
  };

  const handleBuyNow = () => {
    if (!product) return;
    const added = addToCart(product, quantity);
    if (added) {
      navigate('/thanh-toan');
    }
  };

  if (loading) {
    return <div className="max-w-[1320px] mx-auto px-4 py-20 text-center text-[#584140]">Đang tải dữ liệu linh phẩm...</div>;
  }

  if (!product) {
    return (
      <div className="max-w-[1320px] mx-auto px-4 py-20 text-center">
        <h2 className="font-serif text-[24px] font-bold text-[#8B1E21]">Không tìm thấy sản phẩm này</h2>
        <Link to="/san-pham" className="btn-secondary mt-4">
          Quay lại kho đồ lễ
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#FAF7F2] min-h-screen py-10">
      <div className="max-w-[1200px] mx-auto px-4">
        {/* Breadcrumb */}
        <div className="text-[13px] text-[#584140] mb-6 flex items-center gap-2">
          <Link to="/" className="hover:text-[#8B1E21]">Trang Chủ</Link>
          <span>/</span>
          <Link to="/san-pham" className="hover:text-[#8B1E21]">Linh Phẩm</Link>
          <span>/</span>
          <span className="text-[#262626] font-medium">{product.name}</span>
        </div>

        {/* Main Grid */}
        <div className="bg-white border border-[#E6DFD5] rounded-[4px] p-6 lg:p-8 shadow-antique-card grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Images Gallery */}
          <div className="md:col-span-6 space-y-4">
            <div
              className="relative aspect-[4/3] rounded-[3px] overflow-hidden bg-[#FAF7F2] border border-[#E6DFD5] cursor-crosshair group shadow-xs select-none"
              onMouseEnter={() => setIsZoomed(true)}
              onMouseLeave={() => setIsZoomed(false)}
              onMouseMove={handleMouseMove}
              title="Rê chuột để soi chi tiết sản phẩm"
            >
              <img
                src={selectedImage || 'https://images.unsplash.com/photo-1582650625119-3a31f8fa2699?auto=format&fit=crop&w=800&q=80'}
                alt={product.name}
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
            {product.images?.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(img)}
                    className={`w-16 h-16 rounded border overflow-hidden flex-shrink-0 ${
                      selectedImage === img ? 'border-[#8B1E21] ring-1 ring-[#8B1E21]' : 'border-[#E6DFD5]'
                    }`}
                  >
                    <img src={img} alt="Thumbnail" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details & Actions */}
          <div className="md:col-span-6 flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="seal-badge">{product.category?.name || 'Đồ Lễ Cổ Truyền'}</span>
                {product.sku && <span className="text-[12px] font-mono text-[#584140]">Mã: {product.sku}</span>}
              </div>

              <h1 className="font-serif text-[26px] sm:text-[32px] font-bold text-[#262626] leading-tight">
                {product.name}
              </h1>

              {/* Price & Stock */}
              <div className="mt-4 p-4 bg-[#FAF7F2] border border-[#E6DFD5] rounded-[4px] flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-[12px] text-[#584140]">Giá bán đồ lễ:</div>
                  <div className="text-[26px] font-bold text-[#8B1E21]">
                    {Number(product.price).toLocaleString('vi-VN')} <span className="text-[14px] font-normal underline">đ</span>
                    <span className="text-[13px] font-normal text-[#584140] ml-2">/ {product.unit || 'chiếc'}</span>
                  </div>
                </div>

                <div>
                  {product.stockQuantity > 0 ? (
                    <span className="inline-flex items-center px-3 py-1 rounded bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-300">
                      Còn hàng sẵn ({product.stockQuantity} {product.unit || 'sản phẩm'})
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded bg-[#F9F4E8] text-[#8B1E21] text-xs font-bold border border-[#C59B27]/50 shadow-xs">
                      Sẵn sàng chế tác theo đơn
                    </span>
                  )}
                </div>
              </div>

              {/* Specs */}
              <dl className="mt-6 space-y-2 text-[13.5px] border-y border-[#E6DFD5] py-4">
                {product.dimensions && (
                  <div className="flex">
                    <dt className="w-32 text-[#584140]">Kích thước:</dt>
                    <dd className="font-medium text-[#262626]">{product.dimensions}</dd>
                  </div>
                )}
                {product.material && (
                  <div className="flex">
                    <dt className="w-32 text-[#584140]">Chất liệu:</dt>
                    <dd className="text-[#262626]">{product.material}</dd>
                  </div>
                )}
                <div className="flex">
                  <dt className="w-32 text-[#584140]">Chế tác:</dt>
                  <dd className="text-[#8B1E21] font-semibold">Nghệ nhân Hàng Mã thủ công</dd>
                </div>
              </dl>

              <div className="mt-4 text-[14px] text-[#584140] leading-relaxed">
                {product.description}
              </div>
            </div>

            {/* Cart & Buy Buttons */}
            <div className="pt-4 space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="flex items-center border border-[#D5CCC1] rounded-[3px] bg-[#FAF7F2] overflow-hidden self-start sm:self-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-11 flex items-center justify-center text-[#262626] hover:bg-white text-base font-bold transition-colors cursor-pointer"
                  >
                    -
                  </button>
                  <span className="w-12 text-center font-bold text-[15px] text-[#8B1E21]">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-11 flex items-center justify-center text-[#262626] hover:bg-white text-base font-bold transition-colors cursor-pointer"
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="px-4 py-3 border-2 border-[#8B1E21] text-[#8B1E21] hover:bg-[#F9F4E8] font-bold text-[14px] rounded-[3px] flex items-center justify-center gap-2 transition-all flex-1 cursor-pointer"
                >
                  <ShoppingCart size={18} />
                  <span>Thêm Vào Giỏ Hàng</span>
                </button>

                <button
                  type="button"
                  onClick={handleBuyNow}
                  className="px-6 py-3 bg-[#8B1E21] hover:bg-[#9E2A2B] text-white font-bold text-[15px] rounded-[3px] flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all flex-1 cursor-pointer"
                >
                  <Sparkles size={17} className="text-amber-300" />
                  <span>Đặt Hàng Ngay</span>
                </button>
              </div>

              {/* Note about admin verification */}
              <div className="p-3 bg-[#FAF7F2] border border-[#E6DFD5] rounded-[4px] text-[12.5px] text-[#584140] flex items-start gap-2 leading-relaxed">
                <Sparkles size={15} className="text-[#8B1E21] shrink-0 mt-0.5" />
                <span>
                  Sau khi đặt hàng, <strong>Thợ Cả / Ban quản trị xưởng</strong> sẽ tự động liên hệ lại qua số điện thoại để xác thực chi tiết quy cách đồ mã và lịch bàn giao cẩn thận.
                </span>
              </div>

              {addedNotice && (
                <div className="p-2.5 bg-green-50 text-green-800 text-[13px] border border-green-200 rounded flex items-center gap-2">
                  <Check size={16} />
                  <span>Đã thêm linh phẩm vào giỏ đồ lễ!</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-between text-[12px] text-[#584140]">
                <span className="flex items-center gap-1">
                  <Truck size={14} className="text-[#8B1E21]" /> Giao xe mui kín chuyên biệt
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <ShieldCheck size={14} className="text-[#8B1E21]" /> Giấy dó thủ công Thăng Long
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
