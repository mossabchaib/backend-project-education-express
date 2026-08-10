// src/controllers/category.controller.js
const categoryService = require("../services/category.service");

async function list(req, res) {
  try {
    const categories = await categoryService.getAdminCategories();
    res.status(200).json({ categories });
  } catch (err) {
    console.error("❌ Error inside category.service:", err); // 👈 أضف هذا السطر
    res.status(500).json({ message: "فشل جلب التصنيفات", error: err.message });
  }
}
async function getOne(req, res) {
  try {
    const category = await categoryService.getAdminCategory(req.params.id);
    res.status(200).json({ category });
  } catch (err) {
    res.status(404).json({ message: "التصنيف مالقيناهش", error: err.message });
  }
}

async function create(req, res) {
  try {
    const category = await categoryService.upsertCategory(req.body);
    res.status(201).json({ category });
  } catch (err) {
    res.status(400).json({ message: "فشل إنشاء التصنيف", error: err.message });
  }
}

async function update(req, res) {
  try {
    const category = await categoryService.upsertCategory({ ...req.body, id: req.params.id });
    res.status(200).json({ category });
  } catch (err) {
    res.status(400).json({ message: "فشل تحديث التصنيف", error: err.message });
  }
}

async function remove(req, res) {
  try {
    await categoryService.deleteAdminCategory(req.params.id);
    res.status(200).json({ message: "تم حذف التصنيف" });
  } catch (err) {
    res.status(400).json({ message: "فشل حذف التصنيف", error: err.message });
  }
}

module.exports = { list, getOne, create, update, remove };
