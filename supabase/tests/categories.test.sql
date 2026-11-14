-- Catégories (#69) : réservées aux membres, comme les fiches. Lancer : npx supabase test db
begin;
create extension if not exists pgtap with schema extensions;
select plan(4);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000c1', 'alice@cat.local'),
  ('00000000-0000-0000-0000-0000000000c2', 'inconnu@cat.local');
insert into public.users (id, email, display_name) values ('00000000-0000-0000-0000-0000000000c1', 'alice@cat.local', 'Alice');

set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000c1", "role": "authenticated"}';
select ok((select count(*) from public.categories) >= 8, 'un membre voit les catégories');
select lives_ok($$ insert into public.categories (name) values ('Test catégorie') $$, 'un membre en ajoute une');
select lives_ok($$ delete from public.categories where name = 'Test catégorie' $$, 'et la supprime');

set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000c2", "role": "authenticated"}';
select is((select count(*) from public.categories), 0::bigint, 'un compte inconnu ne voit rien');

select * from finish();
rollback;
