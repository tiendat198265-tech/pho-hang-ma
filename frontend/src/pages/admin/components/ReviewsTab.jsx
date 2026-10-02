import React, { useState, useEffect } from 'react';
import {
  Star,
  CheckCircle,
  EyeOff,
  Trash2,
  Loader2,
  Search,
  MessageSquare,
  ShieldCheck,
  Image as ImageIcon,
} from 'lucide-react';
import ConfirmModal from './ConfirmModal';

export default function ReviewsTab({ token }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Delete
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Reply modal
  const [replyingReview, setReplyingReview] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      let url = '/api/reviews/admin/all';
      if (statusFilter) url += `?status=${statusFilter}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        const list = Array.isArray(data.data) ? data.data : (data.data?.reviews || data.reviews || []);
        setReviews(list);
      }
    } catch (err) {
      console.error('Lỗi tải đánh giá:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [statusFilter]);

  const handleUpdateStatus = async (id, status) => {
    try {
      const res = await fetch(`/api/reviews/admin/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      const result = await res.json();
      if (result.success) {
        fetchReviews();
      }
    } catch (err) {
      console.error('Lỗi cập nhật trạng thái review:', err);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      const res = await fetch(`/api/reviews/admin/${deletingId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (result.success) {
        setDeleteConfirmOpen(false);
        setDeletingId(null);
        fetchReviews();
      }
    } catch (err) {
      console.error('Lỗi xóa đánh giá:', err);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyingReview) return;
    try {
      setReplying(true);
      const res = await fetch(`/api/reviews/admin/${replyingReview._id}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ adminReply: replyText }),
      });
      const result = await res.json();
      if (result.success) {
        setReplyingReview(null);
        setReplyText('');
        fetchReviews();
      }
    } catch (err) {
      console.error('Lỗi phản hồi review:', err);
    } finally {
      setReplying(false);
    }
  };

  const reviewList = Array.isArray(reviews) ? reviews : [];
  const filtered = reviewList.filter((r) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      r.userName?.toLowerCase().includes(term) ||
      r.comment?.toLowerCase().includes(term) ||
      r.productId?.name?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Quản Lý Đánh Giá Khách Hàng</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Xem nhận xét, kiểm duyệt ảnh đính kèm và phản hồi từ thợ cả phố Hàng Mã
          </p>
        </div>
        <div className="text-xs text-gray-500 font-mono">
          Tổng số: <span className="font-bold text-gray-800">{reviewList.length}</span> đánh giá
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Tìm theo người nhận xét, nội dung, sản phẩm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-amber-600"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-xs border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-amber-600"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="APPROVED">Đã duyệt (Hiện)</option>
          <option value="PENDING">Chờ duyệt</option>
          <option value="HIDDEN">Đã ẩn</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">Khách Hàng</th>
                <th className="py-3 px-4">Sản Phẩm</th>
                <th className="py-3 px-4 text-center">Sao</th>
                <th className="py-3 px-4">Nhận Xét & Ảnh</th>
                <th className="py-3 px-4 text-center">Xác Thực Mua</th>
                <th className="py-3 px-4 text-center">Trạng Thái</th>
                <th className="py-3 px-4 text-right">Hành Động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin text-amber-600 mx-auto mb-2" />
                    <span>Đang nạp đánh giá...</span>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">
                    Không có đánh giá nào phù hợp
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r._id} className="hover:bg-amber-50/20 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-gray-900">{r.userName}</div>
                      <div className="text-[11px] text-gray-500 font-mono">{r.userEmail}</div>
                      <div className="text-[10px] text-gray-400">
                        {new Date(r.createdAt).toLocaleDateString('vi-VN')}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-gray-800 line-clamp-1">
                        {r.productId?.name || r.productNameSnapshot || 'Sản phẩm'}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center gap-0.5 text-amber-500">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < r.rating ? 'fill-amber-400 text-amber-500' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 max-w-sm">
                      <div className="text-gray-800 italic">"{r.comment}"</div>
                      {r.adminReply && (
                        <div className="mt-1 p-2 bg-amber-50/80 rounded border border-amber-200 text-amber-950 text-[11px]">
                          <strong>Phản hồi của xưởng:</strong> {r.adminReply}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {r.isVerifiedPurchase ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <ShieldCheck className="w-3 h-3" />
                          <span>Đã mua hàng</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-gray-400">Chưa kiểm định</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          r.status === 'APPROVED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : r.status === 'PENDING'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {r.status === 'APPROVED'
                          ? 'Đã duyệt'
                          : r.status === 'PENDING'
                          ? 'Chờ duyệt'
                          : 'Đã ẩn'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {r.status !== 'APPROVED' && (
                          <button
                            onClick={() => handleUpdateStatus(r._id, 'APPROVED')}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md"
                            title="Duyệt hiển thị"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {r.status !== 'HIDDEN' && (
                          <button
                            onClick={() => handleUpdateStatus(r._id, 'HIDDEN')}
                            className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-md"
                            title="Ẩn nhận xét"
                          >
                            <EyeOff className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setReplyingReview(r);
                            setReplyText(r.adminReply || '');
                          }}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md"
                          title="Trả lời khách hàng"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setDeletingId(r._id);
                            setDeleteConfirmOpen(true);
                          }}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md"
                          title="Xóa đánh giá"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reply Modal */}
      {replyingReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-base font-bold text-gray-900">
                Phản Hồi Đánh Giá Khách Hàng
              </h3>
              <p className="text-xs text-gray-500">{replyingReview.userName}</p>
            </div>

            <form onSubmit={handleSendReply} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-gray-50 rounded-lg text-gray-700 italic border border-gray-200">
                "{replyingReview.comment}"
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Nội dung phản hồi từ Phố Hàng Mã <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows="3"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Xưởng Phố Hàng Mã xin chân thành cảm ơn quý khách đã tin tưởng thỉnh lễ..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-600"
                  required
                />
              </div>

              <div className="pt-3 border-t border-gray-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setReplyingReview(null)}
                  className="px-4 py-2 font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={replying}
                  className="px-5 py-2 font-bold text-black bg-amber-400 hover:bg-amber-500 rounded-lg shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  {replying && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Gửi Phản Hồi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      <ConfirmModal
        isOpen={deleteConfirmOpen}
        title="Xóa Đánh Giá Khách Hàng"
        message="Bạn có chắc chắn muốn xóa nhận xét này không?"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirmOpen(false)}
      />
    </div>
  );
}
