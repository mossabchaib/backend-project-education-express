const express = require("express");
const router = express.Router();
const quizController = require("../controllers/quiz.controller");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

/* ============ Specific routes FIRST (before /:id) ============ */

// Attempts
router.get("/attempts/mine", authMiddleware, quizController.getMyAttempts);
router.post("/:quizId/attempts", authMiddleware, quizController.saveAttempt);

// Questions (nested under quiz)
router.post(
  "/:quizId/questions",
  authMiddleware,
//   roleMiddleware(["teacher", "admin"]),
  quizController.addQuestion
);
router.put(
  "/:quizId/questions/:questionId",
  authMiddleware,
  roleMiddleware(["teacher", "admin"]),
  quizController.updateQuestion
);
router.delete(
  "/:quizId/questions/:questionId",
  authMiddleware,
  roleMiddleware(["teacher", "admin"]),
  quizController.removeQuestion
);

// Quizzes by course
router.get("/course/:courseId", authMiddleware, quizController.getQuizzesByCourse);

/* ============ Generic /:id routes LAST ============ */

router.get("/:id", authMiddleware, quizController.getQuizById);
router.post("/", authMiddleware, roleMiddleware(["teacher", "admin"]), quizController.createQuiz);
router.put("/:id", authMiddleware, roleMiddleware(["teacher", "admin"]), quizController.updateQuiz);
router.delete("/:id", authMiddleware, roleMiddleware(["teacher", "admin"]), quizController.deleteQuiz);

module.exports = router;
