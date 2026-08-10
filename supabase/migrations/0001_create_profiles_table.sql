-- 0001_create_profiles_table.sql
-- إنشاء enum الأدوار + جدول profiles المرتبط بـ auth.users

-- 1) Enum للأدوار الثلاثة
create type public.user_role as enum ('student', 'teacher', 'admin');

-- 2) جدول profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  email text,
  role public.user_role not null default 'student',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3) فهرسة للبحث السريع حسب الدور
create index if not exists profiles_role_idx on public.profiles (role);

-- 4) دالة + trigger لتحديث updated_at تلقائيًا فـ كل UPDATE
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();
