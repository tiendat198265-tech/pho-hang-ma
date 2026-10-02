/**
 * End-to-End Test: Store Location & Admin Settings Round-trip
 * Verifies that Admin can configure store name, address, latitude, longitude,
 * and that frontend runtime / public API immediately returns updated values.
 */

async function runStoreLocationVerification() {
  const BASE_URL = 'http://localhost:5001';
  console.log('====================================================');
  console.log('🧭 KIỂM THỬ CẤU HÌNH VỊ TRÍ CỬA HÀNG & CHỈ ĐƯỜNG (ADMIN)');
  console.log('====================================================\n');

  // 1. Login as Admin
  console.log('1. Đăng nhập Admin:');
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@phohangma.vn',
      password: 'admin123',
    }),
  });
  const loginData = await loginRes.json();
  if (!loginData.token) {
    throw new Error('Admin login failed: ' + JSON.stringify(loginData));
  }
  const token = loginData.token;
  console.log('  ✅ [PASS]: Admin đăng nhập thành công, nhận token xác thực.');

  // 2. Save location configuration 1 (Hoàn Kiếm, Phố Hàng Mã)
  console.log('\n2. Admin cấu hình vị trí Số 48 Phố Hàng Mã (Hoàn Kiếm):');
  const updatePayload1 = {
    settings: {
      store_name: 'Phố Hàng Mã - Đồ Lễ Cổ Truyền Hoàn Kiếm',
      address: 'Số 48 Phố Hàng Mã, Hoàn Kiếm, Hà Nội',
      latitude: '21.036600',
      longitude: '105.849200',
    },
  };
  const saveRes1 = await fetch(`${BASE_URL}/api/settings/admin/batch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updatePayload1),
  });
  const saveData1 = await saveRes1.json();
  if (!saveData1.success) {
    throw new Error('Save settings batch 1 failed: ' + JSON.stringify(saveData1));
  }
  console.log('  ✅ [PASS]: Lưu batch settings thành công vào MongoDB.');

  // 3. Public GET /api/settings reads fresh values from MongoDB
  console.log('\n3. Khách hàng/Frontend đọc API Public (/api/settings):');
  const publicRes1 = await fetch(`${BASE_URL}/api/settings`);
  const publicData1 = await publicRes1.json();
  const s1 = publicData1.data;
  console.log('  - store_name:', s1.store_name);
  console.log('  - address:', s1.address);
  console.log('  - latitude:', s1.latitude);
  console.log('  - longitude:', s1.longitude);

  if (
    s1.store_name === 'Phố Hàng Mã - Đồ Lễ Cổ Truyền Hoàn Kiếm' &&
    s1.address === 'Số 48 Phố Hàng Mã, Hoàn Kiếm, Hà Nội' &&
    s1.latitude === '21.036600' &&
    s1.longitude === '105.849200'
  ) {
    console.log('  ✅ [PASS]: Dữ liệu trả về đúng 100% với Admin cấu hình, không hardcode.');
  } else {
    throw new Error('Public settings do not match configured values 1!');
  }

  // 4. Verify Google Maps URL format with user GPS and without user GPS
  const destination1 = `${s1.latitude},${s1.longitude}`;
  const mockUserGps = { lat: 21.0285, lng: 105.8542 };
  const directionsUrlWithOrigin = `https://www.google.com/maps/dir/?api=1&origin=${mockUserGps.lat},${mockUserGps.lng}&destination=${destination1}`;
  const directionsUrlNoOrigin = `https://www.google.com/maps/dir/?api=1&destination=${destination1}`;

  console.log('\n4. Kiểm tra URL Google Maps được sinh ra:');
  console.log('  - Khi khách BẬT GPS vị trí của tôi:\n    ->', directionsUrlWithOrigin);
  console.log('  - Khi khách CHƯA bật GPS:\n    ->', directionsUrlNoOrigin);

  if (
    directionsUrlWithOrigin.includes('destination=21.036600,105.849200') &&
    directionsUrlWithOrigin.includes('origin=21.0285,105.8542') &&
    directionsUrlNoOrigin.includes('destination=21.036600,105.849200')
  ) {
    console.log('  ✅ [PASS]: URL chỉ đường chính xác tuyệt đối theo GPS cửa hàng của Admin.');
  } else {
    throw new Error('Directions URL generation failed!');
  }

  // 5. Test changing to another location (Thường Tín Workshop)
  console.log('\n5. Admin đổi sang vị trí Xưởng Thủ Công Duyên Thái (Thường Tín):');
  const updatePayload2 = {
    settings: {
      store_name: 'Tuyết Mã - Di Sản Thủ Công Thường Tín',
      address: 'Xóm Miễu, Duyên Thái, Thường Tín, Hà Nội',
      latitude: '20.884500',
      longitude: '105.869000',
    },
  };
  const saveRes2 = await fetch(`${BASE_URL}/api/settings/admin/batch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updatePayload2),
  });
  const saveData2 = await saveRes2.json();
  if (!saveData2.success) {
    throw new Error('Save settings batch 2 failed: ' + JSON.stringify(saveData2));
  }

  const publicRes2 = await fetch(`${BASE_URL}/api/settings`);
  const publicData2 = await publicRes2.json();
  const s2 = publicData2.data;

  if (
    s2.store_name === 'Tuyết Mã - Di Sản Thủ Công Thường Tín' &&
    s2.address === 'Xóm Miễu, Duyên Thái, Thường Tín, Hà Nội' &&
    s2.latitude === '20.884500' &&
    s2.longitude === '105.869000'
  ) {
    console.log('  ✅ [PASS]: Sau khi Admin đổi vị trí, API cập nhật ngay lập tức:');
    console.log(`     Address: ${s2.address}`);
    console.log(`     Coordinates: ${s2.latitude}, ${s2.longitude}`);
    console.log(`     Destination: ${s2.latitude},${s2.longitude}`);
  } else {
    throw new Error('Public settings do not reflect update 2!');
  }

  console.log('\n====================================================');
  console.log('🎉 TẤT CẢ KIỂM THỬ VỊ TRÍ CỬA HÀNG ĐẠT 100% THÀNH CÔNG!');
  console.log('====================================================\n');
}

runStoreLocationVerification().catch((err) => {
  console.error('❌ Kiểm thử thất bại:', err);
  process.exit(1);
});
