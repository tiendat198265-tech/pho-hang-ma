const ProductTemplate = require('../models/ProductTemplate');
const Product = require('../models/Product');
const CustomOrderRequest = require('../models/CustomOrderRequest');

exports.getAllTemplates = async (req, res) => {
  try {
    const { category, featured, limit } = req.query;
    const query = { status: 'ACTIVE' };

    if (category) query.category = category;
    if (featured === 'true') query.featured = true;

    let queryBuilder = ProductTemplate.find(query)
      .populate('items.productId', 'name slug sku price thumbnail dimensions material unit')
      .sort({ featured: -1, sortOrder: 1, createdAt: -1 });

    if (limit) {
      queryBuilder = queryBuilder.limit(Number(limit));
    }

    let templates = await queryBuilder;

    // Fallback: nếu lọc featured=true mà chưa có mẫu nào featured=true, trả về các mẫu active
    if (featured === 'true' && templates.length === 0) {
      delete query.featured;
      let fallbackQuery = ProductTemplate.find(query)
        .populate('items.productId', 'name slug sku price thumbnail dimensions material unit')
        .sort({ sortOrder: 1, createdAt: -1 });
      if (limit) {
        fallbackQuery = fallbackQuery.limit(Number(limit));
      }
      templates = await fallbackQuery;
    }

    res.json({ success: true, count: templates.length, data: templates });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTemplateBySlug = async (req, res) => {
  try {
    const template = await ProductTemplate.findOne({
      slug: req.params.slug,
      status: { $in: ['ACTIVE', 'DRAFT'] },
    }).populate('items.productId');

    if (!template) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bộ mẫu này' });
    }

    res.json({ success: true, data: template });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAdminTemplates = async (req, res) => {
  try {
    const templates = await ProductTemplate.find()
      .populate('items.productId', 'name sku price')
      .sort({ sortOrder: 1, createdAt: -1 });

    res.json({ success: true, count: templates.length, data: templates });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createTemplate = async (req, res) => {
  try {
    const {
      name,
      slug,
      subtitle,
      description,
      shortDescription,
      thumbnail,
      images,
      category,
      ritualCategory,
      tags,
      priceType,
      basePrice,
      discountPrice,
      ritualGuide,
      status,
      featured,
      sortOrder,
      items,
    } = req.body;

    const generatedSlug =
      slug ||
      name
        .toLowerCase()
        .replace(/[^a-zA-Z0-9\u00C0-\u024F\u1E00-\u1EFF]/g, '-')
        .replace(/-+/g, '-');

    // Populate item snapshots
    const formattedItems = [];
    if (items && Array.isArray(items)) {
      for (const item of items) {
        const prod = item.productId ? await Product.findById(item.productId) : null;
        formattedItems.push({
          productId: item.productId || null,
          productNameSnapshot: item.productNameSnapshot || (prod ? prod.name : '') || item.name || '',
          image: item.image || (prod ? (prod.thumbnail || prod.images?.[0]) : ''),
          description: item.description || item.note || '',
          defaultQuantity: item.defaultQuantity || 1,
          required: item.required !== undefined ? item.required : false,
          removable: item.removable !== undefined ? item.removable : !item.required,
          editableQuantity: item.editableQuantity !== undefined ? item.editableQuantity : true,
          allowNotes: item.allowNotes !== undefined ? item.allowNotes : true,
          sortOrder: item.sortOrder || 0,
          note: item.note || item.description || '',
        });
      }
    }

    const calculatedPriceType =
      priceType ||
      (Number(basePrice) > 0 || Number(discountPrice) > 0
        ? 'PRICE_FIXED'
        : 'CONTACT_FOR_QUOTE');

    const template = await ProductTemplate.create({
      name,
      slug: generatedSlug,
      subtitle,
      description,
      shortDescription,
      thumbnail,
      images: images || [],
      category: ritualCategory || category || 'Đàn Tràng Tứ Phủ',
      tags: tags || [],
      priceType: calculatedPriceType,
      basePrice: Number(basePrice) || 0,
      discountPrice: Number(discountPrice) || 0,
      ritualGuide: ritualGuide || '',
      status: status || 'ACTIVE',
      featured: featured || false,
      sortOrder: sortOrder || 0,
      items: formattedItems,
    });

    res.status(201).json({ success: true, message: 'Tạo bộ mẫu thành công', data: template, template });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateTemplate = async (req, res) => {
  try {
    const template = await ProductTemplate.findById(req.params.id);
    if (!template) return res.status(404).json({ success: false, message: 'Không tìm thấy bộ mẫu' });

    const updatePayload = { ...req.body };
    if (updatePayload.ritualCategory && !updatePayload.category) {
      updatePayload.category = updatePayload.ritualCategory;
    }
    if (Number(updatePayload.basePrice) > 0 || Number(updatePayload.discountPrice) > 0) {
      if (!updatePayload.priceType) {
        updatePayload.priceType = 'PRICE_FIXED';
      }
    }

    // Cập nhật các trường
    Object.assign(template, updatePayload);

    if (req.body.items && Array.isArray(req.body.items)) {
      const formattedItems = [];
      for (const item of req.body.items) {
        const prod = item.productId ? await Product.findById(item.productId) : null;
        formattedItems.push({
          productId: item.productId || null,
          productNameSnapshot: item.productNameSnapshot || (prod ? prod.name : '') || item.name || '',
          image: item.image || (prod ? (prod.thumbnail || prod.images?.[0]) : ''),
          description: item.description || item.note || '',
          defaultQuantity: item.defaultQuantity || 1,
          required: Boolean(item.required),
          removable: item.removable !== undefined ? Boolean(item.removable) : !item.required,
          editableQuantity: item.editableQuantity !== undefined ? Boolean(item.editableQuantity) : true,
          allowNotes: item.allowNotes !== undefined ? Boolean(item.allowNotes) : true,
          sortOrder: item.sortOrder || 0,
          note: item.note || item.description || '',
        });
      }
      template.items = formattedItems;
    }

    await template.save();
    res.json({ success: true, message: 'Cập nhật bộ mẫu thành công', data: template, template });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteTemplate = async (req, res) => {
  try {
    const template = await ProductTemplate.findByIdAndDelete(req.params.id);
    if (!template) return res.status(404).json({ success: false, message: 'Không tìm thấy bộ mẫu' });
    res.json({ success: true, message: 'Xóa bộ mẫu thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.bulkDeleteTemplates = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Vui lòng chọn ít nhất một bộ mẫu để xóa' });
    }

    const result = await ProductTemplate.deleteMany({ _id: { $in: ids } });
    res.json({
      success: true,
      message: `Đã xóa thành công ${result.deletedCount} bộ mẫu khỏi hệ thống`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Lỗi khi xóa hàng loạt bộ mẫu' });
  }
};

exports.toggleStatus = async (req, res) => {
  try {
    const template = await ProductTemplate.findById(req.params.id);
    if (!template) return res.status(404).json({ success: false, message: 'Không tìm thấy bộ mẫu' });

    template.status = template.status === 'ACTIVE' ? 'HIDDEN' : 'ACTIVE';
    await template.save();

    res.json({ success: true, message: `Bộ mẫu hiện đang ở trạng thái: ${template.status}`, data: template });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin tạo bộ mẫu mới từ CustomOrderRequest đã hoàn thành (Yêu cầu XV-T)
exports.createTemplateFromCustomOrder = async (req, res) => {
  try {
    const { customOrderId, name, description, category } = req.body;
    const customOrder = await CustomOrderRequest.findById(customOrderId);
    if (!customOrder) return res.status(404).json({ success: false, message: 'Không tìm thấy yêu cầu tùy chỉnh' });

    const slug = name
      .toLowerCase()
      .replace(/[^a-zA-Z0-9\u00C0-\u024F\u1E00-\u1EFF]/g, '-')
      .replace(/-+/g, '-');

    const items = customOrder.items
      .filter((it) => !it.removedFromTemplate)
      .map((it, idx) => ({
        productId: it.productId,
        productNameSnapshot: it.productNameSnapshot,
        defaultQuantity: it.quantity,
        required: false,
        removable: true,
        editableQuantity: true,
        allowNotes: true,
        sortOrder: idx,
        note: it.note || '',
      }));

    const newTemplate = await ProductTemplate.create({
      name,
      slug: `${slug}-${Date.now().toString().slice(-4)}`,
      description: description || `Bộ mẫu tạo từ yêu cầu đơn lễ ${customOrder.requestCode}`,
      category: category || 'Bộ Lễ Tùy Chỉnh Tiêu Biểu',
      thumbnail: customOrder.globalReferenceImages[0]?.url || '',
      images: customOrder.globalReferenceImages.map((img) => img.url),
      priceType: 'CONTACT_FOR_QUOTE',
      status: 'ACTIVE',
      items,
    });

    res.status(201).json({ success: true, message: 'Đã lưu cấu hình thành bộ mẫu mới', data: newTemplate });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin: Bulk delete templates
exports.bulkDeleteTemplates = async (req, res) => {
  try {
    const ids = req.body.ids || req.body.templateIds;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Vui lòng chọn ít nhất một bộ mẫu để xóa' });
    }

    const deleted = await ProductTemplate.deleteMany({ _id: { $in: ids } });
    res.json({
      success: true,
      message: `Đã xóa thành công ${deleted.deletedCount} bộ mẫu`,
      deletedCount: deleted.deletedCount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
