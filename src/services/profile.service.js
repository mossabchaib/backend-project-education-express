// src/services/profile.service.js
// منطق CRUD على جدول public.profiles (كيستعمل service_role باش يتفاداو قيود RLS فـ العمليات الإدارية)

const { supabaseAdmin } = require("../config/supabaseClient");

async function getProfileById(userId) {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name, email, role, avatar_url, created_at, updated_at")
    .eq("id", userId)
    .single();
  return { data, error };
}

async function updateProfile(userId, updates) {
  // منع تغيير الـ role من هاذ الطريق (فقط full_name, avatar_url مسموحين للمستخدم العادي)
  const { role, ...safeUpdates } = updates;

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .update(safeUpdates)
    .eq("id", userId)
    .select()
    .single();
  return { data, error };
}

async function listProfiles({ page = 1, limit = 20, role } = {}) {
  let query = supabaseAdmin
    .from("profiles")
    .select("id, full_name, email, role, created_at", { count: "exact" });

  if (role) query = query.eq("role", role);

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await query.range(from, to).order("created_at", { ascending: false });
  return { data, error, count };
}

async function changeUserRole(userId, newRole) {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .update({ role: newRole })
    .eq("id", userId)
    .select()
    .single();
  return { data, error };
}

module.exports = { getProfileById, updateProfile, listProfiles, changeUserRole };
