const express = require("express");
const router = express.Router();
const ratingController = require("../controllers/rating.controller");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

/* ============ Specific routes FIRST (before /:id) ============ */

// Ratings by course
router.get("/course/:courseId", ratingController.getCourseRatings);
router.get("/course/:courseId/mine", authMiddleware, ratingController.getMyRating);
router.post(
  "/course/:courseId",
  authMiddleware,
  roleMiddleware(["student"]),
  ratingController.rateCourse
);
router.delete(
  "/course/:courseId",
  authMiddleware,
  roleMiddleware(["student"]),
  ratingController.deleteRating
);

/* ============ Generic /:id routes LAST ============ */

router.get("/:id", authMiddleware, ratingController.getRatingById);

module.exports = router;