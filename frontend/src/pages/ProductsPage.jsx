import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { Search, Filter, SlidersHorizontal } from 'lucide-react';

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get('category') || '';
  const searchParam = searchParams.get('search') || '';
  const pageParam = parseInt(searchParams.get('page') || '1', 10);

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('newest');
  const [localSearch, setLocalSearch] = useState(searchParam);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/categories');
        const data = await res.json();
        if (data.success) setCategories(data.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        let url = `/api/products?page=${pageParam}&limit=12`;
        if (categoryParam) url += `&category=${categoryParam}`;
        if (searchParam) url += `&search=${encodeURIComponent(searchParam)}`;
        if (sort === 'price_asc') url += `&sort=price_asc`;
        if (sort === 'price_desc') url += `&sort=price_desc`;

        const res = await fetch(url);
        const data = await res.json();
        if (data.success) {
          setProducts(data.data);
          setTotalPages(data.pages || 1);
          setTotalCount(data.total || 0);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [categoryParam, searchParam, sort, pageParam]);

  const handleCategorySelect = (slug) => {
    if (slug) {
      searchParams.set('category', slug);
    } else {
      searchParams.delete('category');
    }
    searchParams.set('page', '1');
    setSearchParams(searchParams);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (localSearch.trim()) {
      searchParams.set('search', localSearch.trim());
    } else {
      searchParams.delete('search');
    }
    searchParams.set('page', '1');
    setSearchParams(searchParams);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      searchParams.set('page', newPage.toString());
      setSearchParams(searchParams);
      window.scrollTo({ top: 150, behavior: 'smooth' });
    }
  };

  const activeCategory = categories.find(
    (c) => c.slug === categoryParam || c._id === categoryParam
  );

  return (
    <div className="w-full bg-[#FAF7F2] min-h-screen py-10">
      <div className="max-w-[1320px] mx-auto px-4">
        {/* Breadcrumb */}
        <div className="text-[13px] text-[#584140] mb-6 flex items-center gap-2 flex-wrap">
          <Link to="/" className="hover:text-[#8B1E21]">Trang Chủ</Link>
          <span>/</span>
          {activeCategory ? (
            <>
              <Link to="/san-pham" className="hover:text-[#8B1E21]">Kho Linh Phẩm</Link>
              <span>/</span>
              <span className="text-[#262626] font-medium">{activeCategory.name}</span>
            </>
          ) : (
            <span className="text-[#262626] font-medium">Kho Lễ Phẩm</span>
          )}
        </div>

        {/* Dynamic Category Banner OR Standard Header */}
        {activeCategory ? (
          <div className="bg-white border border-[#E6DFD5] p-5 sm:p-6 rounded-[6px] shadow-antique-card mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-[4px] border border-[#E6DFD5] bg-[#FAF7F2] overflow-hidden shrink-0 shadow-xs">
                <img
                  src={activeCategory.image || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=400&q=80'}
                  alt={activeCategory.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="seal-badge !bg-amber-100 !text-[#8B1E21] text-[10px]">
                    DANH MỤC TRUYỀN THỐNG
                  </span>
                  <span className="text-[12px] text-gray-500 font-mono">
                    ({totalCount} sản phẩm)
                  </span>
                </div>
                <h1 className="font-serif text-[24px] sm:text-[30px] font-bold text-[#262626] mt-1">
                  {activeCategory.name}
                </h1>
                <p className="text-[13px] text-[#584140] mt-1 max-w-xl">
                  {activeCategory.description ||
                    'Các sản phẩm linh phẩm thủ công thuộc danh mục truyền thống được nghệ nhân Thường Tín chế tác tỉ mỉ, chuẩn lề lối phong tục cổ truyền.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-gray-100">
              <button
                onClick={() => handleCategorySelect('')}
                className="btn-secondary !text-[12px] !py-2 px-3 whitespace-nowrap"
              >
                ✕ Bỏ lọc (Xem tất cả)
              </button>
              <div className="flex items-center gap-2 text-[13px]">
                <span className="text-[#584140] hidden sm:inline">Sắp xếp:</span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="bg-white border border-[#D5CCC1] rounded-[3px] px-3 py-1.5 text-[#262626] focus:border-[#8B1E21] focus:outline-none"
                >
                  <option value="newest">Mới nhất</option>
                  <option value="price_asc">Giá tăng dần</option>
                  <option value="price_desc">Giá giảm dần</option>
                </select>
              </div>
            </div>
          </div>
        ) : (
          <div className="border-b border-[#E6DFD5] pb-4 mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <span className="seal-badge mb-1">KHO ĐỒ MÃ CỔ TRUYỀN</span>
              <h1 className="font-serif text-[28px] sm:text-[34px] font-bold text-[#262626]">
                Lễ Phẩm Thủ Công
              </h1>
              <p className="text-[13.5px] text-[#584140] mt-1">
                Chế tác bằng khung giang nứa già, bồi dán giấy dó nhuộm phẩm điều chuẩn quy thức Thăng Long. {totalCount > 0 && `(Tổng: ${totalCount} sản phẩm)`}
              </p>
            </div>

            {/* Sort dropdown */}
            <div className="flex items-center gap-2 text-[13px]">
              <span className="text-[#584140]">Sắp xếp theo:</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="bg-white border border-[#D5CCC1] rounded-[3px] px-3 py-1.5 text-[#262626] focus:border-[#8B1E21] focus:outline-none"
              >
                <option value="newest">Mới nhất</option>
                <option value="price_asc">Giá tăng dần</option>
                <option value="price_desc">Giá giảm dần</option>
              </select>
            </div>
          </div>
        )}

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Sidebar Filters */}
          <div className="lg:col-span-3 space-y-6">
            {/* Search Box */}
            <form onSubmit={handleSearchSubmit} className="bg-white border border-[#E6DFD5] p-4 rounded-[4px]">
              <label className="block text-[12px] font-bold text-[#8C6D18] uppercase tracking-wider mb-2">
                Tìm kiếm đồ lễ
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  placeholder="Nhập tên sản phẩm..."
                  className="w-full bg-[#FAF7F2] border border-[#D5CCC1] text-[13px] rounded px-3 py-2 pr-9 focus:border-[#8B1E21] focus:outline-none"
                />
                <button type="submit" className="absolute right-2 top-2.5 text-[#8B1E21]">
                  <Search size={16} />
                </button>
              </div>
            </form>

            {/* Category Filter */}
            <div className="bg-white border border-[#E6DFD5] p-4 rounded-[4px]">
              <div className="flex items-center gap-2 font-serif text-[16px] font-semibold text-[#262626] mb-3 pb-2 border-b border-[#E6DFD5]">
                <Filter size={16} className="text-[#8B1E21]" />
                <span>Danh Mục Đồ Mã</span>
              </div>
              <ul className="space-y-1 text-[13px]">
                <li>
                  <button
                    onClick={() => handleCategorySelect('')}
                    className={`w-full text-left px-2.5 py-1.5 rounded transition-colors ${
                      !categoryParam
                        ? 'bg-[#8B1E21] text-white font-medium'
                        : 'text-[#584140] hover:bg-[#FAF7F2]'
                    }`}
                  >
                    Tất cả sản phẩm
                  </button>
                </li>
                {categories.map((c) => (
                  <li key={c._id}>
                    <button
                      onClick={() => handleCategorySelect(c.slug)}
                      className={`w-full text-left px-2.5 py-1.5 rounded transition-colors ${
                        categoryParam === c.slug
                          ? 'bg-[#8B1E21] text-white font-medium'
                          : 'text-[#584140] hover:bg-[#FAF7F2]'
                      }`}
                    >
                      {c.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Banner: Đặt hàng theo mẫu */}
            <div className="bg-[#3E2723] text-white p-5 rounded-[4px] border border-[#C59B27] space-y-3">
              <span className="seal-badge !bg-amber-300 !text-black !border-amber-400 font-bold text-[10px]">
                DỊCH VỤ TRỌN GÓI
              </span>
              <h3 className="font-serif text-[17px] font-bold leading-snug">
                Cần Đặt Nguyên Mâm Lễ Đàn Tràng?
              </h3>
              <p className="text-[12.5px] text-[#E3BEB8]">
                Xem ngay các bộ mẫu quy chuẩn Đàn Tứ Phủ hoặc tùy biến theo ý nguyện.
              </p>
              <Link to="/bo-mau" className="btn-secondary !text-[12px] !py-2 w-full justify-center !border-amber-400 !bg-amber-400 hover:!bg-amber-500 !text-black font-bold">
                <SlidersHorizontal size={14} />
                <span>Xem Các Bộ Mẫu</span>
              </Link>
            </div>
          </div>

          {/* Product Grid */}
          <div className="lg:col-span-9">
            {loading ? (
              <div className="py-20 text-center text-[#584140]">
                <div className="w-8 h-8 border-2 border-[#8B1E21] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                Đang tải dữ liệu sản phẩm...
              </div>
            ) : products.length === 0 ? (
              <div className="bg-white border border-[#E6DFD5] p-12 text-center rounded-[6px] shadow-xs">
                <h3 className="font-serif text-[18px] text-[#8B1E21] font-bold">
                  {activeCategory
                    ? `Danh mục "${activeCategory.name}" chưa có sản phẩm sẵn trong kho`
                    : 'Không tìm thấy sản phẩm phù hợp'}
                </h3>
                <p className="text-[13px] text-[#584140] mt-1 max-w-md mx-auto">
                  {activeCategory
                    ? 'Xưởng thủ công Phố Hàng Mã đang tiếp nhận đặt làm thủ công theo kích thước & yêu cầu riêng của quý khách.'
                    : 'Quý khách thử thay đổi từ khóa tìm kiếm hoặc bấm nút bên dưới để xem toàn bộ danh mục.'}
                </p>
                <div className="mt-5 flex items-center justify-center gap-3 flex-wrap">
                  {activeCategory && (
                    <button
                      onClick={() => handleCategorySelect('')}
                      className="btn-secondary !text-xs !py-2 px-4"
                    >
                      Xem tất cả sản phẩm khác
                    </button>
                  )}
                  <Link to="/tuy-chinh-mau/dan-tu-phu" className="btn-primary !text-xs !py-2 px-4">
                    Đặt mâm lễ theo yêu cầu
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((prod) => (
                    <ProductCard key={prod._id} product={prod} />
                  ))}
                </div>

                {/* Server-side Pagination Bar */}
                {totalPages > 1 && (
                  <div className="mt-10 flex items-center justify-center gap-2">
                    <button
                      onClick={() => handlePageChange(pageParam - 1)}
                      disabled={pageParam <= 1}
                      className="px-3.5 py-1.5 text-[13px] border border-[#D5CCC1] rounded bg-white text-[#584140] hover:bg-[#FAF7F2] disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Trang trước
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        onClick={() => handlePageChange(p)}
                        className={`w-9 h-9 text-[13px] font-medium rounded border transition-colors ${
                          p === pageParam
                            ? 'bg-[#8B1E21] text-white border-[#8B1E21]'
                            : 'bg-white text-[#584140] border-[#D5CCC1] hover:bg-[#FAF7F2]'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                    <button
                      onClick={() => handlePageChange(pageParam + 1)}
                      disabled={pageParam >= totalPages}
                      className="px-3.5 py-1.5 text-[13px] border border-[#D5CCC1] rounded bg-white text-[#584140] hover:bg-[#FAF7F2] disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Trang sau
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
