// src/services/module.service.js
const { supabaseAnon: supabase } = require("../config/supabaseClient");

/**
 * يقابل resolvedModules(courseId) فـ lms-storage.ts:
 * كترجع الموديولات مرتبة مع الدروس متاعها متداخلة (nested).
 */
async function resolvedModules(courseId) {
  console.log("kmdsfmksj")
  const { data, error } = await supabase
    .from("modules")
    .select("*, lessons(*)")
    .eq("course_id", courseId)
    .order("order_index", { ascending: true });
  if (error){
    console.log("error",error)
     throw error};

  // نرتب الدروس جوّه كل موديول بـ order_index باش تبقى نفس القراءة متاع الفرونت
  return (data || []).map((m) => ({
    ...m,
    lessons: (m.lessons || []).sort((a, b) => a.order_index - b.order_index),
  }));
}

/** getStoredModules هو نفسه resolvedModules هنا، خاطر ماكانش نسخة "افتراضية" مولدة، الداتا ديما حقيقية */
const getStoredModules = resolvedModules;

/**
 * يقابل setStoredModules(courseId, modules[]) — بديل كامل لبنية الموديولات/الدروس متاع كورس.
 * كل module فـ modules[] يقدر يجي بـ id (تحديث) أو بلا id (إنشاء)، ونفس الشي للـ lessons جوّاه.
 * الموديولات/الدروس القدام اللي ماجاوش ذكرهم فـ الطلب الجديد كيتشالو (sync كامل).
 */
async function setStoredModules(courseId, modules) {
  console.log("Connecting to database...", { courseId });

  const { data: existing, error: exErr } = await supabase
    .from("modules")
    .select("id")
    .eq("course_id", courseId);

  if (exErr) {
    console.error("❌ Error fetching existing modules:", exErr);
    throw exErr;
  }

  const incomingIds = modules.filter((m) => m.id).map((m) => m.id);
  const toDelete = (existing || [])
    .map((m) => m.id)
    .filter((id) => !incomingIds.includes(id));

  if (toDelete.length) {
    const { error: delErr } = await supabase.from("modules").delete().in("id", toDelete);
    if (delErr) {
      console.error("❌ Error deleting modules:", delErr);
      throw delErr;
    }
  }

  const savedModules = [];
  for (let i = 0; i < modules.length; i++) {
    const { id, lessons = [], ...rest } = modules[i];
    const modulePayload = { ...rest, course_id: courseId, order_index: i };

    let moduleRow;
    if (id) {
      const { data, error } = await supabase
        .from("modules")
        .update({ ...modulePayload, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
        
      if (error) {
        console.error("❌ Error updating module:", error);
        throw error;
      }
      moduleRow = data;
    } else {
      const { data, error } = await supabase
        .from("modules")
        .insert(modulePayload)
        .select()
        .single();
        
      if (error) {
        console.error("❌ Error inserting module:", error);
        throw error;
      }
      moduleRow = data;
    }

    const savedLessons = await syncLessons(moduleRow.id, lessons);
    savedModules.push({ ...moduleRow, lessons: savedLessons });
  }

  return savedModules;
}

async function syncLessons(moduleId, lessons) {
  const { data: existing, error: exErr } = await supabase
    .from("lessons")
    .select("id")
    .eq("module_id", moduleId);
  if (exErr) throw exErr;

  const incomingIds = lessons.filter((l) => l.id).map((l) => l.id);
  const toDelete = (existing || [])
    .map((l) => l.id)
    .filter((id) => !incomingIds.includes(id));

  if (toDelete.length) {
    const { error: delErr } = await supabase.from("lessons").delete().in("id", toDelete);
    if (delErr) throw delErr;
  }

  const saved = [];
  for (let i = 0; i < lessons.length; i++) {
    const { id, ...rest } = lessons[i];
    const payload = { ...rest, module_id: moduleId, order_index: i };

    if (id) {
      const { data, error } = await supabase
        .from("lessons")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      saved.push(data);
    } else {
      const { data, error } = await supabase
        .from("lessons")
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      saved.push(data);
    }
  }
  return saved;
}

async function deleteModule(id) {
  const { error } = await supabase.from("modules").delete().eq("id", id);
  if (error) throw error;
  return true;
}

module.exports = {
  resolvedModules,
  getStoredModules,
  setStoredModules,
  deleteModule,
};
