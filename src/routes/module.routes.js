// src/routes/module.routes.js
const express = require("express");
const router = express.Router();
const moduleController = require("../controllers/module.controller");
const lessonController = require("../controllers/lesson.controller");

const verifyToken = require("../middlewares/authMiddleware");
const checkRole = require("../middlewares/roleMiddleware");

// حذف موديول بمفرده
router.delete("/:id", verifyToken, checkRole("teacher", "admin"), moduleController.remove);

// دروس موديول معين
router.post("/:moduleId/lessons", verifyToken, checkRole("teacher", "admin"), lessonController.create);

module.exports = router;
