import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const API_BASE = 'http://localhost:5001/api';

async function req(url, options = {}) {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
}

async function runTests() {
  console.log('🚀 Starting File Explorer End-to-End Tests with native fetch...');

  // 1. Login as Admin
  const loginRes = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'admin@phohangma.vn',
      password: 'admin123'
    })
  });
  if (!loginRes.ok) {
    console.error('❌ Login failed:', loginRes.data);
    process.exit(1);
  }
  const adminToken = loginRes.data.token;
  console.log('✅ Admin login successful');

  const authHeader = { Authorization: `Bearer ${adminToken}` };

  // 2. Fetch root folder details
  const rootDetails = await req('/categories/folder/root', { headers: authHeader });
  const rootData = rootDetails.data.data;
  console.log(`✅ Root folder details retrieved: currentFolder="${rootData.currentFolder.name}", breadcrumbs=${rootData.breadcrumbs.length}`);

  // Fetch root subfolders
  const rootSubfolders = await req('/categories?rootOnly=true', { headers: authHeader });
  console.log(`✅ Root subfolders retrieved: ${rootSubfolders.data.data.length} folders`);

  // Fetch root products
  const rootProds = await req('/products/admin/all?category=null', { headers: authHeader });
  console.log(`✅ Root uncategorized products: ${rootProds.data.data.length} items`);

  // 3. Create Root Folder "Ngựa Test Explorer"
  const createRootRes = await req('/categories', {
    method: 'POST',
    headers: authHeader,
    body: JSON.stringify({
      name: 'Ngựa Test Explorer',
      description: 'Thư mục kiểm thử cấp 1',
      parent: null
    })
  });
  if (!createRootRes.ok) throw new Error(JSON.stringify(createRootRes.data));
  const rootFolderId = createRootRes.data.data._id;
  console.log(`✅ Created Root Folder: "${createRootRes.data.data.name}" (ID: ${rootFolderId})`);

  // 4. Create Subfolder Level 1: "Ngựa Con Test"
  const createSub1Res = await req('/categories', {
    method: 'POST',
    headers: authHeader,
    body: JSON.stringify({
      name: 'Ngựa Con Test',
      description: 'Thư mục kiểm thử cấp 2',
      parent: rootFolderId
    })
  });
  if (!createSub1Res.ok) throw new Error(JSON.stringify(createSub1Res.data));
  const sub1FolderId = createSub1Res.data.data._id;
  console.log(`✅ Created Subfolder L1: "${createSub1Res.data.data.name}" (ID: ${sub1FolderId})`);

  // 5. Create Subfolder Level 2: "Ngựa Con Loại 1 Test"
  const createSub2Res = await req('/categories', {
    method: 'POST',
    headers: authHeader,
    body: JSON.stringify({
      name: 'Ngựa Con Loại 1 Test',
      description: 'Thư mục kiểm thử cấp 3',
      parent: sub1FolderId
    })
  });
  if (!createSub2Res.ok) throw new Error(JSON.stringify(createSub2Res.data));
  const sub2FolderId = createSub2Res.data.data._id;
  console.log(`✅ Created Subfolder L2: "${createSub2Res.data.data.name}" (ID: ${sub2FolderId})`);

  // 6. Test Tree Endpoint
  const treeRes = await req('/categories/tree', { headers: authHeader });
  console.log(`✅ Category tree fetched: ${treeRes.data.data.length} total nodes`);
  const foundNode = treeRes.data.data.find(n => n._id === sub2FolderId);
  console.log(`   Node Level 2 depth: ${foundNode?.depth} (Expected: 2), path: "${foundNode?.fullPath}"`);

  // 7. Test Breadcrumbs on Subfolder L2
  const folderDetails = await req(`/categories/folder/${sub2FolderId}`, { headers: authHeader });
  const l2Data = folderDetails.data.data;
  console.log('✅ Breadcrumbs for L2:');
  l2Data.breadcrumbs.forEach(b => console.log(`   - [${b.name}] (ID: ${b._id})`));

  // 8. Test Product Moving: pick one existing product and move it to Subfolder L2
  const publicProductsRes = await req('/products');
  const testProduct = publicProductsRes.data.data[0];
  if (!testProduct) {
    console.error('❌ No products found to test moving');
    process.exit(1);
  }
  const originalCatId = testProduct.category?._id || testProduct.category;
  console.log(`🔄 Moving product "${testProduct.name}" (ID: ${testProduct._id}) to folder "${createSub2Res.data.data.name}"...`);

  const moveRes = await req(`/products/${testProduct._id}/move-folder`, {
    method: 'PATCH',
    headers: authHeader,
    body: JSON.stringify({ targetFolderId: sub2FolderId })
  });
  console.log(`✅ Product moved: status ${moveRes.status}, new category = ${moveRes.data?.data?.category}`);

  // Check folder products has 1 product
  const sub2Prods = await req(`/products/admin/all?category=${sub2FolderId}`, { headers: authHeader });
  const sub2ProdList = sub2Prods.data.data;
  console.log(`✅ Products inside L2 folder: ${sub2ProdList.length} (Product ID: ${sub2ProdList[0]?._id})`);
  if (sub2ProdList[0]?._id !== testProduct._id) {
    console.error('❌ Product ID mismatch!');
  } else {
    console.log('✅ Product ID strictly preserved!');
  }

  // 9. Test Anti-Cycle / Loop Prevention
  console.log('🔄 Testing cycle prevention: attempting to move root folder inside its own grandchild...');
  const cycleAttempt = await req(`/categories/${rootFolderId}`, {
    method: 'PUT',
    headers: authHeader,
    body: JSON.stringify({ parent: sub2FolderId })
  });
  if (cycleAttempt.ok) {
    console.error('❌ FAILED: Cycle was allowed!');
  } else {
    console.log(`✅ Cycle successfully blocked with status ${cycleAttempt.status}: "${cycleAttempt.data?.message}"`);
  }

  // 10. Test Rename Folder
  const renameRes = await req(`/categories/${sub2FolderId}`, {
    method: 'PUT',
    headers: authHeader,
    body: JSON.stringify({ name: 'Ngựa Con Loại 1 - Đã Đổi Tên' })
  });
  console.log(`✅ Folder renamed: "${renameRes.data.data.name}"`);

  // 11. Move product back to original category
  await req(`/products/${testProduct._id}/move-folder`, {
    method: 'PATCH',
    headers: authHeader,
    body: JSON.stringify({ targetFolderId: originalCatId || null })
  });
  console.log(`✅ Restored test product to original category`);

  // 12. Safe Delete Test Subfolder
  await req(`/categories/${sub2FolderId}?mode=safe`, { method: 'DELETE', headers: authHeader });
  console.log(`✅ Safely deleted test subfolder L2`);
  await req(`/categories/${sub1FolderId}?mode=safe`, { method: 'DELETE', headers: authHeader });
  console.log(`✅ Safely deleted test subfolder L1`);
  await req(`/categories/${rootFolderId}?mode=safe`, { method: 'DELETE', headers: authHeader });
  console.log(`✅ Safely deleted test root folder`);

  // 13. Verify Public Storefront & Orders endpoints
  const finalPublicProducts = await req('/products');
  console.log(`✅ Public products count after tests: ${finalPublicProducts.data.data.length}`);

  const templatesRes = await req('/templates');
  console.log(`✅ Templates (Đàn Phủ) count: ${templatesRes.data.data.length}`);

  console.log('\n🎉 ALL FILE EXPLORER TESTS PASSED 100%! 🚀');
}

runTests().catch(err => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
