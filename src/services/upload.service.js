const crypto = require("crypto");
const path = require("path");

const { validateFile } = require("../utils/fileValidation");
// ✅ الصحيح: استيراد supabaseAdmin من ملف التهيئة
const { supabaseAdmin } = require("../config/supabaseClient");
const { logError } = require("../utils/logger");

// Name of the Supabase Storage bucket that holds uploaded files.
const BUCKET_NAME = process.env.SUPABASE_STORAGE_BUCKET || "lms-uploads-2026";

// أضف هذا أعلى الملف مع باقي المتغيرات
const SUPABASE_URL = process.env.SUPABASE_URL; // تأكد أنه موجود في .env

/**
 * Object keys are namespaced by kind and given a random UUID so a teacher
 * re-uploading a file called "lesson1.mp4" never collides with anyone else's.
 */
function buildObjectKey(originalName, kind) {
  const ext = path.extname(originalName);
  const uniqueId = crypto.randomUUID();
  return `${kind}s/${uniqueId}${ext}`;
}

function buildPublicUrl(key) {
  const { data } = supabaseAdmin.storage.from(BUCKET_NAME).getPublicUrl(key);
  return data.publicUrl;
}

/**
 * ينشئ رابط رفع موقّع مؤقت من Supabase، بدون أن يمر أي بايت من الملف
 * عبر هذا السيرفر. الـ frontend سيرفع مباشرة إلى هذا الرابط.
 */
async function createSignedUpload({ fileName, kind, courseId,lesson_id, teacherId }) {
  if (!fileName || !kind) {
    const error = new Error("fileName and kind are required.");
    error.statusCode = 400;
    throw error;
  }

  const key = buildObjectKey(fileName, kind);

  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .createSignedUploadUrl(key);

  if (error) {
    console.error("[upload.service] createSignedUploadUrl failed:", error);
    const wrappedError = new Error("Failed to create signed upload URL.");
    wrappedError.statusCode = 500;
    throw wrappedError;
  }

  // نبني رابط الرفع الفعلي هنا في الباك اند، بحيث الـ frontend لا يحتاج
  // يعرف شكل رابط Supabase الداخلي إطلاقاً.
  const signedUrl = `${SUPABASE_URL.replace(/\/$/, "")}/storage/v1/object/upload/sign/${BUCKET_NAME}/${data.path}?token=${data.token}`;

  return {
    path: data.path,   // == key، سنحتاجه لاحقاً في confirmUpload
    token: data.token,
    signedUrl,
  };
}

/**
 * تُستدعى بعد أن يرفع المتصفح الملف بنجاح مباشرة إلى Supabase.
 * هنا فقط نسجّل الميتاداتا — بدون أي بيانات ملف.
 */
async function confirmUpload({ key, fileName, mimeType, fileSize, kind, course_id,lesson_id, teacherId }) {
  if (!key || !fileName || !kind) {
    const error = new Error("key, fileName and kind are required.");
    error.statusCode = 400;
    throw error;
  }

  const fileUrl = buildPublicUrl(key);

  const metadataRow = {
    file_url: fileUrl,
    file_key: key,
    file_name: fileName,
    mime_type: mimeType,
    file_size: fileSize,
    kind,
    course_id: course_id ?? null,
    teacher_id: teacherId,
    upload_date: new Date().toISOString(),
    lesson_id: lesson_id ?? null, // ⬅️ جديد: ربط التحميل بالدرس إذا وُجد
  };

  const { data, error } = await supabaseAdmin
    .from("uploads")
    .insert(metadataRow)
    .select()
    .single();

  if (error) {
    console.error("[upload.service] confirmUpload insert failed:", error);
    // تنظيف احترازي: احذف الملف من الـ storage لو فشل حفظ الميتاداتا
    await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .remove([key])
      .catch((cleanupErr) =>
        console.error("[upload.service] cleanup after failed confirm failed:", cleanupErr)
      );

    const wrappedError = new Error("Failed to save upload metadata.");
    wrappedError.statusCode = 500;
    throw wrappedError;
  }

  return data;
}

/**
 * Uploads a validated file buffer to Supabase Storage and persists only its
 * metadata. The binary itself never touches the "uploads" table.
 */
