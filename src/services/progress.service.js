// src/services/progress.service.js
const { supabaseAnon } = require("../config/supabaseClient");

/**
 * جلب كل سجلات التقدّم الخاصة بمستخدم معيّن (كل الكورسات مجمّعة).
 * ترجع: { [courseId]: { [lessonId]: true } } لتتوافق مع شكل lms.progress القديم فـ الفرونت.
 */
async function getMyProgress(userId) {
  const { data, error } = await supabaseAnon
    .from("lesson_progress")
    .select("course_id, lesson_id, completed")
    .eq("user_id", userId)
    .eq("completed", true);

  if (error) throw error;

  const grouped = {};
  for (const row of data) {
    if (!grouped[row.course_id]) grouped[row.course_id] = {};
    grouped[row.course_id][row.lesson_id] = true;
  }
  return grouped;
}

/**
 * جلب تفاصيل التقدّم فـ كورس واحد فقط (قائمة صفوف خام).
 */
async function getCourseProgress(userId, courseId) {
  const { data, error } = await supabaseAnon
    .from("lesson_progress")
    .select("lesson_id, completed, completed_at")
    .eq("user_id", userId)
    .eq("course_id", courseId);

  if (error) throw error;
  return data;
}

/**
 * ملخص رقمي لكورس واحد: done / total / pct.
 * total يُحسب من جدول lessons عبر modules التابعة للكورس.
 */
async function getCourseProgressSummary(userId, courseId) {
  // 1) عدد الدروس الكلي فـ الكورس (عبر modules -> lessons)
  const { data: modules, error: modErr } = await supabaseAnon
    .from("modules")
    .select("id")
    .eq("course_id", courseId);

  if (modErr) throw modErr;

  const moduleIds = (modules || []).map((m) => m.id);
  let total = 0;

  if (moduleIds.length > 0) {
    const { count, error: lessonErr } = await supabaseAnon
      .from("lessons")
      .select("id", { count: "exact", head: true })
      .in("module_id", moduleIds);

    if (lessonErr) throw lessonErr;
    total = count || 0;
  }

  // 2) عدد الدروس المكتملة
  const { count: done, error: doneErr } = await supabaseAnon
    .from("lesson_progress")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .eq("completed", true);

  if (doneErr) throw doneErr;

  const pct = total ? Math.round(((done || 0) / total) * 100) : 0;
  return { done: done || 0, total, pct };
}
/**
 * ملخص تقدّم الطلبة على مستوى كل كورسات أستاذ معيّن.
 * لكل كورس: عدد الدروس، عدد الطلبة الفاعلين، عدد الإكمالات، نسبة الإكمال، ومعدل درجات الكويز.
 */
async function getTeacherProgressRollup(teacherId) {
  // 1) كورسات الأستاذ
  const { data: courses, error: courseErr } = await supabaseAnon
    .from("courses")
    .select("id, title, image_cover")
    .eq("teacher_id", teacherId);
  if (courseErr) throw courseErr;
  if (!courses || courses.length === 0) return [];

  const courseIds = courses.map((c) => c.id);

  // 2) modules ديال هاد الكورسات
  const { data: modules, error: modErr } = await supabaseAnon
    .from("modules")
    .select("id, course_id")
    .in("course_id", courseIds);
  if (modErr) throw modErr;

  const moduleIdsByCourse = {};
  const allModuleIds = [];
  for (const m of modules || []) {
    (moduleIdsByCourse[m.course_id] ??= []).push(m.id);
    allModuleIds.push(m.id);
  }

  // 3) عدد الدروس فكل module
  const { data: lessons, error: lessonErr } = allModuleIds.length
    ? await supabaseAnon.from("lessons").select("id, module_id").in("module_id", allModuleIds)
    : { data: [], error: null };
  if (lessonErr) throw lessonErr;

  const lessonCountByModule = {};
  for (const l of lessons || []) {
    lessonCountByModule[l.module_id] = (lessonCountByModule[l.module_id] || 0) + 1;
  }

  const totalLessonsByCourse = {};
  for (const c of courses) {
    const modIds = moduleIdsByCourse[c.id] || [];
    totalLessonsByCourse[c.id] = modIds.reduce((sum, mid) => sum + (lessonCountByModule[mid] || 0), 0);
  }

  // 4) تقدّم الطلبة (lesson_progress) لهاد الكورسات
  const { data: progressRows, error: progErr } = await supabaseAnon
    .from("lesson_progress")
    .select("course_id, user_id, completed")
    .in("course_id", courseIds)
    .eq("completed", true);
  if (progErr) throw progErr;

  const doneByCourse = {};
  const studentsByCourse = {};
  for (const row of progressRows || []) {
    doneByCourse[row.course_id] = (doneByCourse[row.course_id] || 0) + 1;
    (studentsByCourse[row.course_id] ??= new Set()).add(row.user_id);
  }

  // 5) متوسط درجات الكويز فكل كورس
  const { data: quizzes, error: quizErr } = await supabaseAnon
    .from("quizzes")
    .select("id, course_id")
    .in("course_id", courseIds);
  if (quizErr) throw quizErr;

  const quizIdToCourse = {};
  const allQuizIds = [];
  for (const q of quizzes || []) {
    quizIdToCourse[q.id] = q.course_id;
    allQuizIds.push(q.id);
  }

  const { data: attempts, error: attErr } = allQuizIds.length
    ? await supabaseAnon.from("quiz_attempts").select("quiz_id, score, total").in("quiz_id", allQuizIds)
    : { data: [], error: null };
  if (attErr) throw attErr;

  const scoreSumByCourse = {};
  const scoreCountByCourse = {};
  for (const a of attempts || []) {
    const courseId = quizIdToCourse[a.quiz_id];
    if (!courseId || !a.total) continue;
    const pctScore = (a.score / a.total) * 100;
    scoreSumByCourse[courseId] = (scoreSumByCourse[courseId] || 0) + pctScore;
    scoreCountByCourse[courseId] = (scoreCountByCourse[courseId] || 0) + 1;
  }

  // 6) تجميع النتيجة النهائية
  return courses.map((c) => {
    const total = totalLessonsByCourse[c.id] || 0;
    const students = studentsByCourse[c.id]?.size || 0;
    const done = doneByCourse[c.id] || 0;
    const possible = total * students;
    const pct = possible ? Math.round((done / possible) * 100) : 0;
    const avgQuizScore = scoreCountByCourse[c.id]
      ? Math.round(scoreSumByCourse[c.id] / scoreCountByCourse[c.id])
      : null;

    return {
      course: { id: c.id, title: c.title, image_cover: c.image_cover },
      totalLessons: total,
      students,
      done,
      pct,
      avgQuizScore,
    };
  });
}
/**
 * تحديد/إلغاء إكمال درس (upsert).
 */
async function setLessonComplete(userId, courseId, lessonId, completed) {
  const payload = {
    user_id: userId,
    course_id: courseId,
    lesson_id: lessonId,
    completed,
    completed_at: completed ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabaseAnon
    .from("lesson_progress")
    .upsert(payload, { onConflict: "user_id,lesson_id" })
    .select()
    .single();

  if (error) throw error;
  return data;
}

module.exports = {
  getMyProgress,
  getCourseProgress,
  getCourseProgressSummary,
  setLessonComplete,
  getTeacherProgressRollup, // ⬅️ جديد
};