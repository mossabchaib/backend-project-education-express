// src/routes/lesson.routes.js
const express = require("express");
const router = express.Router();
const lessonController = require("../controllers/lesson.controller");

const verifyToken = require("../middlewares/authMiddleware");
const checkRole = require("../middlewares/roleMiddleware");

router.get("/:id", lessonController.getOne);
router.put("/:id", verifyToken, checkRole("teacher", "admin"), lessonController.update);
router.delete("/:id", verifyToken, checkRole("teacher", "admin"), lessonController.remove);

module.exports = router;
