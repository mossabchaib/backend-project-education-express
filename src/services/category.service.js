// src/services/category.service.js
const { supabaseAnon } = require("../config/supabaseClient");

/**
 * دالة إجبارية لرفع أي نص Base64 إلى Supabase Storage
 */
async function uploadBase64ToStorage(base64String, bucketName = "categories") {
  if (!base64String || typeof base64String !== "string") return base64String;

  const cleanStr = base64String.trim();

  // إذا كانت الصورة رابطاً جاهزاً مسبقاً لا نرفعها مجدداً
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
    const fileName = `cat_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;

    const { error: uploadError } = await supabaseAnon.storage
      .from(bucketName)
      .upload(fileName, buffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabaseAnon.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  } catch (err) {
    console.error("❌ خطأ أثناء الرفع لـ Storage:", err.message || err);
    throw err;
  }
}

/** جلب جميع التصنيفات */
async function getAdminCategories() {
  const { data, error } = await supabaseAnon
    .from("categories")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data;
}

/** جلب تصنيف واحد */
async function getAdminCategory(id) {
  const { data, error } = await supabaseAnon
    .from("categories")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

/** إضافة / تحديث تصنيف */
async function upsertCategory(payload) {
  console.log("\n📥 استلام طلب upsertCategory البيانات:", payload);

  // استبعاد description، واستخراج الحقول الخاصة بالصور
  const { id, description, icon, image, image_url, ...rest } = payload;

  const rawImage = image_url || image || icon;
  let finalImageUrl = null;

  if (rawImage) {
    finalImageUrl = await uploadBase64ToStorage(rawImage, "categories");
  }

  // بناء الكائن النهائي بدون تكرار الأعمدة غير الموجودة في الجدول
  const categoryData = { ...rest };

  if (finalImageUrl) {
    if (image_url !== undefined) categoryData.image_url = finalImageUrl;
    if (image !== undefined) categoryData.image = finalImageUrl;
    if (icon !== undefined) categoryData.icon = finalImageUrl;

    // إذا لم تُمرر أي تسمية محددة يتم إسنادها للحقل الافتراضي image_url
    if (image_url === undefined && image === undefined && icon === undefined) {
      categoryData.image_url = finalImageUrl;
    }
  }

  console.log("💾 البيانات النهائية التي سيتم إدخالها لقاعدة البيانات:", categoryData);

  const isUpdate = Boolean(id && typeof id === "string" && id.trim() !== "");

  if (isUpdate) {
    const { data, error } = await supabaseAnon
      .from("categories")
      .update({ ...categoryData, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("❌ خطأ Supabase عند التحديث:", error);
      throw error;
    }
    return data;
  }

  const { data, error } = await supabaseAnon
    .from("categories")
    .insert([categoryData])
    .select()
    .single();

  if (error) {
    console.error("❌ خطأ Supabase عند الإضافة:", error);
    throw error;
  }

  return data;
}

/** حذف تصنيف */
async function deleteAdminCategory(id) {
  const { error } = await supabaseAnon
    .from("categories")
    .delete()
    .eq("id", id);

  if (error) throw error;
  return true;
}

module.exports = {
  getAdminCategories,
  getAdminCategory,
  upsertCategory,
  deleteAdminCategory,
};