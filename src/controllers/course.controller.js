// src/controllers/course.controller.js
const courseService = require("../services/course.service");

async function list(req, res) {
  try {
    const { teacherId, categoryId, status } = req.query;
    const courses = await courseService.getTeacherCourses({ teacherId, categoryId, status });
    res.status(200).json({ courses });
  } catch (err) {
    res.status(500).json({ message: "فشل جلب الكورسات", error: err.message });
  }
}

/** كورسات الأستاذ لي كدير login بيه حاليا */
async function listMine(req, res) {
  console.log("req.user.id", req.user);
  try {
    const courses = await courseService.getTeacherCourses({ teacherId: req.user.id });

    res.status(200).json({ courses });
  } catch (err) {
    console.log("error:",err)
    res.status(500).json({ message: "فشل جلب كورساتك", error: err.message });
  }
}

async function getOne(req, res) {
  try {
    const course = await courseService.getTeacherCourse(req.params.id);
    res.status(200).json({ course });
  } catch (err) {
    res.status(404).json({ message: "الكورس مالقيناهش", error: err.message });
  }
}

async function create(req, res) {
  try {
    const payload = { ...req.body, teacher_id: req.body.teacher_id || req.user.id };
    console.log("payload:", payload);
    const course = await courseService.upsertTeacherCourse(payload);
    res.status(201).json({ course });
  } catch (err) {
    res.status(400).json({ message: "فشل إنشاء الكورس", error: err.message });
  }
}

async function update(req, res) {
  try {
    const course = await courseService.upsertTeacherCourse({ ...req.body, id: req.params.id });
    res.status(200).json({ course });
  } catch (err) {
    res.status(400).json({ message: "فشل تحديث الكورس", error: err.message });
  }
}

async function remove(req, res) {
  try {
    await courseService.deleteTeacherCourse(req.params.id);
    res.status(200).json({ message: "تم حذف الكورس" });
  } catch (err) {
    res.status(400).json({ message: "فشل حذف الكورس", error: err.message });
  }
}

module.exports = { list, listMine, getOne, create, update, remove };
