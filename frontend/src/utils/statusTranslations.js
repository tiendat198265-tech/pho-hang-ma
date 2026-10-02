// Bảng dịch chuẩn toàn bộ trạng thái & vai trò sang Tiếng Việt cho toàn hệ thống Phố Hàng Mã

export const STATUS_TRANSLATIONS = {
  // Trạng thái Hồ sơ yêu cầu mâm lễ tùy biến
  SUBMITTED: 'Chờ duyệt báo giá',
  UNDER_REVIEW: 'Thợ cả đang khảo giá',
  QUOTED: 'Đã gửi báo giá',
  CUSTOMER_ACCEPTED: 'Khách đã duyệt đơn',
  CUSTOMER_REJECTED: 'Khách đã từ chối',
  IN_PRODUCTION: 'Đang vào gia công',
  COMPLETED: 'Đã hoàn tất bàn giao',
  CANCELLED: 'Đã hủy',

  // Trạng thái Đơn hàng thương mại
  PENDING: 'Chờ xử lý',
  CONFIRMED: 'Đã xác nhận',
  PROCESSING: 'Đang chuẩn bị hàng',
  SHIPPING: 'Đang giao xe mui kín',
  DELIVERED: 'Giao hàng thành công',

  // Trạng thái Thanh toán
  PAID: 'Đã thanh toán',
  UNPAID: 'Chưa thanh toán',
  REFUNDED: 'Đã hoàn tiền',

  // Trạng thái hiển thị Bộ mẫu / Banner
  ACTIVE: 'Hiển thị',
  HIDDEN: 'Đang ẩn',

  // Vai trò tài khoản
  ADMIN: 'Quản trị viên',
  STAFF: 'Thợ cả nghệ nhân',
  USER: 'Khách hàng',
  CUSTOMER: 'Khách hàng',
};

export function getStatusText(code) {
  if (!code) return '';
  return STATUS_TRANSLATIONS[code] || code;
}

export function getRoleText(role) {
  if (!role) return 'Khách hàng';
  return STATUS_TRANSLATIONS[role] || role;
}
