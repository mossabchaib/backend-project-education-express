// src/controllers/auth.controller.js

const authService = require("../services/auth.service");
const { successResponse, errorResponse } = require("../utils/response");
const { logError } = require("../utils/logger");

async function signUp(req, res) {
  try {
    const { email, password, fullName } = req.body;
    if (!email || !password) {
      return errorResponse(res, 400, "email and password are required.");
    }

    const { data, error } = await authService.signUp({ email, password, fullName });
    if (error) return errorResponse(res, 400, error.message);

    return successResponse(res, 201, "Account created. Check your email to confirm (if confirmation is enabled).", {
      user: data.user,
      session: data.session, // قد تكون null إذا email confirmation مفعّل
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

module.exports = { signUp, signIn, signOut, refreshSession, forgotPassword };
