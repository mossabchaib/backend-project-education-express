// src/middlewares/authMiddleware.js
// كيتحقق من الـ Authorization header (Bearer <access_token>) عبر Supabase،
// وكيتحقق أيضًا من x-session-id باش يضمن جلسة واحدة نشطة فقط لكل مستخدم.
// إلا كان كولشي صحيح كيدير req.user = { id, email, role } و req.accessToken.

const { supabaseAnon, supabaseAdmin } = require("../config/supabaseClient");
const { errorResponse } = require("../utils/response");
const sessionService = require("../services/session.service");

async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      return errorResponse(res, 401, "Missing or invalid Authorization header.");
    }

    // 1) نتحققو من صحة التوكن ونجيبو معلومات المستخدم من auth.users
    const { data: userData, error: userError } = await supabaseAnon.auth.getUser(token);

    if (userError || !userData?.user) {
      return errorResponse(res, 401, "Invalid or expired token.");
    }

    // 2) نجيبو الـ role من جدول profiles (service_role باش نضمنو القراءة بلا مشاكل RLS)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, role, full_name, email")
      .eq("id", userData.user.id)
      .single();

    if (profileError || !profile) {
      return errorResponse(res, 404, "Profile not found for this user.");
    }

    // 3) نتحققو أن هاد الجهاز مازال صاحب الجلسة النشطة الوحيدة لهاد المستخدم
    const clientSessionId = req.headers["x-session-id"];

    if (!clientSessionId) {
      return errorResponse(res, 401, "Missing x-session-id header.");
    }

    const activeSessionId = await sessionService.getActiveSessionId(userData.user.id);

    if (!activeSessionId || activeSessionId !== clientSessionId) {
      return errorResponse(res, 401, "SESSION_REVOKED");
    }

    req.user = {
      id: userData.user.id,
      email: userData.user.email,
      role: profile.role,
      fullName: profile.full_name,
    };
    req.accessToken = token;

    next();
  } catch (err) {
    return errorResponse(res, 500, "Authentication check failed.", err.message);
  }
}

module.exports = authMiddleware;