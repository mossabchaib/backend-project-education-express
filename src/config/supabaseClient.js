// src/config/supabaseClient.js
// إنشاء عميلين Supabase:
// - supabaseAnon: يُستعمل للعمليات العادية (signUp, signIn) وكيحترم RLS
// - supabaseAdmin: يُستعمل فقط للعمليات الإدارية (تغيير دور، حذف مستخدم...) وكيتجاوز RLS
//   ⚠️ SUPABASE_SERVICE_ROLE_KEY خطير جدًا - ما يخرجش برا الباك-إند أبدًا (ما يتبعتش للـ frontend).

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    "Missing Supabase env vars. Check SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY in your .env file."
  );
}

const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

module.exports = { supabaseAnon, supabaseAdmin };
