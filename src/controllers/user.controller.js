// src/controllers/user.controller.js

const profileService = require("../services/profile.service");
const { successResponse, errorResponse } = require("../utils/response");
const { logError } = require("../utils/logger");

const VALID_ROLES = ["student", "teacher", "admin"];

/** GET /api/users/me */
async function getMyProfile(req, res) {
  try {
    const { data, error } = await profileService.getProfileById(req.user.id);
    if (error || !data) return errorResponse(res, 404, "Profile not found.");
    return successResponse(res, 200, "Profile fetched.", data);
  } catch (err) {
    logError("getMyProfile failed", err);
    return errorResponse(res, 500, "Unexpected error fetching profile.");
  }
}

/** PATCH /api/users/me */
async function updateMyProfile(req, res) {
  try {
    const { fullName, avatarUrl } = req.body;
    const updates = {};
    if (fullName !== undefined) updates.full_name = fullName;
    if (avatarUrl !== undefined) updates.avatar_url = avatarUrl;

    if (Object.keys(updates).length === 0) {
      return errorResponse(res, 400, "No valid fields to update (fullName, avatarUrl).");
    }

    const { data, error } = await profileService.updateProfile(req.user.id, updates);
    if (error) return errorResponse(res, 400, error.message);

    return successResponse(res, 200, "Profile updated.", data);
  } catch (err) {
    logError("updateMyProfile failed", err);
    return errorResponse(res, 500, "Unexpected error updating profile.");
  }
}

/** GET /api/users  (admin only) — يدعم ?page=1&limit=20&role=teacher */
async function listUsers(req, res) {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const role = req.query.role;

    if (role && !VALID_ROLES.includes(role)) {
      return errorResponse(res, 400, `role must be one of: ${VALID_ROLES.join(", ")}`);
    }

    const { data, error, count } = await profileService.listProfiles({ page, limit, role });
    if (error) return errorResponse(res, 400, error.message);

    return successResponse(res, 200, "Users fetched.", { users: data, total: count, page, limit });
  } catch (err) {
    logError("listUsers failed", err);
    return errorResponse(res, 500, "Unexpected error listing users.");
  }
}

/** PATCH /api/users/:id/role  (admin only) */
async function changeRole(req, res) {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !VALID_ROLES.includes(role)) {
      return errorResponse(res, 400, `role must be one of: ${VALID_ROLES.join(", ")}`);
    }

    const { data, error } = await profileService.changeUserRole(id, role);
    if (error) return errorResponse(res, 400, error.message);
    if (!data) return errorResponse(res, 404, "User not found.");

    return successResponse(res, 200, "User role updated.", data);
  } catch (err) {
    logError("changeRole failed", err);
    return errorResponse(res, 500, "Unexpected error updating role.");
  }
}

module.exports = { getMyProfile, updateMyProfile, listUsers, changeRole };
