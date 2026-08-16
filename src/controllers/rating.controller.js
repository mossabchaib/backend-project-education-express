// src/controllers/rating.controller.js
const ratingService = require("../services/rating.service");
const { successResponse, errorResponse } = require("../utils/response");

async function getCourseRatings(req, res) {
  try {
    const result = await ratingService.getCourseRatings(req.params.courseId);
    return successResponse(res, 200, "تم جلب تقييمات الكورس", result);
  } catch (err) {
    return errorResponse(res, 500, "فشل جلب تقييمات الكورس", err.message);
  }
}

async function getMyRating(req, res) {
  try {
    const rating = await ratingService.getMyRating(req.params.courseId, req.user.id);
    return successResponse(res, 200, "تم جلب تقييمك", rating);
  } catch (err) {
    return errorResponse(res, 500, "فشل جلب تقييمك", err.message);
  }
}

async function rateCourse(req, res) {
  try {
    const { rating } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return errorResponse(res, 400, "التقييم يجب أن يكون رقماً بين 1 و 5");
    }

    const result = await ratingService.rateCourse(req.params.courseId, req.user.id, rating);
    return successResponse(res, 201, "تم تسجيل تقييمك", result);
  } catch (err) {
    return errorResponse(res, 400, "فشل تسجيل التقييم", err.message);
  }
}

async function deleteRating(req, res) {
  try {
    await ratingService.deleteRating(req.params.courseId, req.user.id);
    return successResponse(res, 200, "تم حذف تقييمك");
  } catch (err) {
    return errorResponse(res, 400, "فشل حذف التقييم", err.message);
  }
}

async function getRatingById(req, res) {
  try {
    const rating = await ratingService.getRatingById(req.params.id);
    return successResponse(res, 200, "تم جلب التقييم", rating);
  } catch (err) {
    return errorResponse(res, 404, "التقييم مالقيناهش", err.message);
  }
}

module.exports = { getCourseRatings, getMyRating, rateCourse, deleteRating, getRatingById };