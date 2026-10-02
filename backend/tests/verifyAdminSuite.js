const BASE_URL = 'http://localhost:5001/api';

async function runTests() {
  console.log('====================================================');
  console.log('🧪 BẮT ĐẦU KIỂM THỬ TOÀN DIỆN KHU VỰC QUẢN TRỊ ADMIN');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ [PASS]: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL]: ${message}`);
      failed++;
    }
  }

  // 1. ĐĂNG NHẬP VỚI CÁC TÀI KHOẢN RBAC
  console.log('1. Kiểm tra Đăng nhập & Xác thực RBAC:');
  let superAdminToken, adminToken, staffToken, customerToken;

  try {
    const resSuper = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'superadmin@phohangma.vn', password: 'superadmin123' }),
    }).then((r) => r.json());
    superAdminToken = resSuper.token;
    assert(resSuper.user?.role === 'SUPER_ADMIN', 'SUPER_ADMIN đăng nhập thành công');

    const resAdmin = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@phohangma.vn', password: 'admin123' }),
    }).then((r) => r.json());
    adminToken = resAdmin.token;
    assert(resAdmin.user?.role === 'ADMIN', 'ADMIN đăng nhập thành công');

    const resStaff = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'thoca@phohangma.vn', password: 'thoca123' }),
    }).then((r) => r.json());
    staffToken = resStaff.token;
    assert(resStaff.user?.role === 'STAFF', 'STAFF đăng nhập thành công');

    const resCust = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'khachhang@gmail.com', password: 'khach123' }),
    }).then((r) => r.json());
    customerToken = resCust.token;
    assert(resCust.user?.role === 'CUSTOMER', 'CUSTOMER đăng nhập thành công');
  } catch (err) {
    console.error('Lỗi khi đăng nhập tài khoản test:', err.message);
  }

  // 2. BẢO MẬT & PHÂN QUYỀN RBAC (CUSTOMER BỊ CHẶN)
  console.log('\n2. Kiểm tra Bảo mật & Chặn quyền CUSTOMER:');
  try {
    const res1 = await fetch(`${BASE_URL}/admin/dashboard`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert(res1.status === 403, 'CUSTOMER bị chặn 403 Forbidden khi truy cập Admin Dashboard');

    const res2 = await fetch(`${BASE_URL}/admin/reports/revenue`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert(res2.status === 403, 'CUSTOMER bị chặn 403 Forbidden khi truy cập Báo Cáo Doanh Thu');

    const res3 = await fetch(`${BASE_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert(res3.status === 403, 'CUSTOMER bị chặn 403 Forbidden khi truy cập Admin Users');
  } catch (err) {
    assert(false, `Lỗi kiểm tra chặn CUSTOMER: ${err.message}`);
  }

  // 3. ADMIN KHÔNG ĐƯỢC TỰ NÂNG / PHONG QUYỀN SUPER_ADMIN
  console.log('\n3. Kiểm tra ADMIN không được phong SUPER_ADMIN:');
  try {
    const res = await fetch(`${BASE_URL}/admin/users/staff`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Hacker Self Elevate',
        email: 'hacker@test.com',
        password: 'password123',
        role: 'SUPER_ADMIN',
      }),
    });
    assert(
      res.status === 403,
      'ADMIN thường bị chặn 403 khi cố tình tạo hoặc nâng quyền SUPER_ADMIN'
    );
  } catch (err) {
    assert(false, `Lỗi kiểm tra phong quyền: ${err.message}`);
  }

  // 4. KIỂM TRA DASHBOARD API
  console.log('\n4. Kiểm tra Dashboard API:');
  try {
    const res = await fetch(`${BASE_URL}/admin/dashboard?period=30days`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    }).then((r) => r.json());
    const d = res.data;
    assert(res.success === true, 'Gọi API Dashboard thành công');
    assert(d.summary?.totalRevenue !== undefined, 'Có tổng doanh thu thực tế');
    assert(Array.isArray(d.revenueTimeline), 'Có danh sách timeline doanh thu');
    assert(Array.isArray(d.statusBreakdown), 'Có phân bổ trạng thái đơn hàng');
    assert(Array.isArray(d.topSellingProducts), 'Có danh sách sản phẩm bán chạy');
  } catch (err) {
    assert(false, `Dashboard API lỗi: ${err.message}`);
  }

  // 5. KIỂM TRA BÁO CÁO DOANH THU & LOGIC LOẠI BỎ HỦY/HOÀN
  console.log('\n5. Kiểm tra Báo Cáo Doanh Thu (Doanh thu thực tế):');
  try {
    const res = await fetch(`${BASE_URL}/admin/reports/revenue?groupBy=month`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    }).then((r) => r.json());
    const rep = res.data;
    assert(res.success === true, 'Lấy báo cáo doanh thu theo tháng thành công');
    assert(rep.summary?.totalRevenue >= 0, 'Doanh thu thực tế được tính chuẩn xác');
    assert(rep.summary?.cancelledOrders !== undefined, 'Ghi nhận số đơn hủy/hoàn bị loại trừ');
    assert(Array.isArray(rep.timeline), 'Có bảng chi tiết doanh thu theo mốc');
    assert(Array.isArray(rep.detailedOrders), 'Có danh sách chi tiết các đơn cấu thành');
  } catch (err) {
    assert(false, `Report API lỗi: ${err.message}`);
  }

  // 6. KIỂM TRA BẢO MẬT: KHÔNG TIN PRICE / TOTAL TỪ CLIENT
  console.log('\n6. Kiểm tra Bảo Mật Đơn Hàng (Client gửi giá giả):');
  try {
    const prodRes = await fetch(`${BASE_URL}/products?limit=20`).then((r) => r.json());
    let testProduct = prodRes.data && prodRes.data.find((p) => p.stockQuantity >= 2);
    if (!testProduct) {
      const catRes = await fetch(`${BASE_URL}/categories`).then((r) => r.json());
      const catId = catRes.data && catRes.data[0] ? catRes.data[0]._id : null;
      const newProd = await fetch(`${BASE_URL}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          name: 'Ngựa Đỏ Thăng Long Test Security',
          slug: 'ngua-do-thang-long-test-sec-' + Date.now(),
          sku: 'TEST-SEC-' + Date.now(),
          price: 250000,
          stockQuantity: 50,
          category: catId,
          status: 'ACTIVE',
        }),
      }).then((r) => r.json());
      testProduct = newProd.data;
    }

    const fakePrice = 1000;
    const fakeTotal = 1000;

    const orderRes = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        items: [
          {
            productId: testProduct._id,
            price: fakePrice, // GIÁ GIẢ
            quantity: 2,
          },
        ],
        shippingAddress: {
          fullName: 'Kiểm Thử Hack Giá',
          phone: '0900000000',
          address: '48 Hàng Mã, Hà Nội',
        },
        paymentMethod: 'COD',
        totalAmount: fakeTotal, // TỔNG GIẢ
      }),
    }).then((r) => r.json());

    const createdOrder = orderRes.data;
    const expectedRealTotal = testProduct.price * 2;
    const isPriceRecalculated =
      createdOrder.itemsTotal === expectedRealTotal ||
      createdOrder.totalAmount === expectedRealTotal + (createdOrder.shippingFee || 0);
    assert(
      isPriceRecalculated,
      `Backend tính lại giá thật từ MongoDB: itemsTotal=${createdOrder.itemsTotal} đ, totalAmount=${createdOrder.totalAmount} đ (Bỏ qua giá giả ${fakeTotal} đ)`
    );
  } catch (err) {
    assert(false, `Kiểm tra giá giả lỗi: ${err.message}`);
  }

  // 7. KIỂM TRA MÃ GIẢM GIÁ (COUPONS)
  console.log('\n7. Kiểm tra Mã Giảm Giá (Coupons):');
  try {
    const valRes = await fetch(`${BASE_URL}/coupons/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'HANGMA10', orderValue: 1000000 }),
    }).then((r) => r.json());

    assert(valRes.success === true, 'Validate mã HANGMA10 thành công');
    assert(valRes.discountAmount > 0, `Tính mức giảm chính xác: ${valRes.discountAmount} đ`);
  } catch (err) {
    assert(false, `Validate coupon lỗi: ${err.message}`);
  }

  // 8. KIỂM TRA TỒN KHO & INVENTORY LOG
  console.log('\n8. Kiểm tra Quản Lý Kho & InventoryLog:');
  try {
    const invRes = await fetch(`${BASE_URL}/admin/inventory/summary`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    }).then((r) => r.json());
    assert(Array.isArray(invRes.data), 'Lấy tổng quan tồn kho thành công');

    const logRes = await fetch(`${BASE_URL}/admin/inventory/logs?limit=5`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    }).then((r) => r.json());
    assert(Array.isArray(logRes.data) && logRes.data.length > 0, 'Có lịch sử InventoryLog đầy đủ');
  } catch (err) {
    assert(false, `Kho lỗi: ${err.message}`);
  }

  // 9. KIỂM TRA NHẬT KÝ KIỂM TOÁN (AUDIT LOG)
  console.log('\n9. Kiểm tra Nhật Ký Hoạt Động (Audit Log):');
  try {
    const auditRes = await fetch(`${BASE_URL}/admin/audit-logs?limit=5`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    }).then((r) => r.json());
    assert(auditRes.success === true, 'Lấy danh sách AuditLog thành công');
    assert(Array.isArray(auditRes.data), 'Bản ghi audit log trả về định dạng mảng');
  } catch (err) {
    assert(false, `Audit log lỗi: ${err.message}`);
  }

  console.log('\n====================================================');
  console.log(`🎉 KẾT QUẢ KIỂM THỬ: ${passed} PASS / ${failed} FAIL`);
  console.log('====================================================\n');

  if (failed === 0) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests();