async function uploadFileToR2({ file, courseId, teacherId }) {
  console.log("=== [START] uploadFileToR2 ===");
  console.log("Inputs received:", {
    file: file ? { originalname: file.originalname, mimetype: file.mimetype, size: file.size } : null,
    courseId,
    teacherId
  });

  const validation = validateFile(file);
  console.log("1. Validation result:", validation);
  
  if (!validation.valid) {
    console.log("-> Validation failed with message:", validation.message);
    const error = new Error(validation.message);
    error.statusCode = 400;
    throw error;
  }

  const { kind } = validation;
  console.log("2. File kind determined:", kind);

  const key = buildObjectKey(file.originalname, kind);
  console.log("3. Generated storage key:", key);

  console.log("4. Attempting upload to Supabase Storage...");
  const { error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .upload(key, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (uploadError) {
    console.log("-> Supabase Storage upload FAILED:", uploadError);
    if (typeof logError === "function") {
      logError("[upload.service] Failed to upload file to Supabase Storage", uploadError);
    } else {
      console.error("[upload.service] Failed to upload file to Supabase Storage", uploadError);
    }
    const wrappedError = new Error("Failed to upload file.");
    wrappedError.statusCode = 500;
    throw wrappedError;
  }
  console.log("-> Supabase Storage upload SUCCESSFUL");

  const fileUrl = buildPublicUrl(key);
  console.log("5. Generated public URL:", fileUrl);

  const metadataRow = {
    file_url: fileUrl,
    file_key: key,
    file_name: file.originalname,
    mime_type: file.mimetype,
    file_size: file.size,
    kind,
    course_id: courseId ?? null,
    teacher_id: teacherId,
    upload_date: new Date().toISOString(),
  };
  console.log("6. Prepared metadataRow for Database insert:", metadataRow);

  console.log("7. Attempting to insert metadata into 'uploads' table...");
  const { data, error } = await supabaseAdmin
    .from("uploads")
    .insert(metadataRow)
    .select()
    .single();

  if (error) {
    console.log("-> Database insert FAILED:", error);
    if (typeof logError === "function") {
      logError("[upload.service] Failed to save upload metadata", error);
    } else {
      console.error("[upload.service] Failed to save upload metadata", error);
    }

    console.log("-> Starting cleanup: removing orphaned object from storage...");
    await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .remove([key])
      .then(() => console.log("-> Cleanup successful: orphaned object removed"))
      .catch((cleanupErr) =>
        console.error("[upload.service] Failed to clean up orphaned storage object", cleanupErr)
      );

    const wrappedError = new Error("Failed to save upload metadata.");
    wrappedError.statusCode = 500;
    throw wrappedError;
  }

  console.log("-> Database insert SUCCESSFUL. Returned data:", data);
  console.log("=== [END] uploadFileToR2 ===");
  return data;
}

async function listUploads({ courseId, teacherId }) {
  let query = supabaseAdmin.from("uploads").select("*").order("upload_date", { ascending: false });

  if (courseId) query = query.eq("course_id", courseId);
  if (teacherId) query = query.eq("teacher_id", teacherId);

  const { data, error } = await query;
  if (error) {
    if (typeof logError === "function") {
      logError("[upload.service] Failed to list uploads", error);
    } else {
      console.error("[upload.service] Failed to list uploads", error);
    }
    const wrappedError = new Error("Failed to fetch uploads.");
    wrappedError.statusCode = 500;
    throw wrappedError;
  }

  return data;
}

async function deleteUpload({ id, teacherId }) {
  const { data: existing, error: fetchError } = await supabaseAdmin
    .from("uploads")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    const error = new Error("Upload not found.");
    error.statusCode = 404;
    throw error;
  }

  if (existing.teacher_id !== teacherId) {
    const error = new Error("You are not allowed to delete this upload.");
    error.statusCode = 403;
    throw error;
  }

  const { error: removeError } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .remove([existing.file_key]);

  if (removeError) {
    if (typeof logError === "function") {
      logError("[upload.service] Failed to delete storage object", removeError);
    } else {
      console.error("[upload.service] Failed to delete storage object", removeError);
    }
    const wrappedError = new Error("Failed to delete upload file.");
    wrappedError.statusCode = 500;
    throw wrappedError;
  }

  const { error: deleteError } = await supabaseAdmin.from("uploads").delete().eq("id", id);
  if (deleteError) {
    if (typeof logError === "function") {
      logError("[upload.service] Failed to delete upload metadata", deleteError);
    } else {
      console.error("[upload.service] Failed to delete upload metadata", deleteError);
    }
    const wrappedError = new Error("Failed to delete upload record.");
    wrappedError.statusCode = 500;
    throw wrappedError;
  }

  return existing;
}

module.exports = {
  uploadFileToR2,
  listUploads,
  deleteUpload,
  createSignedUpload,
  confirmUpload,
};