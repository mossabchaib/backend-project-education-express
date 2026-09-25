// src/app.js

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const uploadRoutes = require("./routes/upload.routes");

const categoryRoutes = require("./routes/category.routes");
const courseRoutes = require("./routes/course.routes");
const moduleRoutes = require("./routes/module.routes");
const lessonRoutes = require("./routes/lesson.routes");
const quizRoutes = require("./routes/quiz.routes");
const progressRoutes = require("./routes/progress.routes");

const liveRoutes = require("./routes/live.routes");
const subscriptionRoutes = require("./routes/subscription.routes");
const ratingRoutes = require("./routes/rating.routes");

const { errorResponse } = require("./utils/response");

const app = express();

app.use((req, res, next) => {
  console.log("========================================");
  console.log("🔥 GLOBAL REQUEST");
  console.log("METHOD:", req.method);
  console.log("URL:", req.originalUrl);
  console.log("HOST:", req.headers.host);
  console.log("USER-AGENT:", req.headers["user-agent"]);
  console.log("AUTH:", req.headers.authorization ? "YES" : "NO");
  console.log("SESSION:", req.headers["x-session-id"] ? "YES" : "NO");
  console.log("========================================");

  next();
});

/*
|--------------------------------------------------------------------------
| CORS
|--------------------------------------------------------------------------
| Production frontend:
|   https://elmanaradz.com
|
| Local Vite development:
|   http://localhost:5173
|--------------------------------------------------------------------------
*/

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "https://elmanaradz.com"
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests without an Origin header.
      // Useful for server-to-server requests and health checks.
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true
  })
);

/*
|--------------------------------------------------------------------------
| Body Parsers
|--------------------------------------------------------------------------
| Accept JSON and URL-encoded requests up to 10 MB.
|--------------------------------------------------------------------------
*/

app.use(express.json({ limit: "10mb" }));

app.use(
  express.urlencoded({
    limit: "10mb",
    extended: true
  })
);

/*
|--------------------------------------------------------------------------
| HTTP Logger
|--------------------------------------------------------------------------
*/

app.use(morgan("dev"));

/*
|--------------------------------------------------------------------------
| Health Check
|--------------------------------------------------------------------------
*/

app.get("/health", (req, res) => {
  res.json({
    status: "ok"
  });
});

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

app.use("/api/live-sessions", liveRoutes);

app.use("/api/subscriptions", subscriptionRoutes);

app.use("/api/auth", authRoutes);

app.use("/api/users", userRoutes);

app.use("/api/uploads", uploadRoutes);

app.use("/api/quizzes", quizRoutes);

app.use("/api/categories", categoryRoutes);

app.use("/api/courses", courseRoutes);

app.use("/api/modules", moduleRoutes);

app.use("/api/lessons", lessonRoutes);

app.use("/api/progress", progressRoutes);

app.use("/api/ratings", ratingRoutes);

/*
|--------------------------------------------------------------------------
| 404 Handler
|--------------------------------------------------------------------------
*/

app.use((req, res) => {
  return errorResponse(res, 404, "Route not found.");
});

/*
|--------------------------------------------------------------------------
| Global Error Handler
|--------------------------------------------------------------------------
*/

app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err);

  return errorResponse(res, 500, "Internal server error.");
});

/*
|--------------------------------------------------------------------------
| Export Express App
|--------------------------------------------------------------------------
*/

module.exports = app;