const express = require("express");
const router = express.Router();

const liveController = require("../controllers/live.controller");
const verifyToken = require("../middlewares/authMiddleware");
const checkRole = require("../middlewares/roleMiddleware");

// جلب كل الجلسات (فلترة اختيارية عبر ?courseId= و ?status=)
router.get("/", verifyToken, liveController.getSessions);

// جلسات كورس معيّن
router.get("/course/:courseId", verifyToken, liveController.getSessionsByCourse);

// جلسة واحدة
router.get("/:id", verifyToken, liveController.getSessionById);

// إنشاء جلسة — للمعلّم/الأدمن فقط
router.post("/", verifyToken, checkRole("teacher", "admin"), liveController.createSession);

// تحديث جلسة — للمعلّم/الأدمن فقط
router.put("/:id", verifyToken, checkRole("teacher", "admin"), liveController.updateSession);

// تعليم الجلسة كمنتهية — للمعلّم/الأدمن فقط
router.patch("/:id/end", verifyToken, checkRole("teacher", "admin"), liveController.endSession);

// حذف جلسة — للمعلّم/الأدمن فقط
router.delete("/:id", verifyToken, checkRole("teacher", "admin"), liveController.deleteSession);

module.exports = router;