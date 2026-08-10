// src/controllers/lesson.controller.js
const lessonService = require("../services/lesson.service");

/** GET /api/courses/:courseId/lessons -> flatLessons(courseId) */
async function list(req, res) {
  try {
    const lessons = await lessonService.flatLessons(req.params.courseId);
    res.status(200).json({ lessons });
  } catch (err) {
    res.status(500).json({ message: "فشل جلب الدروس", error: err.message });
  }
}

async function getOne(req, res) {
  try {
    const lesson = await lessonService.getLesson(req.params.id);
    res.status(200).json({ lesson });
  } catch (err) {
    res.status(404).json({ message: "الدرس مالقيناهش", error: err.message });
  }
}

/** POST /api/modules/:moduleId/lessons */
async function create(req, res) {
  try {
    const lesson = await lessonService.addLesson(req.params.moduleId, req.body);
    res.status(201).json({ lesson });
  } catch (err) {
    res.status(400).json({ message: "فشل إنشاء الدرس", error: err.message });
  }
}

async function update(req, res) {
  try {
    const lesson = await lessonService.updateLesson(req.params.id, req.body);
    res.status(200).json({ lesson });
  } catch (err) {
    res.status(400).json({ message: "فشل تحديث الدرس", error: err.message });
  }
}

async function remove(req, res) {
  try {
    await lessonService.deleteLesson(req.params.id);
    res.status(200).json({ message: "تم حذف الدرس" });
  } catch (err) {
    res.status(400).json({ message: "فشل حذف الدرس", error: err.message });
  }
}

module.exports = { list, getOne, create, update, remove };
