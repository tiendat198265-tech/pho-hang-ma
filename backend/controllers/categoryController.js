const Category = require('../models/Category');
const Product = require('../models/Product');
const { logAudit } = require('../utils/auditLogger');
const mongoose = require('mongoose');

// Helper: Sinh slug không trùng
const generateUniqueSlug = async (name, customSlug, excludeId = null) => {
  let base = (customSlug || name)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (!base) base = 'folder-' + Date.now();

  let slug = base;
  let counter = 1;
  while (true) {
    const existing = await Category.findOne({
      slug,
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    }).select('_id').lean();

    if (!existing) return slug;
    slug = `${base}-${counter}`;
    counter++;
  }
};

// Helper: Kiểm tra targetChildId có phải là con/cháu của parentId không (Chống vòng lặp đệ quy)
const checkIsDescendant = async (parentId, targetChildId) => {
  if (!targetChildId) return false;
  if (String(parentId) === String(targetChildId)) return true;

  let currentId = targetChildId;
  const visited = new Set();

  while (currentId) {
    if (String(currentId) === String(parentId)) {
      return true;
    }
    if (visited.has(String(currentId))) break;
    visited.add(String(currentId));

    const cat = await Category.findById(currentId).select('parent').lean();
    if (!cat || !cat.parent) break;
    currentId = cat.parent;
  }

  return false;
};

// Helper: Lấy chuỗi breadcrumbs từ Root đến folder hiện tại
const buildBreadcrumbs = async (folderId) => {
  const breadcrumbs = [{ _id: 'root', name: 'Lễ Phẩm' }];
  if (!folderId || folderId === 'root') return breadcrumbs;

  let currentId = folderId;
  const chain = [];
  const visited = new Set();

  while (currentId) {
    if (visited.has(String(currentId))) break;
    visited.add(String(currentId));

    const cat = await Category.findById(currentId).select('_id name parent slug').lean();
    if (!cat) break;
    chain.unshift({ _id: cat._id, name: cat.name, slug: cat.slug });
    currentId = cat.parent;
  }

  return [...breadcrumbs, ...chain];
};

