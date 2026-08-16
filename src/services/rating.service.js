// src/services/rating.service.js
const { supabaseAnon } = require("../config/supabaseClient");

/** جلب معدل التقييم وعدد الأصوات لكورس معين */
async function getCourseRatings(courseId) {
  const { data, error } = await supabaseAnon
    .from("course_ratings")
    .select("rating")
    .eq("course_id", courseId);

  if (error) throw error;

  const totalRatings = data.length;
  const averageRating =
    totalRatings > 0
      ? Number((data.reduce((sum, r) => sum + r.rating, 0) / totalRatings).toFixed(1))
      : 0;

  return { course_id: courseId, average_rating: averageRating, total_ratings: totalRatings };
}

/** جلب تقييم طالب معين لكورس معين */
async function getMyRating(courseId, studentId) {
  const { data, error } = await supabaseAnon
    .from("course_ratings")
    .select("*")
    .eq("course_id", courseId)
    .eq("student_id", studentId)
    .maybeSingle();

  if (error) throw error;
  return data; // null إذا ما قيّمش بعد
}

/** إضافة أو تعديل تقييم (upsert حسب course_id + student_id) */
async function rateCourse(courseId, studentId, rating) {
  const { data, error } = await supabaseAnon
    .from("course_ratings")
    .upsert(
      {
        course_id: courseId,
        student_id: studentId,
        rating,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "course_id,student_id" }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** حذف تقييم الطالب لكورس معين */
async function deleteRating(courseId, studentId) {
  const { error } = await supabaseAnon
    .from("course_ratings")
    .delete()
    .eq("course_id", courseId)
    .eq("student_id", studentId);

  if (error) throw error;
  return true;
}

/** جلب تقييم بالـ id */
async function getRatingById(id) {
  const { data, error } = await supabaseAnon
    .from("course_ratings")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

module.exports = {
  getCourseRatings,
  getMyRating,
  rateCourse,
  deleteRating,
  getRatingById,
};