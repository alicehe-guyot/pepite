-- Création depuis l'app (retour Alice : « Offerte » ne s'enregistrait pas, capture idem).
-- La lecture des idées et cadeaux passe par private.can_see_idea / can_see_gift, qui relisent la
-- table : une ligne en cours d'insertion n'y est pas encore visible, donc INSERT … RETURNING
-- est refusé. L'app crée l'identifiant elle-même et insère sans relecture ; ce test fige les deux.
-- Lancer : npx supabase test db
begin;
create extension if not exists pgtap with schema extensions;
select plan(6);

insert into auth.users (id, email) values ('00000000-0000-0000-0000-0000000000a1', 'alice@insert.local');
insert into public.persons (id, name) values ('10000000-0000-0000-0000-0000000000a1', 'Alice');
insert into public.users (id, email, display_name, person_id)
  values ('00000000-0000-0000-0000-0000000000a1', 'alice@insert.local', 'Alice', '10000000-0000-0000-0000-0000000000a1');
insert into public.persons (id, name) values ('10000000-0000-0000-0000-0000000000b1', 'May');

set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000a1", "role": "authenticated"}';

select lives_ok(
  $$ insert into public.ideas (id, title) values ('40000000-0000-0000-0000-0000000000a1', 'Parapluie') $$,
  'une idée s''insère sans relecture');
select lives_ok(
  $$ insert into public.idea_recipients (idea_id, person_id)
     values ('40000000-0000-0000-0000-0000000000a1', '10000000-0000-0000-0000-0000000000b1') $$,
  'puis ses destinataires');
select lives_ok(
  $$ insert into public.gifts (id, title, idea_id, status, given_on)
     values ('30000000-0000-0000-0000-0000000000a1', 'Parapluie', '40000000-0000-0000-0000-0000000000a1', 'given', '2026-11-14') $$,
  'un cadeau offert s''insère sans relecture');
select lives_ok(
  $$ insert into public.gift_recipients (gift_id, person_id)
     values ('30000000-0000-0000-0000-0000000000a1', '10000000-0000-0000-0000-0000000000b1') $$,
  'puis ses destinataires');
select lives_ok(
  $$ insert into public.gift_feedback (gift_id, rating) values ('30000000-0000-0000-0000-0000000000a1', 'wow') $$,
  'puis sa note');
select throws_ok(
  $$ insert into public.ideas (title) values ('avec relecture') returning id $$,
  '42501', null,
  'INSERT … RETURNING sur ideas reste refusé : ne pas l''utiliser dans l''app');

select * from finish();
rollback;
