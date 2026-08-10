const liveService = require("../services/live.service");
// استبدل success, error بالأسماء الصحيحة وتغيير طريقة الاستخدام
const { successResponse, errorResponse } = require("../utils/response");

/**
 * GET /live-sessions?courseId=&status=
 */
async function getSessions(req, res) {
  try {
    const { courseId, status } = req.query;
    const parsedStatus =
      status === "true" ? true : status === "false" ? false : undefined;

    const sessions = await liveService.listSessions({ courseId, status: parsedStatus });
    // استخدام successResponse مع تمرير الـ statusCode (مثلاً 200) والرسالة والبيانات
    return successResponse(res, 200, "Sessions fetched successfully", sessions);
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
}

/**
 * GET /courses/:courseId/live-sessions
 */
async function getSessionsByCourse(req, res) {
  try {
    const { courseId } = req.params;
    const sessions = await liveService.listSessionsByCourse(courseId);
    return successResponse(res, 200, "Course sessions fetched successfully", sessions);
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
}

/**
 * GET /live-sessions/:id
 */
async function getSessionById(req, res) {
  try {
    const { id } = req.params;
    const session = await liveService.getSession(id);
    return successResponse(res, 200, "Session fetched successfully", session);
  } catch (err) {
    return errorResponse(res, 404, err.message);
  }
}

/**
 * POST /live-sessions
 */
async function createSession(req, res) {
  try {
    const { title, course_id, host, startsAt, duration, attendees, joinUrl } = req.body;
console.log("req.body", req.body);
    if (!title || !course_id || !host || !startsAt) {
      return errorResponse(res, 400, "title, course_id, host, startsAt are required");
    }
console.log("Creating session with data:", { title, course_id, host, startsAt, duration, attendees, joinUrl });
    const session = await liveService.createSession({
      title,
      course_id,
      host,
      startsAt,
      duration,
      attendees,
      joinUrl,
    });

    return successResponse(res, 201, "Session created successfully", session);
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
}

/**
 * PUT /live-sessions/:id
 */
async function updateSession(req, res) {
  try {
    const { id } = req.params;
    console.log("Updating session with ID:", id, "and data:", req.body);
    const session = await liveService.updateSession(id, req.body);
    return successResponse(res, 200, "Session updated successfully", session);
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
}

/**
 * PATCH /live-sessions/:id/end
 */
async function endSession(req, res) {
  try {
    const { id } = req.params;
    const session = await liveService.endSession(id);
    return successResponse(res, 200, "Session ended successfully", session);
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
}

/**
 * DELETE /live-sessions/:id
 */
async function deleteSession(req, res) {
  try {
    const { id } = req.params;
    const result = await liveService.deleteSession(id);
    return successResponse(res, 200, "Session deleted successfully", result);
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
}

module.exports = {
  getSessions,
  getSessionsByCourse,
  getSessionById,
  createSession,
  updateSession,
  endSession,
  deleteSession,
};