// @desc    Public: Get active categories (supports ?parentId=... or returns all flat)
exports.getAllCategories = async (req, res) => {
  try {
    const { parentId, rootOnly, includeInactive } = req.query;

    let query = includeInactive === 'true' ? {} : { isActive: true };
    if (rootOnly === 'true' || parentId === 'null' || parentId === 'root') {
      query.parent = null;
    } else if (parentId && mongoose.isValidObjectId(parentId)) {
      query.parent = parentId;
    }

    const categories = await Category.find(query).sort({ sortOrder: 1, createdAt: 1 }).lean();

    const categoriesWithCount = await Promise.all(
      categories.map(async (cat) => {
        const [productCount, subFolderCount] = await Promise.all([
          Product.countDocuments({ category: cat._id, status: 'ACTIVE' }),
          Category.countDocuments({ parent: cat._id, isActive: true }),
        ]);
        return {
          ...cat,
          productCount,
          subFolderCount,
        };
      })
    );

    res.json({ success: true, count: categoriesWithCount.length, data: categoriesWithCount });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin: Get categories (supports hierarchical browsing by parentId)
exports.getAdminCategories = async (req, res) => {
  try {
    const { parentId, rootOnly } = req.query;

    let query = {};
    if (rootOnly === 'true' || parentId === 'null' || parentId === 'root') {
      query.parent = null;
    } else if (parentId && mongoose.isValidObjectId(parentId)) {
      query.parent = parentId;
    }

    const categories = await Category.find(query).sort({ sortOrder: 1, createdAt: 1 }).lean();

    const categoriesWithCounts = await Promise.all(
      categories.map(async (cat) => {
        const [productCount, subFolderCount] = await Promise.all([
          Product.countDocuments({ category: cat._id }),
          Category.countDocuments({ parent: cat._id }),
        ]);
        return {
          ...cat,
          productCount,
          subFolderCount,
        };
      })
    );

    res.json({ success: true, count: categoriesWithCounts.length, data: categoriesWithCounts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin/Public: Get full folder tree (flat with level & path for destination picker dropdowns)
exports.getCategoryTree = async (req, res) => {
  try {
    const allCategories = await Category.find({ isActive: true })
      .select('_id name parent slug sortOrder')
      .sort({ sortOrder: 1, name: 1 })
      .lean();

    // Attach children count and build flat tree with indent level
    const countMap = {};
    const subFolderCountMap = {};

    const [productCounts, folderDocs] = await Promise.all([
      Product.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
      ]),
      Category.find().select('parent').lean(),
    ]);

    productCounts.forEach((p) => {
      if (p._id) countMap[String(p._id)] = p.count;
    });

    folderDocs.forEach((f) => {
      if (f.parent) {
        const pid = String(f.parent);
        subFolderCountMap[pid] = (subFolderCountMap[pid] || 0) + 1;
      }
    });

    // Build hierarchical tree structure
    const tree = [];
    const buildFlatList = (parentId = null, level = 0, prefix = '') => {
      const children = allCategories.filter((c) => {
        if (!parentId) return !c.parent;
        return String(c.parent) === String(parentId);
      });

      for (const item of children) {
        const pathName = prefix ? `${prefix} / ${item.name}` : item.name;
        tree.push({
          _id: item._id,
          name: item.name,
          parent: item.parent,
          level,
          pathName,
          productCount: countMap[String(item._id)] || 0,
          subFolderCount: subFolderCountMap[String(item._id)] || 0,
        });
        buildFlatList(item._id, level + 1, pathName);
      }
    };

    buildFlatList(null, 0, '');

    res.json({ success: true, data: tree });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin: Get folder details with breadcrumbs & stats
exports.getFolderDetails = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || id === 'root') {
      const [rootFolderCount, rootProductCount] = await Promise.all([
        Category.countDocuments({ parent: null }),
        Product.countDocuments({ category: null }),
      ]);

      return res.json({
        success: true,
        data: {
          currentFolder: { _id: 'root', name: 'Lễ Phẩm' },
          breadcrumbs: [{ _id: 'root', name: 'Lễ Phẩm' }],
          subFolderCount: rootFolderCount,
          productCount: rootProductCount,
        },
      });
    }

    const folder = await Category.findById(id).lean();
    if (!folder) {
      return res.status(404).json({ success: false, message: 'Thư mục không tồn tại' });
    }

    const [breadcrumbs, subFolderCount, productCount] = await Promise.all([
      buildBreadcrumbs(folder._id),
      Category.countDocuments({ parent: folder._id }),
      Product.countDocuments({ category: folder._id }),
    ]);

    res.json({
      success: true,
      data: {
        currentFolder: folder,
        breadcrumbs,
        subFolderCount,
        productCount,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin: Create folder/category
exports.createCategory = async (req, res) => {
  try {
    const { name, slug, parent, description, icon, image, sortOrder, isActive } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Tên thư mục là bắt buộc' });
    }

    let parentId = null;
    if (parent && parent !== 'root' && parent !== 'null') {
      if (!mongoose.isValidObjectId(parent)) {
        return res.status(400).json({ success: false, message: 'Thư mục cha không hợp lệ' });
      }
      const parentDoc = await Category.findById(parent);
      if (!parentDoc) {
        return res.status(404).json({ success: false, message: 'Thư mục cha không tồn tại' });
      }
      parentId = parentDoc._id;
    }

    const generatedSlug = await generateUniqueSlug(name.trim(), slug);

    const category = await Category.create({
      name: name.trim(),
      slug: generatedSlug,
      parent: parentId,
      description: description || '',
      icon: icon || 'folder',
      image: image || '',
      sortOrder: Number(sortOrder) || 0,
      isActive: isActive !== undefined ? isActive : true,
    });

    await logAudit(req, {
      action: 'CREATE_CATEGORY',
      entity: 'CATEGORY',
      entityId: category._id,
      details: `Tạo mới thư mục "${category.name}" (Slug: ${category.slug}, Cha: ${parentId || 'Root'})`,
    });

    res.status(201).json({
      success: true,
      message: `Tạo thư mục "${category.name}" thành công`,
      data: category,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin: Update folder/category (supports rename & moving to new parent with cycle check)
exports.updateCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: 'Không tìm thấy thư mục' });

    const { name, parent, description, icon, image, sortOrder, isActive } = req.body;

    // Check parent change & prevent recursive loops
    if (parent !== undefined) {
      let targetParentId = null;
      if (parent && parent !== 'root' && parent !== 'null') {
        if (!mongoose.isValidObjectId(parent)) {
          return res.status(400).json({ success: false, message: 'Thư mục cha không hợp lệ' });
        }

        targetParentId = parent;

        // 1. Cannot be own parent
        if (String(category._id) === String(targetParentId)) {
          return res.status(400).json({
            success: false,
            message: 'Không thể di chuyển thư mục vào chính nó',
          });
        }

        // 2. Cannot move to its own descendants
        const isLoop = await checkIsDescendant(category._id, targetParentId);
        if (isLoop) {
          return res.status(400).json({
            success: false,
            message: 'Không thể di chuyển thư mục cha vào thư mục con cháu của chính nó (nguy cơ tạo vòng lặp vô tận)',
          });
        }
      }
      category.parent = targetParentId;
    }

    if (name && name.trim()) {
      category.name = name.trim();
    }
    if (description !== undefined) category.description = description;
    if (icon !== undefined) category.icon = icon;
    if (image !== undefined) category.image = image;
    if (sortOrder !== undefined) category.sortOrder = Number(sortOrder) || 0;
    if (isActive !== undefined) category.isActive = isActive;

    await category.save();

    await logAudit(req, {
      action: 'UPDATE_CATEGORY',
      entity: 'CATEGORY',
      entityId: category._id,
      details: `Cập nhật thư mục "${category.name}" (Cha: ${category.parent || 'Root'})`,
      metadata: req.body,
    });

    res.json({
      success: true,
      message: `Cập nhật thư mục "${category.name}" thành công`,
      data: category,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin: Delete folder/category safely
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: 'Không tìm thấy thư mục' });

    const deleteCascade =
      req.query.cascade === 'true' ||
      req.body?.cascade === true ||
      req.query.deleteProducts === 'true' ||
      req.body?.deleteProducts === true;
    const parentId = category.parent || null;

    const [childFoldersCount, productsCount] = await Promise.all([
      Category.countDocuments({ parent: category._id }),
      Product.countDocuments({ category: category._id }),
    ]);

    if (deleteCascade) {
      // Find all descendant categories recursively
      const allDescendantIds = [];
      const collectDescendants = async (cid) => {
        const children = await Category.find({ parent: cid }).select('_id').lean();
        for (const c of children) {
          allDescendantIds.push(c._id);
          await collectDescendants(c._id);
        }
      };
      await collectDescendants(category._id);

      const targetIds = [category._id, ...allDescendantIds];

      // Delete all products inside this entire subtree
      await Product.deleteMany({ category: { $in: targetIds } });
      // Delete all folders in subtree
      await Category.deleteMany({ _id: { $in: targetIds } });

      await logAudit(req, {
        action: 'DELETE_CATEGORY_CASCADE',
        entity: 'CATEGORY',
        entityId: category._id,
        details: `Xóa vĩnh viễn thư mục "${category.name}" và ${allDescendantIds.length} thư mục con cùng toàn bộ sản phẩm bên trong`,
      });

      return res.json({
        success: true,
        message: `Đã xóa thư mục "${category.name}" và toàn bộ ${allDescendantIds.length} thư mục con bên trong`,
      });
    }

    // Safe mode (default): Move children and products to current folder's parent
    if (childFoldersCount > 0) {
      await Category.updateMany({ parent: category._id }, { $set: { parent: parentId } });
    }

    if (productsCount > 0) {
      const parentName = parentId
        ? (await Category.findById(parentId).select('name').lean())?.name || ''
        : 'Lễ Phẩm';

      await Product.updateMany(
        { category: category._id },
        { $set: { category: parentId, categoryNameSnapshot: parentName } }
      );
    }

    await Category.findByIdAndDelete(category._id);

    await logAudit(req, {
      action: 'DELETE_CATEGORY',
      entity: 'CATEGORY',
      entityId: category._id,
      details: `Xóa thư mục "${category.name}" (Bảo toàn: Đã chuyển ${childFoldersCount} thư mục con và ${productsCount} sản phẩm lên thư mục cha)`,
    });

    res.json({
      success: true,
      message: `Đã xóa thư mục "${category.name}". ${
        childFoldersCount > 0 || productsCount > 0
          ? `Đã bảo toàn ${childFoldersCount} thư mục con và ${productsCount} sản phẩm sang cấp cha.`
          : ''
      }`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin: Bulk delete categories
exports.bulkDeleteCategories = async (req, res) => {
  try {
    const ids = req.body.ids || req.body.categoryIds;
    const deleteCascade =
      req.query?.cascade === 'true' ||
      req.body?.cascade === true ||
      req.query?.deleteProducts === 'true' ||
      req.body?.deleteProducts === true;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Vui lòng chọn ít nhất một thư mục' });
    }

    const categories = await Category.find({ _id: { $in: ids } });
    if (categories.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thư mục nào phù hợp' });
    }

    const catIds = categories.map((c) => c._id);
    const catNames = categories.map((c) => c.name);

    if (deleteCascade) {
      // Find all descendant categories recursively
      const allDescendantIds = [];
      const collectDescendants = async (cid) => {
        const children = await Category.find({ parent: cid }).select('_id').lean();
        for (const c of children) {
          allDescendantIds.push(c._id);
          await collectDescendants(c._id);
        }
      };
      for (const cid of catIds) {
        await collectDescendants(cid);
      }
      const targetIds = [...catIds, ...allDescendantIds];

      await Product.deleteMany({ category: { $in: targetIds } });
      await Category.deleteMany({ _id: { $in: targetIds } });

      await logAudit(req, {
        action: 'BULK_DELETE_CATEGORIES_CASCADE',
        entity: 'CATEGORY',
        details: `Xóa hàng loạt ${categories.length} thư mục và toàn bộ sản phẩm bên trong: ${catNames.join(', ')}`,
      });

      return res.json({
        success: true,
        deletedCount: categories.length,
        message: `Đã xóa hàng loạt ${categories.length} thư mục và toàn bộ sản phẩm liên quan`,
      });
    }

    // Default safe: move subfolders and products up to Root null
    await Promise.all([
      Category.updateMany({ parent: { $in: catIds } }, { $set: { parent: null } }),
      Product.updateMany(
        { category: { $in: catIds } },
        { $set: { category: null, categoryNameSnapshot: 'Lễ Phẩm' } }
      ),
      Category.deleteMany({ _id: { $in: catIds } }),
    ]);

    await logAudit(req, {
      action: 'BULK_DELETE_CATEGORIES',
      entity: 'CATEGORY',
      details: `Xóa hàng loạt ${categories.length} thư mục: ${catNames.join(', ')}`,
    });

    res.json({
      success: true,
      deletedCount: categories.length,
      message: `Đã xóa ${categories.length} thư mục và bảo toàn các sản phẩm liên quan sang thư mục gốc`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
