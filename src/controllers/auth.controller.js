// src/controllers/auth.controller.js

const authService = require("../services/auth.service");
const { successResponse, errorResponse } = require("../utils/response");
const { logError } = require("../utils/logger");

async function signUp(req, res) {
  try {
    const { email, password, fullName, role } = req.body;
    if (!email || !password) {
      return errorResponse(res, 400, "email and password are required.");
    }
    console.log("Received role:", role); // Debugging line to check the received role
    const allowedRoles = ["student", "teacher"]; // admin ما كيتسجلش من هنا أبداً
    const safeRole = allowedRoles.includes(role) ? role : "student";
    console.log("Using role:", safeRole); // Debugging line to check the role being used
    const { data, error } = await authService.signUp({ email, password, fullName, role: safeRole });
    if (error) return errorResponse(res, 400, error.message);

    return successResponse(res, 201, "Account created. Check your email to confirm.", {
      user: data.user,
      session: data.session,
    });
  } catch (err) {
    logError("signUp failed", err);
    return errorResponse(res, 500, "Unexpected error during sign up.");
  }
}
async function signIn(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return errorResponse(res, 400, "email and password are required.");
    }

    const { data, error } = await authService.signIn({ email, password });
    if (error) return errorResponse(res, 401, error.message);

    return successResponse(res, 200, "Signed in successfully.", {
      user: data.user,
      session: data.session, // يحتوي access_token و refresh_token
    });
  } catch (err) {
    logError("signIn failed", err);
    return errorResponse(res, 500, "Unexpected error during sign in.");
  }
}

async function signOut(req, res) {
  try {
    const { refreshToken } = req.body;
    const { error } = await authService.signOut(req.accessToken, refreshToken);
    if (error) return errorResponse(res, 400, error.message);

    return successResponse(res, 200, "Signed out successfully.");
  } catch (err) {
    logError("signOut failed", err);
    return errorResponse(res, 500, "Unexpected error during sign out.");
  }
}

async function refreshSession(req, res) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return errorResponse(res, 400, "refreshToken is required.");

    const { data, error } = await authService.refreshSession(refreshToken);
    if (error) return errorResponse(res, 401, error.message);

    return successResponse(res, 200, "Session refreshed.", { session: data.session });
  } catch (err) {
    logError("refreshSession failed", err);
    return errorResponse(res, 500, "Unexpected error during session refresh.");
  }
}

async function forgotPassword(req, res) {
  try {
    const { email, redirectTo } = req.body;
    if (!email) return errorResponse(res, 400, "email is required.");

    const { error } = await authService.forgotPassword(email, redirectTo);
    if (error) return errorResponse(res, 400, error.message);

    return successResponse(res, 200, "Password reset email sent (if this email exists).");
  } catch (err) {
    logError("forgotPassword failed", err);
    return errorResponse(res, 500, "Unexpected error during password reset request.");
  }
}
async function resetPassword(req, res) {
  try {
    const { accessToken, refreshToken, newPassword } = req.body;
    if (!accessToken || !newPassword) {
      return errorResponse(res, 400, "accessToken and newPassword are required.");
    }

    const { error } = await authService.resetPassword(accessToken, refreshToken, newPassword);
    if (error) return errorResponse(res, 400, error.message);

    return successResponse(res, 200, "Password updated successfully.");
  } catch (err) {
    logError("resetPassword failed", err);
    return errorResponse(res, 500, "Unexpected error during password reset.");
  }
}

module.exports = { signUp, signIn, signOut, refreshSession, forgotPassword, resetPassword };
