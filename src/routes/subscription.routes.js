// src/routes/subscription.routes.js
const express = require("express");
const router = express.Router();
const subscriptionController = require("../controllers/subscription.controller");

const verifyToken = require("../middlewares/authMiddleware");
const checkRole = require("../middlewares/roleMiddleware");

// الطالب
router.post("/", verifyToken, subscriptionController.submit);
router.get("/me", verifyToken, subscriptionController.getMine);

// admin فقط
router.get("/pending", verifyToken, checkRole("admin"), subscriptionController.listPending);
router.get("/", verifyToken, checkRole("admin"), subscriptionController.listAll);
router.put("/:id/approve", verifyToken, checkRole("admin"), subscriptionController.approve);
router.put("/:id/reject", verifyToken, checkRole("admin"), subscriptionController.reject);

module.exports = router;