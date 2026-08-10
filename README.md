# LMS Auth Backend — Express + Supabase (Supabase Auth)

## نظرة عامة

باك-إند مسؤول فقط على **Authentication & Authorization** لمشروع الـ LMS:
- استخدام **Supabase Auth** (تسجيل الدخول/الاشتراك جاهزين من Supabase — بدون بناء JWT/bcrypt يدويًا).
- **Supabase Postgres** لتخزين بيانات إضافية (profiles + roles).
- **Express.js** كطبقة API وسيطة بين الـ Frontend والـ Supabase (routes خاصة بالتسجيل، تسجيل الدخول، جلب البروفايل، حماية الـ routes حسب الدور).
- 3 أدوار: `student` (افتراضي عند التسجيل) و `teacher` و `admin`.

---

## 1. هيكلة المشروع (Project Structure)

```
lms-auth-backend/
│
├── src/
│   ├── config/
│   │   └── supabaseClient.js        # إنشاء عميل Supabase (public + service_role)
│   │
│   ├── middlewares/
│   │   ├── authMiddleware.js        # يتحقق من التوكن (Bearer JWT) عبر Supabase
│   │   └── roleMiddleware.js        # يتحقق من الدور (student/teacher/admin) قبل الوصول لـ route معين
│   │
│   ├── controllers/
│   │   ├── auth.controller.js       # signUp, signIn, signOut, refreshSession, forgotPassword
│   │   └── user.controller.js       # getProfile, updateProfile, listUsers (admin), changeRole (admin)
│   │
│   ├── routes/
│   │   ├── auth.routes.js           # /api/auth/*
│   │   └── user.routes.js           # /api/users/*
│   │
│   ├── services/
│   │   ├── auth.service.js          # منطق التواصل مع Supabase Auth (signUp/signIn...)
│   │   └── profile.service.js       # منطق CRUD على جدول profiles
│   │
│   ├── utils/
│   │   ├── response.js              # موحّد للـ success/error responses
│   │   └── logger.js                # تسجيل الأخطاء والطلبات
│   │
│   ├── app.js                       # إعداد Express (middlewares عامة، cors، routes)
│   └── server.js                    # نقطة الانطلاق (app.listen)
│
├── supabase/
│   ├── migrations/
│   │   ├── 0001_create_profiles_table.sql   # جدول profiles + enum الأدوار
│   │   ├── 0002_create_trigger_new_user.sql # trigger: عند إنشاء user جديد فـ auth.users -> ينشئ صف فـ profiles تلقائيًا
│   │   └── 0003_rls_policies.sql            # سياسات Row Level Security لكل جدول
│   └── seed.sql                              # (اختياري) بيانات تجريبية: أول admin مثلاً
│
├── .env.example                     # نموذج المتغيرات البيئية
├── .gitignore
├── package.json
└── README.md
```

---

## 2. الجداول فـ Supabase (Database Design)

### أ) `auth.users` (جدول جاهز من Supabase — ما نديروش فيه تعديل مباشر)
يحتوي: `id (uuid)`, `email`, `encrypted_password`, `created_at`... إلخ.
هذا الجدول Supabase Auth كيدبّرو بروحو (signUp / signIn / reset password).

### ب) `public.profiles` (الجدول اللي غادي نصاوبوه احنا)

| العمود | النوع | ملاحظات |
|---|---|---|
| `id` | `uuid` (PK, FK -> `auth.users.id`) | نفس الـ id ديال المستخدم فـ auth.users |
| `full_name` | `text` | |
| `email` | `text` | نسخة مكررة للسهولة فـ queries (اختياري) |
| `role` | `user_role` (enum: `student` \| `teacher` \| `admin`) | الافتراضي `student` |
| `avatar_url` | `text` (nullable) | |
| `created_at` | `timestamp` | default `now()` |
| `updated_at` | `timestamp` | |

📁 يتعرّف فـ: `supabase/migrations/0001_create_profiles_table.sql`

### ج) Trigger تلقائي (`0002_create_trigger_new_user.sql`)
كل مرة يتسجل مستخدم جديد فـ `auth.users` (عبر Supabase Auth signUp)، الـ trigger كيصاوب تلقائيًا صف جديد فـ `public.profiles` بالـ role الافتراضي `student`.

### د) Row Level Security — RLS (`0003_rls_policies.sql`)
- المستخدم يقدر يقرا/يعدّل غير الـ profile ديالو.
- الـ `admin` يقدر يشوف/يعدّل جميع الـ profiles (عبر policy خاصة بالدور).
- الـ `teacher` صلاحيات وسط (حسب ما تحتاج فـ المرحلة الجاية).

---

## 3. الـ Routes (Express API)

| Method | Route | الوصف | الحماية |
|---|---|---|---|
| POST | `/api/auth/signup` | تسجيل مستخدم جديد (يمرّ عبر Supabase Auth) | عام |
| POST | `/api/auth/signin` | تسجيل الدخول | عام |
| POST | `/api/auth/signout` | تسجيل الخروج | يحتاج token |
| POST | `/api/auth/refresh` | تجديد الـ session | يحتاج refresh token |
| POST | `/api/auth/forgot-password` | إرسال رابط استرجاع كلمة السر | عام |
| GET | `/api/users/me` | جلب بروفايل المستخدم الحالي | يحتاج token |
| PATCH | `/api/users/me` | تعديل البروفايل ديال المستخدم | يحتاج token |
| GET | `/api/users` | لائحة جميع المستخدمين | `admin` فقط |
| PATCH | `/api/users/:id/role` | تغيير دور مستخدم معيّن | `admin` فقط |

---

## 4. متغيرات البيئة (`.env.example`)

```
PORT=4000
SUPABASE_URL=https://xxxxxxx.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key   # يُستعمل فقط server-side (خطير يبان فـ frontend)
```

---

## 5. الخطوات الجاية (بعد الموافقة على هاذ الهيكلة)

1. إنشاء مشروع جديد فـ [supabase.com](https://supabase.com) (Database + Auth).
2. تنفيذ ملفات `supabase/migrations/*.sql` (عبر SQL editor ديال Supabase أو `supabase db push`).
3. بناء `src/config/supabaseClient.js` بعميلين: واحد بـ `anon key` (للعمليات العادية) وواحد بـ `service_role key` (للعمليات الإدارية كـ تغيير الأدوار).
4. بناء الـ middlewares والـ controllers والـ routes حسب الجدول فوق.
5. ربط الـ Frontend ديالك (اللي فيه `storage.ts`) بالـ API الجديد بدل الـ `localStorage` تدريجيًا (نبدأو بـ auth فقط، والـ mock data الأخرى تبقى كما هي مؤقتًا).

---

هذا الملف غير توثيق للهيكلة (لا يحتوي كود بعد). قولّي واش هاذ التصميم يعجبك أو تحب نبدّل شي حاجة، ومنبعد نبداو نكتبو الكود ملف بملف.
# backend-project-education-express
