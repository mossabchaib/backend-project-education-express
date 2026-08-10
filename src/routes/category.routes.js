// src/routes/category.routes.js
const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/category.controller");

// عدّل أسماء الـ imports هاذو إيلا كانت مختلفة فـ middlewares متاعك
const verifyToken = require("../middlewares/authMiddleware");
const checkRole = require("../middlewares/roleMiddleware");

// القراءة مفتوحة لكل زائر (كتالوغ التصنيفات)
router.get("/", categoryController.list);
router.get("/:id", categoryController.getOne);

// الكتابة: admin فقط
router.post("/", verifyToken, checkRole("admin"), categoryController.create);
router.put("/:id", verifyToken, checkRole("admin"), categoryController.update);
router.delete("/:id", verifyToken, checkRole("admin"), categoryController.remove);

module.exports = router;
