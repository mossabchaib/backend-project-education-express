const { supabaseAnon: supabase } = require("../config/supabaseClient");
const TABLE = "live_sessions";

/**
 * جلب كل الجلسات (مع إمكانية الفلترة حسب course_id أو status)
 */
async function listSessions({ courseId, status } = {}) {
  let query = supabase.from(TABLE).select("*").order("starts_at", { ascending: true });

  if (courseId) query = query.eq("course_id", courseId);
  if (typeof status === "boolean") query = query.eq("status", status);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

/**
 * جلب جلسات كورس معيّن
 */
async function listSessionsByCourse(courseId) {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("course_id", courseId)
    .order("starts_at", { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * جلب جلسة واحدة بالتفصيل
 */
async function getSession(id) {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

/**
 * إنشاء جلسة جديدة
 */
async function createSession(payload) {
  const { title, course_id, host, startsAt, duration, attendees, joinUrl } = payload;

  const { data, error } = await supabase
    .from(TABLE)
    .insert([
      {
        title,
        course_id,
        host,
        starts_at: startsAt,
        duration,
        attendees: attendees ?? 0,
        join_url: joinUrl ?? null,
        status: false,
      },
    ])
    .select()
    .single();

  if (error) {
    console.log("Error creating session:", error);
    throw error};
  return data;
}

/**
 * تحديث جلسة (جزئي)
 */
async function updateSession(id, payload) {
  const updateData = {};

  if (payload.title !== undefined) updateData.title = payload.title;
  if (payload.course_id !== undefined) updateData.course_id = payload.course_id;
  if (payload.host !== undefined) updateData.host = payload.host;
  if (payload.startsAt !== undefined) updateData.starts_at = payload.startsAt;
  if (payload.duration !== undefined) updateData.duration = payload.duration;
  if (payload.attendees !== undefined) updateData.attendees = payload.attendees;
  if (payload.joinUrl !== undefined) updateData.join_url = payload.joinUrl;
  if (payload.status !== undefined) updateData.status = payload.status;
  if (payload.recording_url !== undefined) updateData.recording_url = payload.recording_url;
  const { data, error } = await supabase
    .from(TABLE)
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * تعليم الجلسة كمنتهية
 */
async function endSession(id) {
  const { data, error } = await supabase
    .from(TABLE)
    .update({ status: true })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * حذف جلسة
 */
async function deleteSession(id) {
  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) throw error;
  return { id };
}

module.exports = {
  listSessions,
  listSessionsByCourse,
  getSession,
  createSession,
  updateSession,
  endSession,
  deleteSession,
};