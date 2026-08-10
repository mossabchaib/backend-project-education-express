// src/routes/course.routes.js
const express = require("express");
const router = express.Router();
const courseController = require("../controllers/course.controller");
const moduleController = require("../controllers/module.controller");
const lessonController = require("../controllers/lesson.controller");

const verifyToken = require("../middlewares/authMiddleware");
const checkRole = require("../middlewares/roleMiddleware");

// كتالوغ الكورسات (published) — مفتوح
router.get("/", courseController.list);

// كورسات الأستاذ المسجّل دخوله حاليا
router.get("/mine", verifyToken, checkRole("teacher", "admin"), courseController.listMine);

router.get("/:id", courseController.getOne);
router.post("/", verifyToken, checkRole("teacher", "admin"), courseController.create);
router.put("/:id", verifyToken, checkRole("teacher", "admin"), courseController.update);
router.delete("/:id", verifyToken, checkRole("teacher", "admin"), courseController.remove);

// موديولات ودروس كورس معين (nested resources)
router.get("/:courseId/modules", moduleController.list);
router.put("/:courseId/modules", verifyToken, checkRole("teacher", "admin"), moduleController.replaceAll);

router.get("/:courseId/lessons", lessonController.list);

module.exports = router;
