// src/services/auth.service.js
const { supabaseAnon, supabaseAdmin } = require("../config/supabaseClient");
const { sendConfirmationEmail, sendPasswordResetEmail } = require("./email.service");

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:8080/";

/**
 * تسجيل مستخدم جديد بدون ما نخلي Supabase يبعت الإيميل تلقائي.
 * كنستعملو generateLink (service role) اللي كيخلق المستخدم ويرجع لينا الرابط
 * بلا ما يبعت شي حاجة، وبعدها كنبعتوه احنا عبر Resend.
 */
async function signUp({ email, password, fullName, role }) {
  console.log("signUp called with:", role); // Debugging line to check the received parameters
  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: "signup",
    email,
    password,
    options: {
      data: { full_name: fullName || "", role: role  }, // ← الفرق
      redirectTo: `${FRONTEND_URL}/auth/callback`,
    },
  });

  if (error) {
    console.error("Error generating signup link:", error); // Debugging line to log the error
    return { data: null, error }};

  const confirmationLink = data.properties.action_link;

  try {
    await sendConfirmationEmail(email, confirmationLink);
  } catch (err) {
    return { data: null, error: { message: "User created but failed to send confirmation email." } };
  }

  return { data, error: null };
}

/** تسجيل الدخول */
async function signIn({ email, password }) {
  const { data, error } = await supabaseAnon.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

async function signOut(accessToken, refreshToken) {
  await supabaseAnon.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken || "",
  });
  const { error } = await supabaseAnon.auth.signOut();
  return { error };
}

async function refreshSession(refreshToken) {
  const { data, error } = await supabaseAnon.auth.refreshSession({
    refresh_token: refreshToken,
  });
  return { data, error };
}

/**
 * إرسال رابط استرجاع كلمة السر عبر Resend بدل Supabase.
 */
async function forgotPassword(email, redirectTo) {
  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: "recovery",
    email,
    options: {
      redirectTo: redirectTo || `${FRONTEND_URL}/auth/reset-password`,
    },
  });

  if (error) return { data: null, error };

  const resetLink = data.properties.action_link;

  try {
    await sendPasswordResetEmail(email, resetLink);
  } catch (err) {
    return { data: null, error: { message: "Failed to send password reset email." } };
  }

  return { data, error: null };
}
async function resetPassword(accessToken, refreshToken, newPassword) {
  await supabaseAnon.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken || "",
  });

  const { error } = await supabaseAnon.auth.updateUser({ password: newPassword });
  return { error };
}

module.exports = { signUp, signIn, signOut, refreshSession, forgotPassword, resetPassword };