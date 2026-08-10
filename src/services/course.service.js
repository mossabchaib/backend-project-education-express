// src/services/course.service.js
const { supabaseAnon: supabase } = require("../config/supabaseClient");

/**
 * دالة إجبارية لرفع أي نص Base64 إلى Supabase Storage خاص بالكورسات
 */
async function uploadBase64ToStorage(base64String, bucketName = "courses") {
  if (!base64String || typeof base64String !== "string") return base64String;

  const cleanStr = base64String.trim();

  if (cleanStr.startsWith("http://") || cleanStr.startsWith("https://")) {
    return cleanStr;
  }

  try {
    let mimeType = "image/png";
    let base64Data = cleanStr;

    if (cleanStr.includes(";base64,")) {
      const parts = cleanStr.split(";base64,");
      mimeType = parts[0].replace("data:", "") || "image/png";
      base64Data = parts[1];
    }

    let ext = "png";
    if (mimeType.includes("svg")) ext = "svg";
    else if (mimeType.includes("jpeg") || mimeType.includes("jpg")) ext = "jpg";
    else if (mimeType.includes("webp")) ext = "webp";
    else if (mimeType.includes("/")) ext = mimeType.split("/")[1];

    const buffer = Buffer.from(base64Data, "base64");
    const fileName = `course_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, buffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  } catch (err) {
    console.error("❌ خطأ أثناء الرفع لـ Storage (الكورسات):", err.message || err);
    throw err;
  }
}

async function getTeacherCourses({ teacherId, categoryId, status } = {}) {
  let query = supabase
    .from("courses")
    .select("id, title, slug, description, teacher_id, category_id, price, status, created_at, updated_at, image_cover, level, language, subtitle, categories(id, name, slug), profiles!courses_teacher_id_fkey(id, full_name, email)")
    .order("created_at", { ascending: false });

  if (teacherId) query = query.eq("teacher_id", teacherId);
  if (categoryId) query = query.eq("category_id", categoryId);
  if (status) query = query.eq("status", status);
  else if (!teacherId) query = query.eq("status", "published");
console.log("getTeacherCourses query:", query.toString());
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

async function getTeacherCourse(id) {
  const { data, error } = await supabase
    .from("courses")
    .select("id, title, slug, description, teacher_id, category_id, price, status, created_at, updated_at, image_cover, level, language, subtitle, categories(id, name, slug), profiles!courses_teacher_id_fkey(id, full_name, email)")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

async function upsertTeacherCourse(payload) {
  const id = payload?.id || payload?.course?.id;
  
  // استبعاد الحقول غير الموجودة في جدول courses مثل modules أو course أو id المكرر
  const { image_cover, modules: _modules, course: _nestedCourse, id: _ignoredId, ...rest } = payload;

  console.log("upsertTeacherCourse payload:", payload, "extracted id:", id);

  let finalCoverUrl = image_cover;
  if (image_cover && typeof image_cover === "string" && image_cover.startsWith("data:")) {
    finalCoverUrl = await uploadBase64ToStorage(image_cover, "courses");
  }

  // البيانات النظيفة التي ستذهب إلى جدول courses فقط
  const courseData = {
    ...rest,
    ...(finalCoverUrl !== undefined && finalCoverUrl !== null && { image_cover: finalCoverUrl }),
  };

  const isUpdate = Boolean(id && (typeof id === "string" || typeof id === "number") && String(id).trim() !== "");
  console.log("isUpdate:", isUpdate, "id:", id, "courseData:", courseData);

  if (isUpdate) {
    const { data, error } = await supabase
      .from("courses")
      .update({ ...courseData, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.log("ersr:", error);
      throw error;
    }
    
    // (اختياري) إذا كنت تريد حفظ الـ modules في جدولها الخاص هنا، يمكنك إضافتها لاحقاً
    
    return data;
  }

  const { data, error } = await supabase
    .from("courses")
    .insert([courseData])
    .select()
    .single();

  if (error) {
    console.log("err:", error);
    throw error;
  }
  return data;
}
async function deleteTeacherCourse(id) {
  const { error } = await supabase.from("courses").delete().eq("id", id);
  if (error) throw error;
  return true;
}

module.exports = {
  getTeacherCourses,
  getTeacherCourse,
  upsertTeacherCourse,
  deleteTeacherCourse,
};