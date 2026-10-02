const Product = require('../models/Product');
const Category = require('../models/Category');
const { logAudit } = require('../utils/auditLogger');

// @desc    Public: Quick search for live search dropdown in navbar
// @route   GET /api/products/quick-search?q=...
exports.quickSearch = async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    if (!q || q.length < 1) {
      return res.json({ success: true, products: [], categories: [], templates: [] });
    }

    const regex = new RegExp(q, 'i');
    const slugQuery = q.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '.*');
    const slugRegex = new RegExp(slugQuery, 'i');

    // 1. Matching categories (by name or unaccented slug)
    const categories = await Category.find({
      isActive: true,
      $or: [{ name: regex }, { slug: slugRegex }],
    })
      .select('name slug')
      .limit(3)
      .lean();

    const catIds = categories.map((c) => c._id);

    // 2. Matching products
    const productQuery = {
      status: 'ACTIVE',
      $or: [
        { name: regex },
        { slug: slugRegex },
        { description: regex },
        { tags: { $in: [regex] } },
      ],
    };
    if (catIds.length > 0) {
      productQuery.$or.push({ category: { $in: catIds } });
    }

    const ProductTemplate = require('../models/ProductTemplate');

    const [products, templates] = await Promise.all([
      Product.find(productQuery)
        .select('name slug price originalPrice images category inStock')
        .populate('category', 'name slug')
        .limit(6)
        .lean(),
      ProductTemplate.find({
        status: 'ACTIVE',
        $or: [{ name: regex }, { slug: slugRegex }, { subtitle: regex }, { category: regex }],
      })
        .select('name slug subtitle thumbnail basePrice priceType')
        .limit(3)
        .lean(),
    ]);

    res.json({
      success: true,
      products,
      categories,
      templates,
    });
  } catch (error) {
    console.error('quickSearch error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Public: Get active products
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res) => {
  try {
    const { category, search, sort, isTraditional, page = 1, limit = 50 } = req.query;
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(Math.max(1, Number(limit) || 50), 100);
    const query = { status: 'ACTIVE' };

    if (category) {
      const mongoose = require('mongoose');
      const orConditions = [{ slug: category }];
      if (mongoose.isValidObjectId(category)) {
        orConditions.push({ _id: category });
      }
      orConditions.push({ name: new RegExp(`^${category}$`, 'i') });

      const catDoc = await Category.findOne({ $or: orConditions }).select('_id').lean();
      if (catDoc) {
        query.category = catDoc._id;
      } else {
        query.category = new mongoose.Types.ObjectId();
      }
    }

    if (search) {
      const cleanSearch = String(search).trim();
      const searchRegex = new RegExp(cleanSearch, 'i');

      // Also include products belonging to categories that match the search term
      const matchingCats = await Category.find({ name: searchRegex }).select('_id').lean();
      const catCondition = matchingCats.length > 0 ? [{ category: { $in: matchingCats.map((c) => c._id) } }] : [];

      query.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { tags: { $in: [searchRegex] } },
        ...catCondition,
      ];
    }

    if (isTraditional !== undefined) {
      query.isTraditional = isTraditional === 'true';
    }

    let sortQuery = { createdAt: -1 };
    if (sort === 'price_asc') sortQuery = { price: 1 };
    if (sort === 'price_desc') sortQuery = { price: -1 };
    if (sort === 'name') sortQuery = { name: 1 };

    const skip = (safePage - 1) * safeLimit;

    // Parallelize count and find with projection & lean
    const [total, products] = await Promise.all([
      Product.countDocuments(query),
      Product.find(query)
        .select('name slug sku price originalPrice stockQuantity inStock images featured isTraditional category rating reviewCount soldCount createdAt')
        .populate('category', 'name slug')
        .sort(sortQuery)
        .skip(skip)
        .limit(safeLimit)
        .lean(),
    ]);

    res.json({
      success: true,
      total,
      page: safePage,
      pages: Math.ceil(total / safeLimit),
      data: products,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin: Get all products (including Inactive) with search, filter, pagination
// @route   GET /api/products/admin/all
// @access  Private (Staff/Admin)
exports.getAdminProducts = async (req, res) => {
  try {
    const {
      category,
      search,
      status,
      stock,
      minPrice,
      maxPrice,
      sort = 'newest',
      page = 1,
      limit = 20,
    } = req.query;
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(Math.max(1, Number(limit) || 20), 100);
    const query = {};

    if (category !== undefined && category !== '' && category !== 'ALL') {
      if (category === 'null' || category === 'root') {
        query.category = null;
      } else {
        query.category = category;
      }
    }

    if (status && status !== 'ALL') {
      query.status = status;
    }

    if (stock === 'IN_STOCK') {
      query.stockQuantity = { $gt: 0 };
    } else if (stock === 'OUT_OF_STOCK') {
      query.stockQuantity = { $lte: 0 };
    } else if (stock === 'LOW_STOCK') {
      query.stockQuantity = { $gt: 0, $lte: 5 };
    }

    if (minPrice !== undefined && minPrice !== '') {
      const numMin = Number(minPrice);
      if (!isNaN(numMin)) {
        query.price = { ...(query.price || {}), $gte: numMin };
      }
    }

    if (maxPrice !== undefined && maxPrice !== '') {
      const numMax = Number(maxPrice);
      if (!isNaN(numMax)) {
        query.price = { ...(query.price || {}), $lte: numMax };
      }
    }

    if (search) {
      const cleanSearch = String(search).trim();
      query.$or = [
        { name: { $regex: cleanSearch, $options: 'i' } },
        { sku: { $regex: cleanSearch, $options: 'i' } },
        { description: { $regex: cleanSearch, $options: 'i' } },
      ];
    }

    let sortQuery = { createdAt: -1 };
    if (sort === 'price_asc') sortQuery = { price: 1 };
    if (sort === 'price_desc') sortQuery = { price: -1 };
    if (sort === 'stock_asc') sortQuery = { stockQuantity: 1 };
    if (sort === 'stock_desc') sortQuery = { stockQuantity: -1 };
    if (sort === 'name') sortQuery = { name: 1 };
    if (sort === 'name_desc') sortQuery = { name: -1 };
    if (sort === 'oldest') sortQuery = { createdAt: 1 };

    const [total, products] = await Promise.all([
      Product.countDocuments(query),
      Product.find(query)
        .populate('category', 'name slug')
        .sort(sortQuery)
        .skip((safePage - 1) * safeLimit)
        .limit(safeLimit)
        .lean(),
    ]);

    res.json({
      success: true,
      total,
      data: products,
      products,
      pagination: {
        total,
        page: safePage,
        pages: Math.ceil(total / safeLimit),
        totalPages: Math.ceil(total / safeLimit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Public: Get single product by slug
exports.getProductBySlug = async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug, status: 'ACTIVE' })
      .populate('category', 'name slug')
      .lean();
    if (!product) return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Public/Admin: Get product by ID
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name slug')
      .lean();
    if (!product) return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin: Create product
exports.createProduct = async (req, res) => {
  try {
    const {
      name,
      slug,
      sku,
      category,
      price,
      originalPrice,
      unit,
      description,
      details,
      dimensions,
      material,
      stockQuantity,
      images,
      thumbnail,
      isTraditional,
      tags,
      status,
      seo,
    } = req.body;

    const catDoc = await Category.findById(category);

    const generatedSlug = (slug || name)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const product = await Product.create({
      name,
      slug: generatedSlug,
      sku: sku || `HM-${Date.now().toString().slice(-6)}`,
      category,
      categoryNameSnapshot: catDoc ? catDoc.name : '',
      price: Number(price),
      originalPrice: Number(originalPrice) || 0,
      unit: unit || 'bộ',
      description: description || '',
      details: details || '',
      dimensions: dimensions || '',
      material: material || 'Giấy dó, giang nứa tự nhiên, phẩm điều cổ truyền',
      stockQuantity: Number(stockQuantity) || 50,
      inStock: (Number(stockQuantity) || 50) > 0,
      images: Array.isArray(images) ? images : [],
      thumbnail: thumbnail || (images && images[0]) || '',
      isTraditional: isTraditional !== undefined ? isTraditional : true,
      tags: Array.isArray(tags) ? tags : [],
      status: status || 'ACTIVE',
      seo: seo || { metaTitle: '', metaDescription: '', keywords: '' },
    });

    await logAudit(req, {
      action: 'CREATE_PRODUCT',
      entity: 'PRODUCT',
      entityId: product._id,
      details: `Tạo mới sản phẩm "${product.name}" (SKU: ${product.sku})`,
      metadata: { price: product.price, stock: product.stockQuantity },
    });

    res.status(201).json({ success: true, message: 'Tạo sản phẩm thành công', data: product });
  } catch (error) {
    console.error('createProduct error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin: Update product
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });

    if (req.body.stockQuantity !== undefined) {
      req.body.inStock = Number(req.body.stockQuantity) > 0;
    }
    if (req.body.isActive !== undefined) {
      req.body.status = req.body.isActive ? 'ACTIVE' : 'INACTIVE';
    }

    if (req.body.category && req.body.category !== product.category?.toString()) {
      const cat = await Category.findById(req.body.category);
      if (cat) req.body.categoryNameSnapshot = cat.name;
    }

    Object.assign(product, req.body);
    await product.save();

    await logAudit(req, {
      action: 'UPDATE_PRODUCT',
      entity: 'PRODUCT',
      entityId: product._id,
      details: `Cập nhật sản phẩm "${product.name}"`,
      metadata: req.body,
    });

    res.json({ success: true, message: 'Cập nhật sản phẩm thành công', data: product });
  } catch (error) {
    console.error('updateProduct error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin: Quick update price and stock quantity directly
// @route   PATCH /api/products/:id/quick-update
exports.quickUpdateProduct = async (req, res) => {
  try {
    const { price, originalPrice, stockQuantity, unit, isActive } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
    }

    if (price !== undefined) {
      product.price = Number(price);
    }
    if (originalPrice !== undefined) {
      product.originalPrice = Number(originalPrice);
    }
    if (stockQuantity !== undefined) {
      product.stockQuantity = Math.max(0, Number(stockQuantity));
      product.inStock = product.stockQuantity > 0;
    }
    if (unit !== undefined) {
      product.unit = unit;
    }
    if (isActive !== undefined) {
      product.status = isActive ? 'ACTIVE' : 'INACTIVE';
      product.isActive = Boolean(isActive);
    }

    await product.save();

    await logAudit(req, {
      action: 'QUICK_UPDATE_PRODUCT',
      entity: 'PRODUCT',
      entityId: product._id,
      details: `Cập nhật nhanh "${product.name}": Đơn giá ${product.price}đ, Tồn kho ${product.stockQuantity}`,
      metadata: { price: product.price, stockQuantity: product.stockQuantity },
    });

    res.json({
      success: true,
      message: 'Cập nhật thành công',
      data: product,
    });
  } catch (error) {
    console.error('quickUpdateProduct error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin: Bulk update prices and stock for multiple products
// @route   PATCH /api/products/admin/bulk-update-pricing
exports.bulkUpdatePricing = async (req, res) => {
  try {
    const { updates } = req.body; // Array of { id, price, originalPrice, stockQuantity }
    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ success: false, message: 'Dữ liệu cập nhật không hợp lệ' });
    }

    const bulkOps = updates.map((item) => {
      const setFields = {};
      if (item.price !== undefined) setFields.price = Number(item.price);
      if (item.originalPrice !== undefined) setFields.originalPrice = Number(item.originalPrice);
      if (item.stockQuantity !== undefined) {
        setFields.stockQuantity = Math.max(0, Number(item.stockQuantity));
        setFields.inStock = setFields.stockQuantity > 0;
      }
      return {
        updateOne: {
          filter: { _id: item.id },
          update: { $set: setFields },
        },
      };
    });

    await Product.bulkWrite(bulkOps);

    await logAudit(req, {
      action: 'BULK_UPDATE_PRICING',
      entity: 'PRODUCT',
      details: `Cập nhật hàng loạt giá và tồn kho cho ${updates.length} sản phẩm`,
      metadata: { count: updates.length },
    });

    res.json({
      success: true,
      message: `Đã cập nhật đơn giá & tồn kho cho ${updates.length} sản phẩm`,
    });
  } catch (error) {
    console.error('bulkUpdatePricing error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin: Delete product
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });

    await logAudit(req, {
      action: 'DELETE_PRODUCT',
      entity: 'PRODUCT',
      entityId: product._id,
      details: `Xóa vĩnh viễn sản phẩm "${product.name}"`,
    });

    res.json({ success: true, message: 'Xóa sản phẩm thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin: Bulk update products status
// @route   POST or PATCH /api/products/admin/bulk-status
exports.bulkUpdateProductsStatus = async (req, res) => {
  try {
    const productIds = req.body.productIds || req.body.ids;
    let status = req.body.status;
    if (status === undefined && req.body.isActive !== undefined) {
      status = req.body.isActive ? 'ACTIVE' : 'INACTIVE';
    }
    if (!Array.isArray(productIds) || productIds.length === 0 || !status) {
      return res.status(400).json({ success: false, message: 'Danh sách sản phẩm không hợp lệ' });
    }

    const isActive = status === 'ACTIVE';
    await Product.updateMany({ _id: { $in: productIds } }, { status, isActive });

    await logAudit(req, {
      action: 'BULK_UPDATE_PRODUCT_STATUS',
      entity: 'PRODUCT',
      details: `Cập nhật trạng thái ${status} cho ${productIds.length} sản phẩm`,
      metadata: { productIds, status, isActive },
    });

    res.json({ success: true, message: `Đã cập nhật trạng thái cho ${productIds.length} sản phẩm` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin: Bulk delete products
// @route   POST or DELETE /api/products/admin/bulk-delete
exports.bulkDeleteProducts = async (req, res) => {
  try {
    const productIds = req.body.productIds || req.body.ids;
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Danh sách sản phẩm không hợp lệ' });
    }

    await Product.deleteMany({ _id: { $in: productIds } });

    await logAudit(req, {
      action: 'BULK_DELETE_PRODUCT',
      entity: 'PRODUCT',
      details: `Xóa ${productIds.length} sản phẩm`,
      metadata: { productIds },
    });

    res.json({ success: true, message: `Đã xóa ${productIds.length} sản phẩm` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin: Move single product to another folder
exports.moveProductFolder = async (req, res) => {
  try {
    const { id } = req.params;
    const { targetFolderId } = req.body;

    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });

    let newCategory = null;
    let newCategoryName = 'Lễ Phẩm';

    if (targetFolderId && targetFolderId !== 'root' && targetFolderId !== 'null') {
      const catDoc = await Category.findById(targetFolderId);
      if (!catDoc) return res.status(404).json({ success: false, message: 'Thư mục đích không tồn tại' });
      newCategory = catDoc._id;
      newCategoryName = catDoc.name;
    }

    const previousCategoryName = product.categoryNameSnapshot || 'Chưa phân loại';
    product.category = newCategory;
    product.categoryNameSnapshot = newCategoryName;
    await product.save();

    await logAudit(req, {
      action: 'MOVE_PRODUCT_FOLDER',
      entity: 'PRODUCT',
      entityId: product._id,
      details: `Di chuyển sản phẩm "${product.name}" từ "${previousCategoryName}" sang thư mục "${newCategoryName}"`,
      metadata: { previousCategory: product.category, newCategory },
    });

    res.json({
      success: true,
      message: `Đã chuyển sản phẩm "${product.name}" sang thư mục "${newCategoryName}"`,
      data: product,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin: Bulk move products to another folder
exports.bulkMoveProductsFolder = async (req, res) => {
  try {
    const { productIds, targetFolderId } = req.body;
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Vui lòng chọn ít nhất một sản phẩm để di chuyển' });
    }

    let newCategory = null;
    let newCategoryName = 'Lễ Phẩm';

    if (targetFolderId && targetFolderId !== 'root' && targetFolderId !== 'null') {
      const catDoc = await Category.findById(targetFolderId);
      if (!catDoc) return res.status(404).json({ success: false, message: 'Thư mục đích không tồn tại' });
      newCategory = catDoc._id;
      newCategoryName = catDoc.name;
    }

    await Product.updateMany(
      { _id: { $in: productIds } },
      { $set: { category: newCategory, categoryNameSnapshot: newCategoryName } }
    );

    await logAudit(req, {
      action: 'BULK_MOVE_PRODUCT_FOLDER',
      entity: 'PRODUCT',
      details: `Di chuyển ${productIds.length} sản phẩm sang thư mục "${newCategoryName}"`,
      metadata: { productIds, newCategory },
    });

    res.json({
      success: true,
      message: `Đã di chuyển thành công ${productIds.length} sản phẩm sang thư mục "${newCategoryName}"`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
