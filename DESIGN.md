# DESIGN SYSTEM SPECIFICATION: PHỐ HÀNG MÃ (SOURCE OF TRUTH)

> **Tài liệu nguồn (Source of Truth)** được trích xuất trực tiếp từ Google Stitch MCP:  
> - **Dự án:** Phố Hàng Mã UI/UX  
> - **Project ID:** `6664235216926624257`  
> - **Node ID gốc:** `7aad11159e0440758b28803ae9255ab6`  
> - **Asset Design System:** `assets/16669e4a94ad45bfb68f1b4fad98ac31`

---

## 1. Triết Lý Thương Hiệu & Định Hướng Mỹ Thuật (Brand Philosophy & Visual Language)

- **Phong cách chủ đạo:** *Modern Heritage Editorial* (Mỹ thuật Di sản & Ấn phẩm Thủ công Thượng hạng).
- **Cảm xúc cốt lõi:** Tâm An (*Peace of Mind*), Nghi Cẩn (*Solemn Dignity*), Thành Kính (*Ancestral Reverence*) và Chu Chu Toàn Toàn.
- **Vật liệu & Màu sắc thị giác:** 
  - Khơi gợi chất liệu thủ công nghìn năm Thăng Long - Hà Nội: Giấy dó truyền thống, sơn son thếp vàng, viền đồng trầm, gấm ngự, hương trầm và mực tàu.
  - **TUYỆT ĐỐI KHÔNG:** Không dùng hiệu ứng kính nhựa (glassmorphism/acrylic), không dùng màu neon/gradient công nghệ số hóa kiểu SaaS Web3/AI, không dùng trắng bóng tinh thể (`#FFFFFF` thuần chỉ dùng cho nội dung nổi bật có viền cổ điển).

---

## 2. Bảng Màu Chuẩn (Color Palette Tokens)

### 2.1. Màu Thương Hiệu & Điểm Nhấn (Brand Colors)
| Token Key | HEX Code | Ý nghĩa / Ứng dụng |
| :--- | :--- | :--- |
| `--color-primary` | `#8B1E21` | **Đỏ Son Cổ Điển (Cinnabar / Vermilion Lacquer):** Màu chủ đạo, nút bấm chính, ấn triện, giá trị cốt lõi |
| `--color-primary-hover` | `#9E2A2B` | Hover nút chính, liên kết nổi bật |
| `--color-primary-active` | `#5E1315` | Trạng thái nhấn, border nhấn đặc biệt |
| `--color-secondary` | `#C59B27` | **Vàng Đồng Cổ (Antique Brass / Muted Gold):** Viền phụ kiện, huy hiệu ngày lễ, chỉ dẫn mạ đồng |
| `--color-secondary-hover` | `#D8AF3B` | Hover viền kim loại |
| `--color-tertiary` | `#3E2723` | **Nâu Gỗ Trầm Hương (Deep Agarwood Brown):** Tiêu đề thứ cấp, nhãn trường, màu ấm cổ kính |
| `--color-neutral` | `#262626` | **Than Củi / Mực Tàu (Charcoal Black):** Văn bản chính, tiêu đề trang |
| `--color-neutral-muted` | `#584140` | Văn bản phụ, chú thích, mã SKU, ngày tháng |

### 2.2. Màu Nền & Bề Mặt Kiến Trúc (Surface Hierarchy)
| Tầng Bề Mặt | HEX Code | Tên gọi & Ứng dụng |
| :--- | :--- | :--- |
| **Surface Level 0 (Canvas)** | `#FAF7F2` | **Trắng Ngà / Giấy Dó Ấm (Warm Ivory / Do Paper Canvas):** Nền toàn trang web |
| **Surface Level 1 (Panels/Cards)** | `#F4EFEB` | **Parchment Stack:** Nền thẻ sản phẩm, panel bên, accordion thành phần |
| **Surface Level 2 (Modals/Overlays)** | `#FFFFFF` | Thẻ pop-up, modal xác nhận, hộp thoại có bóng kép cổ điển |
| **Surface Level 3 (Sticky Bars/Nav)** | `#FAF7F2` | Thanh điều hướng dính cố định, thanh chốt đơn |

### 2.3. Hệ Thống Viền (Borders) & Đổ Bóng (Shadows)
- **Đường viền mặc định:** `1px solid #E6DFD5` (Viền xơ giấy mộc).
- **Đường viền nhấn mạ đồng:** `1px solid #C59B27` (Dùng cho thẻ được chọn, viền card hover, huy hiệu linh thiêng).
- **Đường viền tiêu điểm (Focus ring):** `1px solid #8B1E21` kết hợp viền ngoài `2px solid rgba(139, 30, 33, 0.12)`.
- **Bo góc (Border Radius):** `4px` chuẩn (`ROUND_FOUR`) cho toàn bộ nút, input, card, modal. Không bo tròn lớn kiểu hiện đại bong bóng.
- **Đổ bóng (Elevations):**
  - Card hover / Popover: `box-shadow: 0 4px 16px -2px rgba(62, 39, 35, 0.06), 0 1px 3px 0 rgba(62, 39, 35, 0.04);`
  - Sticky header: `box-shadow: 0 2px 8px rgba(43, 29, 22, 0.03); border-bottom: 1px solid #E6DFD5;`

