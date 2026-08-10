const quizService = require("../services/quiz.service");
const { successResponse, errorResponse } = require("../utils/response");
const logger = require("../utils/logger");

/* ============ Quizzes ============ */

exports.getQuizzesByCourse = async (req, res) => {
  try {
    console.log("getQuizzesByCourse called with courseId:", req.params.courseId);

    const data = await quizService.getQuizzesByCourse(req.params.courseId);

    return successResponse(res, 200, "Quizzes retrieved successfully", data);
  } catch (err) {
    console.log("getQuizzesByCourse failed", err);
    return errorResponse(res, 500, err.message);
  }
};

exports.getQuizById = async (req, res) => {
  try {
    const data = await quizService.getQuizById(req.params.id);

    return successResponse(res, 200, "Quiz retrieved successfully", data);
  } catch (err) {
    console.log("getQuizById failed", err);
    return errorResponse(res, 500, err.message);
  }
};

exports.createQuiz = async (req, res) => {
  try {
    console.log("createQuiz called with data:", req.body);
    const data = await quizService.createQuiz(req.body);

    return successResponse(res, 201, "Quiz created successfully", data);
  } catch (err) {
    console.log("createQuiz failed", err);
    return errorResponse(res, 500, err.message);
  }
};

exports.updateQuiz = async (req, res) => {
  try {
    const data = await quizService.updateQuiz(req.params.id, req.body);

    return successResponse(res, 200, "Quiz updated successfully", data);
  } catch (err) {
    console.log("updateQuiz failed", err);
    return errorResponse(res, 500, err.message);
  }
};

exports.deleteQuiz = async (req, res) => {
  try {
    await quizService.deleteQuiz(req.params.id);

    return successResponse(res, 200, "Quiz deleted successfully", { deleted: true });
  } catch (err) {
    console.log("deleteQuiz failed", err);
    return errorResponse(res, 500, err.message);
  }
};

/* ============ Attempts ============ */

exports.saveAttempt = async (req, res) => {
  try {
    const studentId = req.user.id;

    const data = await quizService.saveAttempt(req.params.quizId, studentId, req.body);

    return successResponse(res, 201, "Attempt saved successfully", data);
  } catch (err) {
    console.log("saveAttempt failed", err);
    return errorResponse(res, 500, err.message);
  }
};

exports.getMyAttempts = async (req, res) => {
  try {
    const data = await quizService.getAttemptsByStudent(req.user.id);

    return successResponse(res, 200, "Attempts retrieved successfully", data);
  } catch (err) {
    console.log("getMyAttempts failed", err);
    return errorResponse(res, 500, err.message);
  }
};

/* ============ Questions ============ */

exports.addQuestion = async (req, res) => {
  try {
    const data = await quizService.addQuestion(req.params.quizId, req.body);

    return successResponse(res, 201, "Question added successfully", data);
  } catch (err) {
    console.log("addQuestion failed", err);
    return errorResponse(res, 500, err.message);
  }
};

exports.updateQuestion = async (req, res) => {
  try {
    const data = await quizService.updateQuestion(
      req.params.quizId,
      req.params.questionId,
      req.body
    );

    return successResponse(res, 200, "Question updated successfully", data);
  } catch (err) {
    console.log("updateQuestion failed", err);
    return errorResponse(res, 500, err.message);
  }
};

exports.removeQuestion = async (req, res) => {
  try {
    await quizService.removeQuestion(req.params.quizId, req.params.questionId);

    return successResponse(res, 200, "Question removed successfully", { deleted: true });
  } catch (err) {
    console.log("removeQuestion failed", err);
    return errorResponse(res, 500, err.message);
  }
};