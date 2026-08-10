-- 0003_rls_policies.sql
-- تفعيل RLS + سياسات الوصول لجدول profiles

alter table public.profiles enable row level security;

-- Helper: دالة تتحقق واش المستخدم الحالي admin (تُستعمل داخل السياسات)
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- 1) كل مستخدم يقدر يقرا الـ profile ديالو فقط
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles for select
using (auth.uid() = id);

-- 2) الـ admin يقدر يقرا جميع الـ profiles
drop policy if exists "profiles_select_admin" on public.profiles;
create policy "profiles_select_admin"
on public.profiles for select
using (public.is_admin());

-- 3) كل مستخدم يقدر يعدّل الـ profile ديالو (بلا ما يبدّل الـ role -- يتحقق منها فـ الكود/الـ API)
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- 4) الـ admin يقدر يعدّل جميع الـ profiles (بما فيها الدور)
drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin"
on public.profiles for update
using (public.is_admin())
with check (public.is_admin());

-- ملاحظة: عمليات الـ INSERT كتصرا فقط عبر الـ trigger (handle_new_user) بصلاحية security definer،
-- لذلك ما محتاجينش policy لـ insert من طرف المستخدم العادي.
-- عمليات changeRole الحساسة (تغيير دور مستخدم آخر) تُنفَّذ من الباك-إند بواسطة service_role key
-- (اللي كيتجاوز RLS بالكامل)، وليس عبر anon/authenticated key.