---

## 3. Hệ Thống Kiểu Chữ (Typography Hierarchy)

- **Headline Font:** `'Playfair Display', serif`
- **Body & Label Font:** `'Be Vietnam Pro', sans-serif`

| Token Name | Font Family | Size | Weight | Line Height | Letter Spacing |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `display-lg` | Playfair Display | `44px` | 600 (SemiBold) | `54px` | `-0.01em` |
| `display-lg-mobile` | Playfair Display | `32px` | 600 (SemiBold) | `40px` | `-0.01em` |
| `display-md` | Playfair Display | `36px` | 600 (SemiBold) | `46px` | `0` |
| `display-md-mobile` | Playfair Display | `26px` | 600 (SemiBold) | `34px` | `0` |
| `headline-lg` | Playfair Display | `28px` | 600 (SemiBold) | `36px` | `0` |
| `headline-md` | Playfair Display | `22px` | 600 (SemiBold) | `30px` | `0` |
| `headline-sm` | Playfair Display | `18px` | 600 (SemiBold) | `26px` | `0` |
| `title-lg` | Be Vietnam Pro | `18px` | 600 (SemiBold) | `26px` | `0` |
| `title-md` | Be Vietnam Pro | `16px` | 600 (SemiBold) | `24px` | `0` |
| `body-lg` | Be Vietnam Pro | `16px` | 400 (Regular) | `26px` | `0` |
| `body-md` | Be Vietnam Pro | `14px` | 400 (Regular) | `22px` | `0` |
| `body-sm` | Be Vietnam Pro | `12px` | 400 (Regular) | `18px` | `0` |
| `label-lg` | Be Vietnam Pro | `14px` | 500 (Medium) | `20px` | `0.02em` |
| `label-md` | Be Vietnam Pro | `12px` | 500 (Medium) | `16px` | `0.04em` |
| `label-sm` | Be Vietnam Pro | `11px` | 600 (SemiBold) | `14px` | `0.06em` |

---

## 4. Hệ Thống Khoảng Cách & Lưới (Layout & Spacing Grid)

- `space-xs`: `0.25rem` (4px)
- `space-sm`: `0.5rem` (8px)
- `space-md`: `1rem` (16px)
- `space-lg`: `1.5rem` (24px)
- `space-xl`: `2.5rem` (40px)
- **Container tối đa:** `1320px` (Desktop fluid 12 cột, margins 3rem, gutter 1.5rem).
- **Tablet (768px - 1199px):** 8 cột, margins 2rem, gutter 1rem.
- **Mobile (< 768px):** 4 cột, margins 1rem, gutter 0.75rem.

---

## 5. Quy Chuẩn Thành Phần Giao Diện (Component Specifications)

### 5.1. Nút Bấm (Buttons)
- **Primary Button (Đỏ Son Cổ Điển):**
  - Nền `#8B1E21`, chữ `#FAF7F2`, viền `1px solid #5E1315`, bo góc `4px`.
  - Font: `label-lg`, `text-transform: uppercase`, `letter-spacing: 0.05em`.
  - Hover: nền `#9E2A2B`, active `#5E1315`.
- **Secondary Button (Viền Đồng Trầm):**
  - Nền `transparent`, chữ `#3E2723`, viền `1px solid #C59B27`, bo góc `4px`.
  - Hover: nền `#F9F4E8`, chữ `#8B1E21`.
- **Tertiary / Ghost Button:**
  - Nền trong suốt, chữ `#4A4A4A`, hover gạch chân viền đồng `1px solid #C59B27`.

### 5.2. Thẻ Đồ Lễ / Sản Phẩm (Product Cards)
- Nền `#FFFFFF` hoặc `#F4EFEB`, viền `1px solid #E6DFD5`, bo góc `4px`.
- Khung ảnh có khoảng đệm thụt vào `0.5rem`, nền ảnh là `#FAF7F2`.
- Category tag phía trên: `label-sm` màu vàng kim đồng (`#8C6D18`).
- Tiêu đề sản phẩm: `headline-sm` màu `#262626`.
- Giá tiền: `title-md` màu đỏ son `#8B1E21` hoặc *"Liên hệ báo giá"* / *"Tùy biến mâm lễ"*.
- Hover: viền chuyển dần sang `#C59B27`, ảnh phóng nhẹ `scale(1.02)`.

