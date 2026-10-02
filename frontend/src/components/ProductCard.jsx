import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { ShoppingCart } from 'lucide-react';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();

  const formattedPrice = Number(product.price).toLocaleString('vi-VN');
  const formattedOrigPrice = product.originalPrice ? Number(product.originalPrice).toLocaleString('vi-VN') : null;

  return (
    <div className="card-frame flex flex-col h-full bg-white group overflow-hidden">
      {/* Image Container with 0.5rem inset */}
      <div className="p-2 bg-[#FAF7F2] relative overflow-hidden aspect-[4/3]">
        <img
          src={product.thumbnail || product.images?.[0] || 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&w=600&q=80'}
          alt={product.name}
          className="w-full h-full object-cover rounded-[2px] transition-transform duration-300 group-hover:scale-[1.03]"
          loading="lazy"
        />
        {product.isTraditional ? (
          <span className="absolute top-3 left-3 seal-badge text-[10px]">
            CỔ TRUYỀN
          </span>
        ) : (
          <span className="absolute top-3 left-3 bg-[#3E2723]/90 text-white font-bold text-[9.5px] px-2 py-0.5 rounded shadow-xs tracking-wide">
            NGHỆ NHÂN
          </span>
        )}
        {product.stockQuantity > 0 && product.stockQuantity <= 5 ? (
          <span className="absolute top-3 right-3 bg-amber-700/95 text-white font-bold text-[10px] px-2 py-0.5 rounded shadow">
            CÒN SẴN {product.stockQuantity}
          </span>
        ) : (
          <span className="absolute top-3 right-3 bg-[#8B1E21]/90 text-white font-bold text-[10px] px-2 py-0.5 rounded shadow">
            CHẾ TÁC THEO ĐƠN
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="text-[11px] font-semibold text-[#8C6D18] tracking-wider uppercase mb-1">
            {product.category?.name || product.categoryNameSnapshot || 'Đồ Lễ Hàng Mã'}
          </div>
          <Link to={`/san-pham/${product.slug}`} className="block">
            <h3 className="font-serif text-[16px] font-semibold text-[#262626] line-clamp-2 group-hover:text-[#8B1E21] transition-colors">
              {product.name}
            </h3>
          </Link>
          {product.dimensions && (
            <p className="text-[12px] text-[#584140] mt-1 line-clamp-1">
              Kích thước: {product.dimensions}
            </p>
          )}
        </div>

        <div className="pt-3 mt-3 border-t border-[#E6DFD5] flex items-center justify-between">
          <div>
            <div className="text-[16px] font-semibold text-[#8B1E21]">
              {formattedPrice} <span className="text-[13px] font-normal underline">đ</span>
            </div>
            {formattedOrigPrice && (
              <div className="text-[12px] text-[#A89F91] line-through">
                {formattedOrigPrice} đ
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <Link
              to={`/san-pham/${product.slug}`}
              className="px-2.5 py-1.5 border border-[#E6DFD5] rounded-[3px] text-[12px] font-medium text-[#3E2723] hover:bg-[#F9F4E8] hover:text-[#8B1E21] hover:border-[#8B1E21] transition-colors"
            >
              <span>Chi tiết</span>
            </Link>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                addToCart(product, 1);
              }}
              className="p-1.5 rounded-[3px] transition-colors cursor-pointer bg-[#8B1E21] text-white hover:bg-[#9E2A2B] shadow-xs"
              title="Thêm vào giỏ đồ lễ"
            >
              <ShoppingCart size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
