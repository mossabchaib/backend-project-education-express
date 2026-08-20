// src/services/subscription.service.js
const { supabaseAnon } = require("../config/supabaseClient");

async function uploadBase64ToStorage(base64String, bucketName = "payment-proofs") {
  if (!base64String || typeof base64String !== "string") return base64String;
  const cleanStr = base64String.trim();

  if (cleanStr.startsWith("http://") || cleanStr.startsWith("https://")) {
    return cleanStr;
  }

  let mimeType = "image/png";
  let base64Data = cleanStr;

  if (cleanStr.includes(";base64,")) {
    const parts = cleanStr.split(";base64,");
    mimeType = parts[0].replace("data:", "") || "image/png";
    base64Data = parts[1];
  }

  let ext = "png";
  if (mimeType.includes("jpeg") || mimeType.includes("jpg")) ext = "jpg";
  else if (mimeType.includes("webp")) ext = "webp";
  else if (mimeType.includes("pdf")) ext = "pdf";

  const buffer = Buffer.from(base64Data, "base64");
  const fileName = `proof_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;

  const { error: uploadError } = await supabaseAnon.storage
    .from(bucketName)
    .upload(fileName, buffer, { contentType: mimeType, upsert: true });

  if (uploadError) throw uploadError;

  const { data: urlData } = supabaseAnon.storage
    .from(bucketName)
    .getPublicUrl(fileName);

  return urlData.publicUrl;
}

/**
 * الطالب يرسل طلب اشتراك (باقة أو كورسات محددة)
 * payload:
 *   - plan_name?: string        // اشتراك بباقة
 *   - course_ids?: string[]     // اشتراك بكورس/كورسات محددة
 *   - amount: number
 *   - payment_proof: base64 | url
 */
async function submitSubscription(userId, payload) {
  const { plan_name, course_ids, amount, payment_proof } = payload;

  const isCourseSubscription = Array.isArray(course_ids) && course_ids.length > 0;

  if (!isCourseSubscription && !plan_name) {
    throw new Error("يجب تحديد plan_name أو course_ids");
  }

  const proofUrl = await uploadBase64ToStorage(payment_proof, "payment-proofs");

  // 1) إنشاء صف الاشتراك الأساسي
  const { data: subscription, error } = await supabaseAnon
    .from("subscriptions")
    .insert([{
      user_id: userId,
      plan_name: isCourseSubscription ? null : plan_name,
      amount,
      status: "pending",
      payment_proof_url: proofUrl,
    }])
    .select()
    .single();

  if (error) throw error;

  // 2) إذا كان اشتراك كورسات، نربطها فـ subscription_courses
  if (isCourseSubscription) {
    const rows = course_ids.map((course_id) => ({
      subscription_id: subscription.id,
      course_id,
    }));

    const { error: linkError } = await supabaseAnon
      .from("subscription_courses")
      .insert(rows);

    if (linkError) throw linkError;
  }

  return subscription;
}

/**
 * جلب اشتراكات الطالب: آخر باقة + كل الكورسات المشترى فيها
 */
async function getMySubscription(userId) {
  console.log("test")
  // 1) جلب آخر اشتراك من نوع "باقة" (plan_name موجود)
  const { data: planData, error: planError } = await supabaseAnon
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .not("plan_name", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
console.log("planData:",planData)
  if (planError) throw planError;

  const plan = planData || null;
  let courses = [];

  // 2) إذا لم يكن هناك باقة، نبحث في subscription_courses
  if (!plan) {
    const { data: courseLinks, error: coursesError } = await supabaseAnon
      .from("subscription_courses")
      .select(`
        id,
        course_id,
        courses ( id, title, slug, image_cover ),
        subscriptions!inner ( id, status, starts_at, ends_at, user_id )
      `)
      .eq("subscriptions.user_id", userId);

    if (coursesError) throw coursesError;

    courses = (courseLinks || []).map((link) => ({
      subscription_id: link.subscriptions.id,
      status: link.subscriptions.status,
      starts_at: link.subscriptions.starts_at,
      ends_at: link.subscriptions.ends_at,
      course_id: link.course_id,
      course: link.courses,
    }));
  }
console.log("{ plan, courses }:",{ plan, courses })
  return { plan, courses };
}

/** admin: جلب كل الطلبات المعلّقة */
async function getPendingSubscriptions() {
  const { data, error } = await supabaseAnon
    .from("subscriptions")
    .select(`
      *,
      profiles!subscriptions_user_id_fkey(full_name, email),
      subscription_courses ( course_id, courses ( id, title ) )
    `)
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data;
}

/** admin: جلب كل الاشتراكات (كل الحالات) */
async function getAllSubscriptions() {
  const { data, error } = await supabaseAnon
    .from("subscriptions")
    .select(`
      *,
      profiles!subscriptions_user_id_fkey(full_name, email),
      subscription_courses ( course_id, courses ( id, title ) )
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

/** admin: قبول الاشتراك (باقة = مدة محددة، كورسات = وصول دائم) */
async function approveSubscription(id, adminId, days = 30) {
  const now = new Date();

  // نتحقق واش هاذ الاشتراك مرتبط بكورسات محددة
  const { data: links, error: linksError } = await supabaseAnon
    .from("subscription_courses")
    .select("id")
    .eq("subscription_id", id)
    .limit(1);

  if (linksError) throw linksError;

  const isCourseSubscription = links && links.length > 0;

  const updatePayload = {
    status: "active",
    reviewed_by: adminId,
    reviewed_at: now.toISOString(),
    starts_at: now.toISOString(),
    updated_at: now.toISOString(),
  };

  if (isCourseSubscription) {
    updatePayload.ends_at = null; // وصول دائم
  } else {
    const endsAt = new Date(now);
    endsAt.setDate(endsAt.getDate() + Number(days));
    updatePayload.ends_at = endsAt.toISOString();
  }

  const { data, error } = await supabaseAnon
    .from("subscriptions")
    .update(updatePayload)
    .eq("id", id)
    .eq("status", "pending")
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** admin: رفض الاشتراك */
async function rejectSubscription(id, adminId) {
  const { data, error } = await supabaseAnon
    .from("subscriptions")
    .update({
      status: "rejected",
      reviewed_by: adminId,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("status", "pending")
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** التحقق هل عند المستخدم وصول نشط لباقة كاملة */
async function hasActiveAccess(userId) {
  const { data, error } = await supabaseAnon
    .from("subscriptions")
    .select("id, ends_at, subscription_courses(id)")
    .eq("user_id", userId)
    .eq("status", "active")
    .gt("ends_at", new Date().toISOString())
    .maybeSingle();

  if (error) throw error;
  return !!data;
}

/** التحقق هل عند المستخدم وصول لكورس معين (عبر باقة أو شراء مباشر) */
async function hasAccessToCourse(userId, courseId) {
  // 1) باقة نشطة → وصول للكل
  const hasPlan = await hasActiveAccess(userId);
  if (hasPlan) return true;

  // 2) شراء مباشر لهذا الكورس
  const { data, error } = await supabaseAnon
    .from("subscription_courses")
    .select("id, subscriptions!inner(status)")
    .eq("course_id", courseId)
    .eq("subscriptions.user_id", userId)
    .eq("subscriptions.status", "active")
    .maybeSingle();

  if (error) throw error;
  return !!data;
}

module.exports = {
  submitSubscription,
  getMySubscription,
  getPendingSubscriptions,
  getAllSubscriptions,
  approveSubscription,
  rejectSubscription,
  hasActiveAccess,
  hasAccessToCourse,
};