### 5.3. Form & Ô Nhập Liệu (Input Controls)
- Nền `#FAF7F2`, viền `1px solid #D5CCC1`, chữ `#262626`, bo góc `4px`, padding `10px 14px`.
- Focus: viền `1px solid #8B1E21`, ring `2px solid rgba(139, 30, 33, 0.12)`.
- Label: `label-md` nằm ngay ngắn phía trên, màu `#3E2723`.

### 5.4. Các Thành Phần Đặc Thù Văn Hóa & Nghi Lễ
1. **Ấn Chỉ Dẫn Lễ (Ritual Guide Badge):** Khung viền chỉ đồng `#C59B27`, nền giấy `#F9F4E8`, chữ `#8B1E21` gắn nhãn dịp lễ (Đàn Tứ Phủ, Rằm Tháng Giêng, Vu Lan, Thanh Minh...).
2. **Dấu Chứng Thực (Artisan / Quality Cinnabar Seal):** Con dấu triện son hình vuông màu `#8B1E21` chứng thực tay nghề thợ cả Hàng Mã.
3. **Mâm Lễ Trọn Gói Accordion:** Liệt kê các thành phần chi tiết với checkbox lựa chọn, số lượng linh hoạt, và ghi chú riêng.

---

## 6. Danh Mục 8 Màn Hình Nguồn Từ Google Stitch MCP

1. **Trang Chủ (`0e9e74dd147f4a3b9cac79f58a22b7f2` / `7aad11159e0440758b28803ae9255ab6`):**
   - Header với thanh tìm kiếm, hotline, giỏ hàng, thông tin nghệ nhân.
   - Hero banner: *"Đặt Bộ Mẫu Đàn Tràng – Tiết Kiệm Đến 25%"*.
   - Danh Mục Sản Phẩm Truyền Thống (Tiền vàng, Quần áo, Hình nhân, Nhà giấy, Xe cộ, Ngựa ngũ sắc...).
   - Trọn Bộ Đàn Tứ Phủ & Các Bộ Lễ Cổ Truyền tiêu biểu.
   - Khối tư vấn phong tục bản địa & Footer cam kết nghi lễ tôn nghiêm.
2. **Danh Mục Bộ Mẫu Hàng Mã (`5fef6439b054450cbdb44d8320b281f8`):**
   - Bộ sưu tập mẫu đàn tràng, mâm lễ quy chuẩn.
   - Bộ lọc theo nghi lễ, ngân sách, quy mô.
   - Hướng dẫn quy trình 4 bước: Chọn mẫu chuẩn -> Tùy biến chi tiết -> Nghệ nhân gia công -> Giao xe mui kín.
3. **Trình Tùy Chỉnh Bộ Mẫu Đàn Tứ Phủ (`c70d335b46404992a391bcbe5d4489d1`):**
   - Tùy chỉnh trực tiếp từng thành phần (Ngựa Ngũ Sắc, Nón Chúa & Mão Thần Linh, Thuyền Rồng Bát Hải...).
   - Checkbox giữ/bỏ thành phần (trừ thành phần bắt buộc `required: true`).
   - Tăng giảm số lượng (nếu `editableQuantity: true`).
   - Nút `[+ Thêm sản phẩm khác]` mở modal chọn linh phẩm từ kho sản phẩm hệ thống.
   - Ô nhập ghi chú riêng cho từng thành phần & ô ghi chú chung toàn bộ đàn lễ.
   - Khu vực Upload nhiều hình ảnh tham khảo (Drag & Drop, preview ảnh, xóa ảnh).
4. **Xác Nhận Yêu Cầu Báo Giá (`dfc1b559a0c94301ba41bae15f0f3344`):**
   - Bảng tổng kết bộ mẫu: So sánh rõ mẫu gốc và các sản phẩm thêm / bớt / đổi số lượng của khách.
   - Thông tin tiếp nhận đơn lễ & Form người đặt (Họ tên, SĐT, Ngày cần hàng, Địa chỉ điện/tư gia).
   - Trạng thái `SUBMITTED` -> Đã chuyển tới Thợ Cả xử lý báo giá.
5. **Logo Phố Hàng Mã (`159398ec1afe4c828cbd1fbc9ee49f89`):** File vector chuẩn thương hiệu.
6. **Ảnh Chân Dung Nghệ Nhân Thợ Cả (`ff0a8ac0038b4c22a383f29c40672fa2`):** Ảnh xưởng thủ công Hàng Mã.
7. **Bối Cảnh Phố Cổ (`7200360056006187965`):** Ảnh nền không gian truyền thống.
