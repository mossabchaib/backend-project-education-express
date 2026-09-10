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
 * GET /live-sessions/my-sessions
 * يجلب جلسات المعلّم المسجّل دخوله فقط (بناءً على التوكن)
 */
async function getMySessions(req, res) {
  try {
    const teacherId = req.user.id;
    const sessions = await liveService.listSessionsByTeacherId(teacherId);
    return successResponse(res, 200, "Teacher sessions fetched successfully", sessions);
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
}

/**
 * GET /live-sessions/teacher/:teacherId
 * يجلب جلسات معلّم معيّن عبر ID
 */

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
    const teacherId = req.user.id; // من التوكن مباشرة، وليس من الفرونت إند

    if (!title || !course_id || !host || !startsAt) {
      return errorResponse(res, 400, "title, course_id, host, startsAt are required");
    }

    const session = await liveService.createSession({
      title,
      course_id,
      host,
      teacherId,
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
async function getSessionsByTeacher(req, res) {
  try {
    const { teacherId } = req.params;
    const sessions = await liveService.listSessionsByTeacherId(teacherId);
    return successResponse(res, 200, "Teacher sessions fetched successfully", sessions);
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
}
module.exports = {
  getSessions,
  getSessionsByCourse,
  getSessionById,
  getMySessions,
  getSessionsByTeacher,
  createSession,
  updateSession,
  endSession,
  deleteSession,
};