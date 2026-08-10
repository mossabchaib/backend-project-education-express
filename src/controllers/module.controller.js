// src/controllers/module.controller.js
const moduleService = require("../services/module.service");

/** GET /api/courses/:courseId/modules -> resolvedModules(courseId) */
async function list(req, res) {
  try {
    const modules = await moduleService.resolvedModules(req.params.courseId);
    res.status(200).json({ modules });
  } catch (err) {
    res.status(500).json({ message: "فشل جلب الموديولات", error: err.message });
  }
}

/**
 * PUT /api/courses/:courseId/modules
 * بديل كامل لكل الموديولات/الدروس متاع الكورس (نفس منطق setStoredModules).
 * body: { modules: [{ id?, title, order_index?, lessons: [{ id?, title, kind, duration, ... }] }] }
 */
async function replaceAll(req, res) {
  try {
    const modules = await moduleService.setStoredModules(req.params.courseId, req.body.modules || []);
    res.status(200).json({ modules });
  } catch (err) {
    res.status(400).json({ message: "فشل حفظ الموديولات", error: err.message });
  }
}

async function remove(req, res) {
  try {
    await moduleService.deleteModule(req.params.id);
    res.status(200).json({ message: "تم حذف الموديول" });
  } catch (err) {
    res.status(400).json({ message: "فشل حذف الموديول", error: err.message });
  }
}

module.exports = { list, replaceAll, remove };
