// src/routes/auth.routes.js

const express = require("express");
const router = express.Router();

const authController = require("../controllers/auth.controller");
const authMiddleware = require("../middlewares/authMiddleware");

router.post("/signup", authController.signUp);
router.post("/signin", authController.signIn);
router.post("/signout", authMiddleware, authController.signOut);
router.post("/refresh", authController.refreshSession);
router.post("/forgot-password", authController.forgotPassword);

module.exports = router;
