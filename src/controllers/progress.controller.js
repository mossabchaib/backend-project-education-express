// src/controllers/progress.controller.js
const progressService = require("../services/progress.service");
const { successResponse, errorResponse } = require("../utils/response");

/** GET /api/progress — كل تقدّم المستخدم الحالي (كل الكورسات) */
async function getMyProgress(req, res) {
  try {
    const userId = req.user.id;
    const progress = await progressService.getMyProgress(userId);
    return successResponse(res, 200, "تم جلب التقدّم بنجاح", progress);
  } catch (err) {
    console.error("❌ Error inside progress.service (getMyProgress):", err);
    return errorResponse(res, 500, "فشل جلب التقدّم", err.message);
  }
}

/** GET /api/progress/course/:courseId — تفاصيل خام لكورس واحد */
async function getCourseProgress(req, res) {
  try {
    const userId = req.user.id;
    const { courseId } = req.params;
    const rows = await progressService.getCourseProgress(userId, courseId);
    return successResponse(res, 200, "تم جلب تقدّم الكورس بنجاح", rows);
  } catch (err) {
    console.error("❌ Error inside progress.service (getCourseProgress):", err);
    return errorResponse(res, 500, "فشل جلب تقدّم الكورس", err.message);
  }
}

/** GET /api/progress/course/:courseId/summary — done/total/pct */
async function getCourseProgressSummary(req, res) {
  try {
    const userId = req.user.id;
    const { courseId } = req.params;
    const summary = await progressService.getCourseProgressSummary(userId, courseId);
    return successResponse(res, 200, "تم جلب ملخص التقدّم بنجاح", summary);
  } catch (err) {
    console.error("❌ Error inside progress.service (getCourseProgressSummary):", err);
    return errorResponse(res, 500, "فشل جلب ملخص التقدّم", err.message);
  }
}
/** GET /api/progress/teacher/rollup — ملخص تقدّم الطلبة عبر كل كورسات الأستاذ */
async function getTeacherProgressRollup(req, res) {
  try {
    const teacherId = req.user.id;
    const rollup = await progressService.getTeacherProgressRollup(teacherId);
    return successResponse(res, 200, "تم جلب ملخص تقدّم الطلبة بنجاح", rollup);
  } catch (err) {
    console.error("❌ Error inside progress.service (getTeacherProgressRollup):", err);
    return errorResponse(res, 500, "فشل جلب ملخص التقدّم", err.message);
  }
}
/** POST /api/progress — { courseId, lessonId, completed } */
async function setLessonComplete(req, res) {
  try {
    const userId = req.user.id;
    const { courseId, lessonId, completed } = req.body;

    if (!courseId || !lessonId || typeof completed !== "boolean") {
      return errorResponse(res, 400, "courseId, lessonId, completed كلها مطلوبة");
    }

    const row = await progressService.setLessonComplete(userId, courseId, lessonId, completed);
    return successResponse(res, 200, "تم تحديث التقدّم بنجاح", row);
  } catch (err) {
    console.error("❌ Error inside progress.service (setLessonComplete):", err);
    return errorResponse(res, 400, "فشل تحديث التقدّم", err.message);
  }
}

module.exports = {
  getMyProgress,
  getCourseProgress,
  getCourseProgressSummary,
  setLessonComplete,
  getTeacherProgressRollup, // ⬅️ جديد
};