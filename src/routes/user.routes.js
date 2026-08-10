// src/routes/user.routes.js

const express = require("express");
const router = express.Router();

const userController = require("../controllers/user.controller");
const authMiddleware = require("../middlewares/authMiddleware");
const requireRole = require("../middlewares/roleMiddleware");

// كل الـ routes هنا كتحتاج المستخدم يكون مسجل الدخول
router.use(authMiddleware);

router.get("/me", userController.getMyProfile);
router.patch("/me", userController.updateMyProfile);

// admin only
router.get("/", requireRole("admin"), userController.listUsers);
router.patch("/:id/role", requireRole("admin"), userController.changeRole);

module.exports = router;
