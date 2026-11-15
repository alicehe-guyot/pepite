-- Photos (#88) : une photo d'idée suit le secret de l'idée. Lancer : npx supabase test db
begin;
create extension if not exists pgtap with schema extensions;
select plan(4);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000d1', 'alice@photo.local'),
  ('00000000-0000-0000-0000-0000000000d2', 'jb@photo.local');
insert into public.persons (id, name) values
  ('10000000-0000-0000-0000-0000000000d1', 'Alice'),
  ('10000000-0000-0000-0000-0000000000d2', 'JB');
insert into public.users (id, email, display_name, person_id) values
  ('00000000-0000-0000-0000-0000000000d1', 'alice@photo.local', 'Alice', '10000000-0000-0000-0000-0000000000d1'),
  ('00000000-0000-0000-0000-0000000000d2', 'jb@photo.local', 'JB', '10000000-0000-0000-0000-0000000000d2');
insert into public.ideas (id, title, created_by) values
  ('40000000-0000-0000-0000-0000000000d1', 'pour JB', '00000000-0000-0000-0000-0000000000d1');
insert into public.idea_recipients (idea_id, person_id) values
  ('40000000-0000-0000-0000-0000000000d1', '10000000-0000-0000-0000-0000000000d2');
insert into storage.objects (bucket_id, name, owner) values
  ('photos', 'ideas/40000000-0000-0000-0000-0000000000d1/a.jpg', '00000000-0000-0000-0000-0000000000d1'),
  ('photos', 'persons/10000000-0000-0000-0000-0000000000d2/b.jpg', '00000000-0000-0000-0000-0000000000d1');

set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000d1", "role": "authenticated"}';
select is((select count(*) from storage.objects where bucket_id = 'photos' and (name like '%-0000000000d1/%' or name like '%-0000000000d2/%')), 2::bigint, 'Alice voit la photo de l''idée et celle de la fiche');

set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000d2", "role": "authenticated"}';
select is((select count(*) from storage.objects where name = 'ideas/40000000-0000-0000-0000-0000000000d1/a.jpg'), 0::bigint, 'JB ne voit pas la photo d''une idée pour lui');
select is((select count(*) from storage.objects where name = 'persons/10000000-0000-0000-0000-0000000000d2/b.jpg'), 1::bigint, 'JB voit les photos des fiches');
select throws_ok(
  $$ insert into storage.objects (bucket_id, name, owner) values ('photos', 'ideas/40000000-0000-0000-0000-0000000000d1/c.jpg', '00000000-0000-0000-0000-0000000000d2') $$,
  '42501', null, 'JB ne peut pas déposer de photo sur une idée pour lui');

select * from finish();
rollback;
