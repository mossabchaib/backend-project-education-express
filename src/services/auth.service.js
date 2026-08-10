// src/services/auth.service.js
// منطق التواصل المباشر مع Supabase Auth (طبقة معزولة عن الـ controllers)

const { supabaseAnon } = require("../config/supabaseClient");

/** تسجيل مستخدم جديد. الدور دائمًا "student" (يُضبط تلقائيًا عبر trigger فـ قاعدة البيانات). */
async function signUp({ email, password, fullName }) {
  const { data, error } = await supabaseAnon.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName || "" },
    },
  });
  return { data, error };
}

/** تسجيل الدخول */
async function signIn({ email, password }) {
  const { data, error } = await supabaseAnon.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

/**
 * تسجيل الخروج: كيبطل صلاحية الـ refresh token ديال الجلسة الحالية عبر Supabase Auth.
 * كنديرو setSession باش نربطو المكتبة بالتوكن ديال الطلب الحالي قبل ما نسجلو الخروج.
 */
async function signOut(accessToken, refreshToken) {
  await supabaseAnon.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken || "",
  });
  const { error } = await supabaseAnon.auth.signOut();
  return { error };
}

/** تجديد الـ session بواسطة refresh_token */
async function refreshSession(refreshToken) {
  const { data, error } = await supabaseAnon.auth.refreshSession({
    refresh_token: refreshToken,
  });
  return { data, error };
}

/** إرسال رابط استرجاع كلمة السر */
async function forgotPassword(email, redirectTo) {
  const { data, error } = await supabaseAnon.auth.resetPasswordForEmail(email, {
    redirectTo,
  });
  return { data, error };
}

module.exports = { signUp, signIn, signOut, refreshSession, forgotPassword };
