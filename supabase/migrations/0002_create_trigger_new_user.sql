-- 0002_create_trigger_new_user.sql
-- عند إنشاء مستخدم جديد فـ auth.users (عبر Supabase Auth signUp)
-- كيتصاوب تلقائيًا صف جديد فـ public.profiles بالـ role الافتراضي "student".
--
-- ⚠️ تنبيه أمني: الدور (role) دائمًا "student" بغض النظر عمّا يُرسله المستخدم،
-- لأن raw_user_meta_data قابل للتلاعب من الـ client مباشرة (لا يجب الوثوق به لتحديد الصلاحيات).
-- تغيير الدور إلى teacher/admin يتم فقط لاحقًا عبر API محمي بـ service_role key (انظر user.controller.js -> changeRole).

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.email,
    'student'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();
