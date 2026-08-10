-- seed.sql
-- اختياري: بعد ما تسجل يدويًا (signup) بأول حساب admin ديالك عبر الـ API العادي،
-- نفّذ هاذ السطر فـ SQL editor ديال Supabase باش تحوّلو لـ admin
-- (بدّل الإيميل بالإيميل ديالك):

update public.profiles
set role = 'admin'
where email = 'admin@example.com';
