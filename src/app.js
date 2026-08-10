// src/app.js

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const uploadRoutes = require("./routes/upload.routes");

// 1. استدعاء مسارات المحتوى التعليمي الجديدة
const categoryRoutes = require("./routes/category.routes");
const courseRoutes = require("./routes/course.routes");
const moduleRoutes = require("./routes/module.routes");
const lessonRoutes = require("./routes/lesson.routes");
const quizRoutes = require("./routes/quiz.routes");
const progressRoutes = require("./routes/progress.routes");
const { errorResponse } = require("./utils/response");
const liveRoutes = require("./routes/live.routes");
const subscriptionRoutes = require("./routes/subscription.routes");
const app = express();


app.use(cors());

// 🟢 رفع حجم الـ JSON المقبول لـ 10MB (عوض 100KB الافتراضية)
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use("/api/live-sessions", liveRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use(morgan("dev"));

// Health check
app.get("/health", (req, res) => res.json({ status: "ok" }));

// Routes الرئيسية
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/modules", moduleRoutes);
app.use("/api/lessons", lessonRoutes);
app.use("/api/progress", progressRoutes);
// 404 Handler
app.use((req, res) => errorResponse(res, 404, "Route not found."));

app.use((err, req, res, next) => {
  console.error(err);
  return errorResponse(res, 500, "Internal server error.");
});

module.exports = app;