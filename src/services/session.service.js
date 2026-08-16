// src/services/session.service.js
const crypto = require("crypto");
const { supabaseAdmin } = require("../config/supabaseClient");

async function upsertActiveSession(userId, deviceInfo) {
  const sessionId = crypto.randomUUID();

  const { error } = await supabaseAdmin
    .from("active_sessions")
    .upsert({
      user_id: userId,
      session_id: sessionId,
      device_info: deviceInfo || null,
      updated_at: new Date().toISOString(),
    });

  if (error) throw error;
  return sessionId;
}

async function getActiveSessionId(userId) {
  const { data, error } = await supabaseAdmin
    .from("active_sessions")
    .select("session_id")
    .eq("user_id", userId)
    .single();

  if (error || !data) return null;
  return data.session_id;
}

async function deleteActiveSession(userId) {
  await supabaseAdmin.from("active_sessions").delete().eq("user_id", userId);
}

module.exports = { upsertActiveSession, getActiveSessionId, deleteActiveSession };