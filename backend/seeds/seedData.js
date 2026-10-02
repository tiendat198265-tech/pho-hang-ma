const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('../config/db');

const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');
const ProductTemplate = require('../models/ProductTemplate');
const CustomOrderRequest = require('../models/CustomOrderRequest');
const Order = require('../models/Order');
const Banner = require('../models/Banner');
const Coupon = require('../models/Coupon');
const Setting = require('../models/Setting');
const Review = require('../models/Review');
const InventoryLog = require('../models/InventoryLog');
const AuditLog = require('../models/AuditLog');

dotenv.config();

const seed = async () => {
  try {
    await connectDB();
    console.log('--- Cleaning database collections ---');
    await User.deleteMany();
    await Category.deleteMany();
    await Product.deleteMany();
    await ProductTemplate.deleteMany();
    await CustomOrderRequest.deleteMany();
    await Order.deleteMany();
    await Banner.deleteMany();

    console.log('--- Seeding RBAC Users ---');
    const superAdminUser = await User.create({
      name: 'Tổng Quản Trị Hệ Thống (SUPER ADMIN)',
      email: 'superadmin@phohangma.vn',
      password: 'superadmin123',
      phone: '0999888999',
      address: 'Số 48 Phố Hàng Mã, Hoàn Kiếm, Hà Nội',
      role: 'SUPER_ADMIN',
      permissions: ['ALL'],
    });

    const adminUser = await User.create({
      name: 'Nghệ Nhân Bùi Đức Thắng (Quản Trị)',
      email: 'admin@phohangma.vn',
      password: 'admin123',
      phone: '0396163773',
      address: 'Số 48 Phố Hàng Mã, Hoàn Kiếm, Hà Nội',
      role: 'ADMIN',
      permissions: ['dashboard', 'orders', 'custom_orders', 'products', 'categories', 'inventory', 'coupons', 'reviews', 'customers', 'banners'],
    });

    const staffUser = await User.create({
      name: 'Thợ Cả Trần Văn Toàn (Điều Phối Xưởng)',
      email: 'thoca@phohangma.vn',
      password: 'thoca123',
      phone: '0396163773',
      address: 'Xưởng thủ công truyền thống Hàng Mã',
      role: 'STAFF',
      permissions: ['orders', 'custom_orders', 'inventory'],
    });

    const customerUser = await User.create({
      name: 'Nguyễn Hoàng Long',
      email: 'khachhang@gmail.com',
      password: 'khach123',
      phone: '0903456789',
      address: 'Biệt thự Linh Đàm, Hoàng Mai, Hà Nội',
      role: 'CUSTOMER',
    });

    console.log('--- Seeding Categories ---');
    const categoriesData = [
      {
        name: 'Tiền vàng & Thỏi vàng cổ',
        slug: 'tien-vang',
        description: 'Ngân phiếu cửu phủ, đĩnh vàng thếp kim nhũ dập tay thủ công',
        icon: 'payments',
        sortOrder: 1,
      },
      {
        name: 'Quần áo vàng mã',
        slug: 'quan-ao-ma',
        description: 'Áo chầu, nón chúa, cẩm y tế lễ cổ truyền',
        icon: 'checkroom',
        sortOrder: 2,
      },
      {
        name: 'Hình nhân & Lính hầu',
        slug: 'hinh-nhan',
        description: 'Hình nhân thủ công bồi giấy dó, lính hầu tứ phương nghiêm trang',
        icon: 'person',
        sortOrder: 3,
      },
      {
        name: 'Nhà giấy & Biệt phủ',
        slug: 'nha-giay',
        description: 'Biệt phủ tứ giác, lâu đài sân vườn cổng tam quan tinh xảo',
        icon: 'domain',
        sortOrder: 4,
      },
      {
        name: 'Xe giấy & Phương tiện mã',
        slug: 'xe-giay',
        description: 'Xe hơi mui kín, du thuyền, phi cơ mạ vàng sang trọng',
        icon: 'directions_car',
        sortOrder: 5,
      },
      {
        name: 'Đồ dùng & Trang sức thờ',
        slug: 'do-dung-tho',
        description: 'Tráp ngọc, chuỗi hạt, đồng hồ, điện thoại bồi gấm cổ truyền',
        icon: 'watch',
        sortOrder: 6,
      },
      {
        name: 'Ngựa giấy & Linh vật',
        slug: 'ngua-giay',
        description: 'Ngựa ngũ sắc, voi mã, kỳ lân uy nghiêm khung giang dẻo dai',
        icon: 'pets',
        sortOrder: 7,
      },
      {
        name: 'Bộ lễ trọn gói',
        slug: 'bo-le-tron-goi',
        description: 'Mâm lễ quy chuẩn đàn tràng đầy đủ khoa nghi',
        icon: 'inventory_2',
        sortOrder: 8,
      },
    ];
    const categories = await Category.insertMany(categoriesData);
    const catMap = {};
    categories.forEach((c) => (catMap[c.slug] = c._id));

    console.log('--- Seeding Products ---');
    const productsData = [
      {
        name: 'Bộ Ngựa Ngũ Sắc Đại Tự (5 Con)',
        slug: 'bo-ngua-ngu-sac-dai-tu',
        sku: 'HM-NGUA-01',
        category: catMap['ngua-giay'],
        price: 1850000,
        originalPrice: 2200000,
        unit: 'bộ 5 con',
        description: 'Bộ ngựa 5 màu (Trắng, Xanh, Đỏ, Vàng, Tím) đại diện cho Ngũ Phương Ngũ Hành trong đàn tế Tứ Phủ.',
        details: 'Khung đan bằng nan giang già xứ Bắc, ngoài bọc giấy dó nhuộm phẩm tự nhiên, lưng đóng yên gấm thêu kim tuyến, chân thếp vàng uy phong lẫm liệt.',
        dimensions: 'Cao 1m20 x Dài 90cm',
        material: 'Giấy dó truyền thống, giang cật cổ, phẩm điều Thăng Long',
        thumbnail: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&w=600&q=80',
        images: ['https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&w=800&q=80'],
        stockQuantity: 20,
      },
      {
        name: 'Nón Chúa & Mão Thần Linh Tứ Phủ',
        slug: 'non-chua-mao-than-linh-tu-phu',
        sku: 'HM-MAO-02',
        category: catMap['quan-ao-ma'],
        price: 450000,
        originalPrice: 550000,
        unit: 'chiếc',
        description: 'Mão và nón đội cẩn hạt châu sa dát vàng dùng cho hàng Chầu Bà, Ông Hoàng trong khóa lễ Tứ Phủ.',
        details: 'Chạm trổ hoa văn lưỡng long chầu nguyệt, kết ngọc lấp lánh, tua cờ ngũ hành rủ đều tinh xảo.',
        dimensions: 'Đường kính 35cm x Cao 25cm',
        material: 'Giấy kim ngân, hạt cườm sa, nhung gấm đỏ',
        thumbnail: 'https://images.unsplash.com/photo-1582562124811-c09040d0a901?auto=format&fit=crop&w=600&q=80',
        images: ['https://images.unsplash.com/photo-1582562124811-c09040d0a901?auto=format&fit=crop&w=800&q=80'],
        stockQuantity: 40,
      },
      {
        name: 'Thuyền Rồng Bát Hải Long Vương',
        slug: 'thuyen-rong-bat-hai-long-vuong',
        sku: 'HM-THUYEN-03',
        category: catMap['xe-giay'],
        price: 1200000,
        originalPrice: 1500000,
        unit: 'chiếc',
        description: 'Long chu 3 tầng chở linh binh Thủy Phủ, mạ vảy rồng vàng uốn lượn phong thủy đại cát.',
        details: 'Đầu rồng sơn son thếp vàng chạm nổi 3D, cờ dong trống mở, đầy đủ mái chèo lọng che kiệu rước.',
        dimensions: 'Dài 1m60 x Rộng 45cm x Cao 85cm',
        material: 'Khung giang, giấy kim tuyến ánh đồng, gỗ dán nhẹ',
        thumbnail: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80',
        images: ['https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80'],
        stockQuantity: 15,
      },
      {
        name: 'Cây Vàng Cây Bạc Cung Đình Thép Nở Hoa',
        slug: 'cay-vang-cay-bac-cung-dinh',
        sku: 'HM-CAY-04',
        category: catMap['tien-vang'],
        price: 320000,
        originalPrice: 400000,
        unit: 'cặp (1 vàng + 1 bạc)',
        description: 'Tán vàng tán bạc xếp tầng tỉ mỉ đính đĩnh vàng tiền cổ, tượng trưng cho phúc lộc dồi dào sinh sôi.',
        details: 'Mỗi cây kết đủ 9 tầng hoa lá tiền vàng, thếp kim nhũ sáng bóng không gãy dập khi vận chuyển.',
        dimensions: 'Cao 85cm x Đường kính tán 40cm',
        material: 'Giấy bạc vàng dập nổi, cành trúc uốn',
        thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
        images: ['https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80'],
        stockQuantity: 60,
      },
      {
        name: 'Đội Hình Nhân Chầu Áo Gấm (Bộ 4 Nàng Chầu)',
        slug: 'doi-hinh-nhan-chau-ao-gam',
        sku: 'HM-HINHN-05',
        category: catMap['hinh-nhan'],
        price: 680000,
        originalPrice: 850000,
        unit: 'bộ 4 vị',
        description: 'Hình nhân bồi giấy dó gương mặt thanh thoát đoan trang, mặc áo tứ thân màu gấm theo tứ phủ.',
        details: 'Khuôn mặt vẽ tay thủ công từng nét lông mày mắt ngọc, tay cầm quạt lụa và tráp vàng dâng tiến.',
        dimensions: 'Cao 60cm',
        material: 'Cốt rơm giấy bồi, vải lụa gấm màu',
        thumbnail: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=600&q=80',
        images: ['https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80'],
        stockQuantity: 30,
      },
      {
        name: 'Biệt Phủ Thái Ninh 3 Tầng Giấy Dó Cao Cấp',
        slug: 'biet-phu-thai-ninh-3-tang',
        sku: 'HM-NHA-06',
        category: catMap['nha-giay'],
        price: 2400000,
        originalPrice: 2800000,
        unit: 'căn',
        description: 'Biệt phủ tân cổ điển 3 tầng lầu với đầy đủ sân vườn, bể bơi, nội thất bàn ghế salon bọc da giấy.',
        details: 'Cửa kính mica trong suốt, đèn lồng cổng ngõ phát quang trang trọng, hồ cá cảnh phong thủy.',
        dimensions: 'Rộng 1m10 x Sâu 80cm x Cao 1m45',
        material: 'Bìa carton cứng bồi giấy dó in hoa văn kiến trúc',
        thumbnail: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80',
        images: ['https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80'],
        stockQuantity: 10,
      },
      {
        name: 'Xe Mui Kín Biệt Phủ Cổ Điển Mạ Vàng',
        slug: 'xe-mui-kin-biet-phu-co-dien',
        sku: 'HM-XE-07',
        category: catMap['xe-giay'],
        price: 650000,
        originalPrice: 800000,
        unit: 'chiếc',
        description: 'Xe siêu sang có bác tài xế riêng, nội thất tinh xảo, biển số lộc phát ngũ quý.',
        details: 'Bánh xe lăn được, đèn pha bọc kính trong suốt, có logo biểu tượng dập nổi.',
        dimensions: 'Dài 85cm x Rộng 35cm x Cao 30cm',
        material: 'Giấy couche bóng cao cấp, khung giang định hình',
        thumbnail: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=600&q=80',
        images: ['https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80'],
        stockQuantity: 25,
      },
      {
        name: 'Tập Tiền Vàng Cửu Phủ Ngân Phiếu Bồi Tay',
        slug: 'tien-vang-cuu-phu-ngan-phieu',
        sku: 'HM-TIEN-08',
        category: catMap['tien-vang'],
        price: 150000,
        originalPrice: 180000,
        unit: 'lố 10 tập',
        description: 'Ngân phiếu thông hành cõi thiêng in mộc đỏ chu sa chuẩn mực nghi thức đạo tế.',
        details: 'Giấy dó dai mịn, in bằng mộc khắc gỗ thủ công truyền thống Hàng Mã.',
        dimensions: 'Khổ A4 tiêu chuẩn',
        material: 'Giấy dó Bắc Ninh, mực chu sa đỏ',
        thumbnail: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=600&q=80',
        images: ['https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=800&q=80'],
        stockQuantity: 150,
      },
    ];

    const insertedProducts = await Product.insertMany(productsData);
    const prodMap = {};
    insertedProducts.forEach((p) => (prodMap[p.slug] = p));

    console.log('--- Seeding ProductTemplates (Bộ Mẫu Hàng Mã) ---');
    // Bộ mẫu 1: ĐÀN TỨ PHỦ (Màn hình c70d335b)
    await ProductTemplate.create({
      name: 'Trọn Bộ Đàn Tứ Phủ',
      slug: 'dan-tu-phu',
      subtitle: 'Quy chuẩn đàn tràng tôn nghiêm dành cho nghi lễ Hầu Đồng, Khai Đàn Mở Phủ',
      shortDescription: 'Mẫu đàn thượng hạng đầy đủ Ngũ Phương Ngựa Ngũ Sắc, Thuyền Rồng Bát Hải, Nón Chúa Mão Thần Linh và Hình Nhân Chầu Áo Gấm.',
      description: 'Được thiết kế và cố vấn bởi các nghệ nhân thợ cả phố Hàng Mã lâu năm, bộ mẫu Đàn Tứ Phủ chuẩn mực tuyệt đối theo lối xưa của kinh kỳ Thăng Long. Mọi phối vị từ sắc xanh (Thượng Ngàn), đỏ (Thiên Phủ), trắng (Thoải Phủ) đến vàng (Địa Phủ) đều chuẩn xác theo quy thức đạo lễ.',
      ritualGuide: 'Thích hợp dùng cho các khóa lễ Hầu Thánh, Mở Phủ, Tạ Phủ, Kỳ Yên cầu an đại tự tại các đền, phủ, điện gia thất.',
      thumbnail: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&w=800&q=80',
      images: [
        'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1582562124811-c09040d0a901?auto=format&fit=crop&w=800&q=80',
      ],
      category: 'Đàn Tràng Tứ Phủ',
      tags: ['Đàn Tứ Phủ', 'Hầu Đồng', 'Khai Đàn', 'Mở Phủ', 'Thượng Hạng'],
      priceType: 'CONTACT_FOR_QUOTE',
      basePrice: 4800000,
      status: 'ACTIVE',
      featured: true,
      sortOrder: 1,
      items: [
        {
          productId: prodMap['bo-ngua-ngu-sac-dai-tu']._id,
          productNameSnapshot: prodMap['bo-ngua-ngu-sac-dai-tu'].name,
          defaultQuantity: 1,
          required: true, // BẮT BUỘC: Khách không được bỏ
          removable: false,
          editableQuantity: false, // Không cho sửa số lượng
          sortOrder: 1,
          note: 'Quy chuẩn 5 ông ngựa chầu 5 phương ngũ sắc trang nghiêm',
        },
        {
          productId: prodMap['non-chua-mao-than-linh-tu-phu']._id,
          productNameSnapshot: prodMap['non-chua-mao-than-linh-tu-phu'].name,
          defaultQuantity: 4,
          required: true,
          removable: false,
          editableQuantity: true, // Cho phép tăng giảm số lượng
          sortOrder: 2,
          note: 'Gồm 4 nón chúa đính châu sa đại diện 4 toà',
        },
        {
          productId: prodMap['thuyen-rong-bat-hai-long-vuong']._id,
          productNameSnapshot: prodMap['thuyen-rong-bat-hai-long-vuong'].name,
          defaultQuantity: 1,
          required: false, // KHÔNG BẮT BUỘC: Khách có thể bỏ
          removable: true,
          editableQuantity: true,
          sortOrder: 3,
          note: 'Thuyền rồng chở linh binh quan lớn đệ tam',
        },
        {
          productId: prodMap['cay-vang-cay-bac-cung-dinh']._id,
          productNameSnapshot: prodMap['cay-vang-cay-bac-cung-dinh'].name,
          defaultQuantity: 2,
          required: false,
          removable: true,
          editableQuantity: true,
          sortOrder: 4,
          note: 'Đôi cây vàng cây bạc 9 tầng hoa trái',
        },
        {
          productId: prodMap['doi-hinh-nhan-chau-ao-gam']._id,
          productNameSnapshot: prodMap['doi-hinh-nhan-chau-ao-gam'].name,
          defaultQuantity: 4,
          required: false,
          removable: true,
          editableQuantity: true,
          sortOrder: 5,
          note: 'Bồi giấy dó vẽ mắt phượng áo thêu lụa',
        },
      ],
    });

    // Bộ mẫu 2: BỘ LỄ RẰM THÁNG GIÊNG
    await ProductTemplate.create({
      name: 'Bộ Lễ Rằm Tháng Giêng (Thượng Nguyên)',
      slug: 'bo-le-ram-thang-gieng',
      subtitle: 'Mâm lễ cả năm không bằng rằm tháng Giêng, cầu quốc thái dân an, gia đạo hưng thịnh',
      shortDescription: 'Trọn gói tiền vàng cửu phủ, quần áo ông bà tổ tiên và cặp cây vàng cây bạc đón tài đắc lộc.',
      description: 'Lễ Thượng Nguyên là ngày rằm đầu tiên trong năm mới, ngày Phật giáng lâm cầu phúc lành. Bộ lễ được thiết kế đầy đủ đồ mã tạ ơn gia tiên tiền tổ và thần linh bản thổ.',
      ritualGuide: 'Dâng cúng vào ngày 14 hoặc sáng ngày 15 tháng Giêng âm lịch.',
      thumbnail: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=800&q=80',
      images: ['https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=800&q=80'],
      category: 'Lễ Tiết Bốn Mùa',
      tags: ['Rằm Tháng Giêng', 'Lễ Thượng Nguyên', 'Gia Tiên', 'Thần Linh'],
      priceType: 'PRICE_FIXED',
      basePrice: 1250000,
      status: 'ACTIVE',
      featured: true,
      sortOrder: 2,
      items: [
        {
          productId: prodMap['tien-vang-cuu-phu-ngan-phieu']._id,
          productNameSnapshot: prodMap['tien-vang-cuu-phu-ngan-phieu'].name,
          defaultQuantity: 3,
          required: true,
          removable: false,
          editableQuantity: true,
          sortOrder: 1,
        },
        {
          productId: prodMap['cay-vang-cay-bac-cung-dinh']._id,
          productNameSnapshot: prodMap['cay-vang-cay-bac-cung-dinh'].name,
          defaultQuantity: 1,
          required: false,
          removable: true,
          editableQuantity: true,
          sortOrder: 2,
        },
      ],
    });

    // Bộ mẫu 3: BỘ LỄ VU LAN THẮNG HỘI
    await ProductTemplate.create({
      name: 'Bộ Lễ Vu Lan Báo Hiếu & Xá Tội Vong Nhân',
      slug: 'bo-le-vu-lan-thang-hoi',
      subtitle: 'Trọn gói đồ mã gia tiên báo hiếu cha mẹ và lễ thí thực chúng sinh rằm tháng Bảy',
      shortDescription: 'Bộ lễ trang nghiêm gồm quần áo gấm dâng ông bà cha mẹ, giày dép nón mão và tiền vàng tài mã.',
      description: 'Đáp ứng tấm lòng hiếu kính tổ tiên và tâm từ bi xá tội vong nhân trong đại lễ Vu Lan tháng Bảy.',
      ritualGuide: 'Hành lễ từ ngày mùng 1 đến trước ngày rằm tháng Bảy âm lịch.',
      thumbnail: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80',
      images: ['https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80'],
      category: 'Lễ Tiết Bốn Mùa',
      tags: ['Vu Lan', 'Rằm Tháng Bảy', 'Báo Hiếu', 'Cầu Siêu'],
      priceType: 'PRICE_CALCULATED',
      basePrice: 2450000,
      status: 'ACTIVE',
      featured: true,
      sortOrder: 3,
      items: [
        {
          productId: prodMap['tien-vang-cuu-phu-ngan-phieu']._id,
          productNameSnapshot: prodMap['tien-vang-cuu-phu-ngan-phieu'].name,
          defaultQuantity: 5,
          required: true,
          removable: false,
          editableQuantity: true,
          sortOrder: 1,
        },
        {
          productId: prodMap['doi-hinh-nhan-chau-ao-gam']._id,
          productNameSnapshot: prodMap['doi-hinh-nhan-chau-ao-gam'].name,
          defaultQuantity: 2,
          required: false,
          removable: true,
          editableQuantity: true,
          sortOrder: 2,
        },
      ],
    });

    // Bộ mẫu 4: BỘ LỄ THANH MINH - TẠ MỘ
    await ProductTemplate.create({
      name: 'Bộ Lễ Thanh Minh - Tạ Mộ Tổ Tiên',
      slug: 'bo-le-thanh-minh-ta-mo',
      subtitle: 'Đồ mã thanh tịnh nhỏ gọn, bọc xe mui kín chuyên biệt đi tảo mộ thanh minh',
      shortDescription: 'Mâm lễ tảo mộ gồm bộ vàng mã tạ thần linh thổ địa sơn thần và quần áo trang sức gia tiên.',
      description: 'Lễ Thanh Minh hướng về cội nguồn, sửa sang phần mộ tổ tiên chu tất vẹn tròn.',
      ritualGuide: 'Dâng cúng trong tháng 3 âm lịch (tiết Thanh Minh).',
      thumbnail: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
      images: ['https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80'],
      category: 'Lễ Tiết Bốn Mùa',
      tags: ['Thanh Minh', 'Tảo Mộ', 'Tạ Mộ', 'Hiếu Kính'],
      priceType: 'PRICE_FIXED',
      basePrice: 850000,
      status: 'ACTIVE',
      featured: false,
      sortOrder: 4,
      items: [
        {
          productId: prodMap['tien-vang-cuu-phu-ngan-phieu']._id,
          productNameSnapshot: prodMap['tien-vang-cuu-phu-ngan-phieu'].name,
          defaultQuantity: 2,
          required: true,
          removable: false,
          editableQuantity: true,
          sortOrder: 1,
        },
      ],
    });

    // Banners
    console.log('--- Seeding Banners (Quản lý Banner quảng cáo) ---');
    await Banner.insertMany([
      {
        title: 'Đặt Bộ Mẫu Đàn Tràng – Tiết Kiệm Đến 25%',
        subtitle: 'Di Sản Thủ Công Thăng Long · Chuẩn Khoa Nghi Cổ',
        description: 'Tuyển tập các bộ mẫu đàn tràng quy chuẩn: Đàn Tứ Phủ, Lễ Tiết Bốn Mùa, Lễ Gia Tiên Bản Thổ. Được chế tác kỳ công bởi nghệ nhân phố Hàng Mã bằng nan giang già và giấy dó cổ truyền, giao hàng an tâm bằng xe mui kín chuyên biệt.',
        imageUrl: 'https://images.unsplash.com/photo-1582650625119-3a31f8fa2699?auto=format&fit=crop&w=1200&q=80',
        linkUrl: '/bo-mau',
        linkText: 'Xem Các Bộ Mẫu Chuẩn',
        secondaryLinkUrl: '/tuy-chinh-mau/dan-tu-phu',
        secondaryLinkText: 'Tùy Biến Đàn Tứ Phủ',
        position: 'HOME_HERO',
        badge: 'MẪU NỔI BẬT NĂM NAY',
        cardTitle: 'Trọn Bộ Đàn Tứ Phủ Thượng Hạng',
        cardSubtitle: '5 Ngựa Ngũ Sắc · Thuyền Rồng · Mão Châu Sa · Nàng Chầu',
        cardPriceNote: 'Báo giá trực tiếp theo cấu hình',
        isActive: true,
        sortOrder: 1,
      },
      {
        title: 'Mâm Lễ Khai Trương Tân Gia – Cát Tường Vượng Phát',
        subtitle: 'Cung Tiến Đầy Đủ · Nghênh Đón Tài Lộc',
        description: 'Mẫu lễ cúng đất mở quán, khánh thành công trình với cây vàng cây bạc 9 tầng hoa trái, ngựa hồng phát lộc, tiền vàng cửu phủ in mộc chu sa khai quang thanh tịnh.',
        imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1000&q=80',
        linkUrl: '/bo-mau',
        linkText: 'Xem Mâm Lễ Tân Gia',
        secondaryLinkUrl: '/san-pham',
        secondaryLinkText: 'Chọn Linh Phẩm Lẻ',
        position: 'HOME_HERO',
        badge: 'MÙA LỄ ĐẮC LỘC',
        cardTitle: 'Bộ Lễ Tân Gia Cát Tường',
        cardSubtitle: 'Đầy đủ vàng mã, tráp phẩm trang trọng',
        cardPriceNote: 'Giá niêm yết: 1.850.000 đ',
        isActive: true,
        sortOrder: 2,
      },
      {
        title: 'Chế Tác Vàng Mã Theo Yêu Cầu Riêng Của Bản Đền, Bản Điện',
        subtitle: 'Tâm Truyền Nghề Cổ · Kích Thước Bề Thế',
        description: 'Nhận dựng hình nhân đại tự, thuyền rồng kích thước lớn 2m - 3m, xe cộ biệt phủ kiến trúc cổ theo đúng thước Lỗ Ban và ước nguyện của quý khách.',
        imageUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1200&q=80',
        linkUrl: '/tuy-chinh-mau/dan-tu-phu',
        linkText: 'Gửi Bản Vẽ / Yêu Cầu Chế Tác',
        position: 'HOME_MIDDLE',
        badge: 'XƯỞNG NGHỆ NHÂN HÀNG MÃ',
        isActive: true,
        sortOrder: 1,
      },
    ]);

    console.log('--- Seeding Coupons ---');
    await Coupon.deleteMany();
    await Coupon.insertMany([
      {
        code: 'HANGMA10',
        description: 'Giảm 10% cho đơn hàng tâm linh đầu năm',
        discountType: 'PERCENTAGE',
        discountValue: 10,
        minOrderValue: 500000,
        maxDiscount: 200000,
        usageLimit: 100,
        usedCount: 12,
        userUsageLimit: 1,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
        isActive: true,
      },
      {
        code: 'VULAN50K',
        description: 'Giảm ngay 50.000đ cho đơn lễ Vu Lan',
        discountType: 'FIXED',
        discountValue: 50000,
        minOrderValue: 300000,
        usageLimit: 200,
        usedCount: 45,
        userUsageLimit: 2,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
        isActive: true,
      },
      {
        code: 'DANTUPHUVIP',
        description: 'Ưu đãi 500.000đ cho bộ mẫu Đàn Tứ Phủ đại tự',
        discountType: 'FIXED',
        discountValue: 500000,
        minOrderValue: 4000000,
        usageLimit: 50,
        usedCount: 8,
        userUsageLimit: 1,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
        isActive: true,
      },
    ]);

    console.log('--- Seeding Initial Inventory Logs ---');
    await InventoryLog.deleteMany();
    for (const prod of insertedProducts) {
      await InventoryLog.create({
        productId: prod._id,
        productName: prod.name,
        sku: prod.sku,
        changeType: 'IN',
        quantity: prod.stockQuantity,
        previousStock: 0,
        newStock: prod.stockQuantity,
        reason: 'Khởi tạo tồn kho ban đầu xưởng Hàng Mã',
        referenceCode: 'INIT-STOCK',
        createdBy: adminUser._id,
      });
    }

    console.log('--- Seeding Sample Orders ---');
    const sampleOrders = [
      {
        orderCode: 'DH-20260920-0001',
        customerId: customerUser._id,
        shippingAddress: {
          fullName: customerUser.name,
          phone: customerUser.phone,
          address: customerUser.address,
          city: 'Hà Nội',
          note: 'Giao hàng bằng xe mui kín cẩn thận tránh mưa nắng',
        },
        items: [
          {
            productId: prodMap['bo-ngua-ngu-sac-dai-tu']._id,
            productName: prodMap['bo-ngua-ngu-sac-dai-tu'].name,
            price: prodMap['bo-ngua-ngu-sac-dai-tu'].price,
            quantity: 1,
            note: 'Chuẩn 5 màu ngũ sắc',
          },
          {
            productId: prodMap['non-chua-mao-than-linh-tu-phu']._id,
            productName: prodMap['non-chua-mao-than-linh-tu-phu'].name,
            price: prodMap['non-chua-mao-than-linh-tu-phu'].price,
            quantity: 2,
            note: 'Mão đính châu sa',
          },
        ],
        itemsTotal: 1850000 + 900000,
        craftFee: 0,
        shippingFee: 50000,
        discount: 100000,
        couponCode: 'HANGMA10',
        totalAmount: 2700000,
        orderStatus: 'DELIVERED',
        paymentStatus: 'PAID',
        paymentMethod: 'BANK_TRANSFER',
        timeline: [
          { status: 'PENDING', changedAt: new Date(Date.now() - 5 * 86400000), changedBy: 'Hệ thống', note: 'Đơn hàng được tạo thành công' },
          { status: 'CONFIRMED', changedAt: new Date(Date.now() - 4 * 86400000), changedBy: adminUser.name, note: 'Xác nhận đơn và chuẩn bị xe' },
          { status: 'PROCESSING', changedAt: new Date(Date.now() - 3 * 86400000), changedBy: staffUser.name, note: 'Xưởng kiểm tra đồ mã và bọc nilon bảo vệ' },
          { status: 'SHIPPING', changedAt: new Date(Date.now() - 2 * 86400000), changedBy: staffUser.name, note: 'Xe mui kín đang chuyển tới bản đền' },
          { status: 'DELIVERED', changedAt: new Date(Date.now() - 1 * 86400000), changedBy: staffUser.name, note: 'Giao hàng thành công đúng hẹn' },
        ],
        createdAt: new Date(Date.now() - 5 * 86400000),
      },
      {
        orderCode: 'DH-20260925-0002',
        customerId: customerUser._id,
        shippingAddress: {
          fullName: customerUser.name,
          phone: customerUser.phone,
          address: 'Chùa Phúc Khánh, Đống Đa, Hà Nội',
          city: 'Hà Nội',
          note: 'Chuyển trước 8h sáng ngày lễ',
        },
        items: [
          {
            productId: prodMap['thuyen-rong-bat-hai-long-vuong']._id,
            productName: prodMap['thuyen-rong-bat-hai-long-vuong'].name,
            price: prodMap['thuyen-rong-bat-hai-long-vuong'].price,
            quantity: 1,
          },
          {
            productId: prodMap['cay-vang-cay-bac-cung-dinh']._id,
            productName: prodMap['cay-vang-cay-bac-cung-dinh'].name,
            price: prodMap['cay-vang-cay-bac-cung-dinh'].price,
            quantity: 2,
          },
        ],
        itemsTotal: 1200000 + 640000,
        craftFee: 0,
        shippingFee: 60000,
        discount: 50000,
        couponCode: 'VULAN50K',
        totalAmount: 1850000,
        orderStatus: 'PROCESSING',
        paymentStatus: 'PAID',
        paymentMethod: 'COD',
        timeline: [
          { status: 'PENDING', changedAt: new Date(Date.now() - 2 * 86400000), changedBy: 'Hệ thống', note: 'Đơn hàng mới' },
          { status: 'CONFIRMED', changedAt: new Date(Date.now() - 1 * 86400000), changedBy: adminUser.name, note: 'Xác nhận đơn hàng' },
          { status: 'PROCESSING', changedAt: new Date(), changedBy: staffUser.name, note: 'Thợ cả đang hoàn thiện chi tiết thuyền rồng' },
        ],
        createdAt: new Date(Date.now() - 2 * 86400000),
      },
      {
        orderCode: 'DH-20260928-0003',
        customerId: customerUser._id,
        shippingAddress: {
          fullName: 'Đồng Thầy Lê Minh Tuấn',
          phone: '0977112233',
          address: 'Đền Quan Giám Sát, Lạng Sơn',
          city: 'Lạng Sơn',
          note: 'Kiểm tra kỹ nón mạo châu sa',
        },
        items: [
          {
            productId: prodMap['biet-phu-thai-ninh-3-tang']._id,
            productName: prodMap['biet-phu-thai-ninh-3-tang'].name,
            price: prodMap['biet-phu-thai-ninh-3-tang'].price,
            quantity: 1,
          },
        ],
        itemsTotal: 2400000,
        craftFee: 0,
        shippingFee: 150000,
        discount: 0,
        totalAmount: 2550000,
        orderStatus: 'PENDING',
        paymentStatus: 'PENDING',
        paymentMethod: 'BANK_TRANSFER',
        timeline: [
          { status: 'PENDING', changedAt: new Date(), changedBy: 'Hệ thống', note: 'Khách hàng vừa đặt đơn' },
        ],
        createdAt: new Date(),
      },
    ];
    await Order.insertMany(sampleOrders);

    console.log('--- Seeding Reviews ---');
    await Review.deleteMany();
    await Review.insertMany([
      {
        productId: prodMap['bo-ngua-ngu-sac-dai-tu']._id,
        productNameSnapshot: prodMap['bo-ngua-ngu-sac-dai-tu'].name,
        userId: customerUser._id,
        userName: customerUser.name,
        userEmail: customerUser.email,
        rating: 5,
        comment: 'Đàn ngựa ngũ sắc bề thế, đan nan giang cực kỳ chắc chắn, giấy dó nhuộm sắc chuẩn mực kinh kỳ. Thầy cúng khen rất tôn nghiêm!',
        isVerifiedPurchase: true,
        status: 'APPROVED',
      },
      {
        productId: prodMap['thuyen-rong-bat-hai-long-vuong']._id,
        productNameSnapshot: prodMap['thuyen-rong-bat-hai-long-vuong'].name,
        userId: customerUser._id,
        userName: customerUser.name,
        userEmail: customerUser.email,
        rating: 5,
        comment: 'Thuyền rồng 3 tầng mạ vàng rất đẹp, giao bằng ô tô tải mui kín đến tận cửa đền không một vết nhăn.',
        isVerifiedPurchase: true,
        status: 'APPROVED',
      },
    ]);

    console.log('--- Database seeding completed successfully! ---');
    console.log('Account Tổng Quản Trị (SUPER_ADMIN): superadmin@phohangma.vn / superadmin123');
    console.log('Account Quản Trị (ADMIN): admin@phohangma.vn / admin123');
    console.log('Account Thợ Cả (STAFF): thoca@phohangma.vn / thoca123');
    console.log('Account Khách (CUSTOMER): khachhang@gmail.com / khach123');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seed();
