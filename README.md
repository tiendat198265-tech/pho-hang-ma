# 🏮 Phố Hàng Mã — Đặt Lễ Cổ Truyền & Bộ Mẫu Đàn Tràng

Hệ thống thương mại điện tử chuyên biệt cho đồ lễ và vàng mã cổ truyền Thăng Long. Hỗ trợ đặt hàng theo bộ mẫu đàn tràng, tùy biến đồ lễ chuẩn khoa nghi, báo giá thời gian thực và quản trị phân quyền (RBAC).

---

## 🌐 Liên Kết Production (Trực Tuyến)

* **Trang chủ**: [https://tuyetmathuongtin.vercel.app](https://tuyetmathuongtin.vercel.app)
* **Đăng nhập**: [https://tuyetmathuongtin.vercel.app/dang-nhap](https://tuyetmathuongtin.vercel.app/dang-nhap)
* **Bảng điều khiển Quản trị**: [https://tuyetmathuongtin.vercel.app/admin](https://tuyetmathuongtin.vercel.app/admin)
* **Domain phụ (Backup)**: [https://frontend-two-rho-39.vercel.app](https://frontend-two-rho-39.vercel.app)
* **API Backend**: [https://backend-ashen-six-17.vercel.app](https://backend-ashen-six-17.vercel.app)
* **Kiểm tra trạng thái API**: [https://backend-ashen-six-17.vercel.app/api/health](https://backend-ashen-six-17.vercel.app/api/health)

---

## 🔑 Thông Tin Tài Khoản Đăng Nhập

| Phân quyền | Email | Mật khẩu | Chức năng truy cập |
| :--- | :--- | :--- | :--- |
| **Quản Trị Viên (Admin)** | `admin@phohangma.vn` | `admin123` | Toàn quyền: Thống kê doanh thu, duyệt đơn đàn lễ, quản lý sản phẩm, danh mục, nhân viên, cài đặt |
| **Thợ Cả Nghệ Nhân (Staff)** | `thoca@phohangma.vn` | `thoca123` | Quản lý tiến độ gia công xưởng, cập nhật trạng thái đơn hàng và bộ mẫu |
| **Khách Hàng (Customer)** | `khachhang@gmail.com` | `khach123` | Xem sản phẩm, tạo yêu cầu đàn lễ riêng, giỏ hàng, đặt hàng, theo dõi đơn |

> **Lưu ý**: Giao diện đăng nhập công khai đã được bảo mật (không hiển thị tài khoản thử nghiệm). Quản trị viên chỉ cần nhập email và mật khẩu trên để vào hệ thống.

---

## 🏗️ Kiến Trúc Công Nghệ

* **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons (Deploy trên Vercel Edge).
* **Backend**: Node.js, Express RESTful API, JWT Auth, Bcrypt (Deploy trên Vercel Serverless).
* **Cơ sở dữ liệu**: MongoDB Atlas Cloud (`cluster0.mebij7v.mongodb.net`, 14 collections, 345 documents).

---

## 💻 Hướng Dẫn Chạy Môi Trường Local

### 1. Khởi động Backend
```bash
cd backend
npm install
node server.js
# Backend chạy tại: http://localhost:5001 (API: http://localhost:5001/api)
```

### 2. Khởi động Frontend
```bash
cd frontend
npm install
npm run dev
# Frontend chạy tại: http://localhost:5173
```
