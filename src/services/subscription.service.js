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

/** الطالب يرسل طلب اشتراك مع إثبات الدفع (صورة الشيك) */
async function submitSubscription(userId, payload) {
  const { plan_name, amount, payment_proof } = payload;

  const proofUrl = await uploadBase64ToStorage(payment_proof, "payment-proofs");

  const { data, error } = await supabaseAnon
    .from("subscriptions")
    .insert([{
      user_id: userId,
      plan_name,
      amount,
      status: "pending",
      payment_proof_url: proofUrl,
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** جلب الاشتراك الحالي للطالب (آخر واحد) */
async function getMySubscription(userId) {
  const { data, error } = await supabaseAnon
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/** admin: جلب كل الطلبات المعلّقة */
async function getPendingSubscriptions() {
  const { data, error } = await supabaseAnon
    .from("subscriptions")
    .select("*, profiles!subscriptions_user_id_fkey(full_name, email)")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data;
}

/** admin: جلب كل الاشتراكات (كل الحالات) */
async function getAllSubscriptions() {
  const { data, error } = await supabaseAnon
    .from("subscriptions")
    .select("*, profiles!subscriptions_user_id_fkey(full_name, email)")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

/** admin: قبول الاشتراك */
async function approveSubscription(id, adminId, days = 30) {
  const now = new Date();
  const endsAt = new Date(now);
  endsAt.setDate(endsAt.getDate() + Number(days));

  const { data, error } = await supabaseAnon
    .from("subscriptions")
    .update({
      status: "active",
      reviewed_by: adminId,
      reviewed_at: now.toISOString(),
      starts_at: now.toISOString(),
      ends_at: endsAt.toISOString(),
      updated_at: now.toISOString(),
    })
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

/** التحقق هل عند المستخدم وصول نشط (يستخدم فـ middleware الكورسات) */
async function hasActiveAccess(userId) {
  const { data, error } = await supabaseAnon
    .from("subscriptions")
    .select("id, ends_at")
    .eq("user_id", userId)
    .eq("status", "active")
    .gt("ends_at", new Date().toISOString())
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
};