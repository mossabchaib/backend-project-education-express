// src/services/lesson.service.js
const { supabaseAnon: supabase } = require("../config/supabaseClient");


/**
 * يقابل flatLessons(courseId) فـ lms-storage.ts:
 * كترجع كل دروس الكورس مسطحين (flat) مع اسم الموديول لكل درس.
 */
async function flatLessons(courseId) {
  const { data, error } = await supabase
    .from("modules")
    .select("id, title, order_index, lessons(*)")
    .eq("course_id", courseId)
    .order("order_index", { ascending: true });
  if (error) throw error;

  return (data || [])
    .flatMap((m) =>
      (m.lessons || [])
        .sort((a, b) => a.order_index - b.order_index)
        .map((l) => ({ ...l, moduleTitle: m.title }))
    );
}

async function getLesson(id) {
  const { data, error } = await supabase.from("lessons").select("*").eq("id", id).single();
  if (error) throw error;
  return data;
}

async function addLesson(moduleId, payload) {
  const { data, error } = await supabase
    .from("lessons")
    .insert({ ...payload, module_id: moduleId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function updateLesson(id, payload) {
  const { data, error } = await supabase
    .from("lessons")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function deleteLesson(id) {
  console.log("kdmskmdsklmsld",id)
  const { error } = await supabase.from("lessons").delete().eq("id", id);
  if (error) {
    console.log("error:",error)
    throw error};
  return true;
}

module.exports = {
  flatLessons,
  getLesson,
  addLesson,
  updateLesson,
  deleteLesson,
};
