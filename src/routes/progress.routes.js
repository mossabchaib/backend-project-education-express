// src/routes/progress.routes.js
const express = require("express");
const router = express.Router();
const progressController = require("../controllers/progress.controller");

const verifyToken = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

// كل الـ endpoints خاصة بتقدّم المستخدم الحالي فقط — تتطلب تسجيل دخول
router.get("/", verifyToken, progressController.getMyProgress);
router.get("/course/:courseId", verifyToken, progressController.getCourseProgress);
router.get("/course/:courseId/summary", verifyToken, progressController.getCourseProgressSummary);
router.post("/", verifyToken, progressController.setLessonComplete);

// خاص بالأستاذ: ملخص تقدّم الطلبة عبر كل كورساته
router.get(
  "/teacher/rollup",
  verifyToken,
  roleMiddleware(["teacher", "admin"]),
  progressController.getTeacherProgressRollup
);

module.exports = router;