-- Règle de secret (SPEC §8.5, décision du 2026-11-22) : chacun voit tout, sauf les idées et
-- cadeaux que l'autre a marqués « Secret » (hidden_by). Lancer : npx supabase test db
begin;
create extension if not exists pgtap with schema extensions;
select plan(24);

-- Comptes : Alice, JB, et un inconnu qui s'est inscrit tout seul.
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'alice@test.local'),
  ('00000000-0000-0000-0000-00000000000b', 'jb@test.local'),
  ('00000000-0000-0000-0000-0000000000ff', 'inconnu@test.local');

insert into public.persons (id, name) values
  ('10000000-0000-0000-0000-00000000000a', 'Alice'),
  ('10000000-0000-0000-0000-00000000000b', 'JB'),
  ('10000000-0000-0000-0000-00000000000e', 'Emile');

insert into public.users (id, email, display_name, person_id) values
  ('00000000-0000-0000-0000-00000000000a', 'alice@test.local', 'Alice', '10000000-0000-0000-0000-00000000000a'),
  ('00000000-0000-0000-0000-00000000000b', 'jb@test.local', 'JB', '10000000-0000-0000-0000-00000000000b');

-- Cadeaux.
insert into public.gifts (id, title, created_by, hidden_by) values
  ('30000000-0000-0000-0000-000000000001', 'pour JB, secret d''Alice', '00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000a'),
  ('30000000-0000-0000-0000-000000000002', 'pour JB, pas secret', '00000000-0000-0000-0000-00000000000a', null),
  ('30000000-0000-0000-0000-000000000003', 'pour Alice, secret de JB', '00000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000b'),
  ('30000000-0000-0000-0000-000000000004', 'pour Emile', '00000000-0000-0000-0000-00000000000a', null);
insert into public.gift_recipients (gift_id, person_id) values
  ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-00000000000b'),
  ('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-00000000000b'),
  ('30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-00000000000a'),
  ('30000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-00000000000e');
insert into public.gift_feedback (gift_id, rating, rated_by) values
  ('30000000-0000-0000-0000-000000000001', 'wow', '00000000-0000-0000-0000-00000000000a');

-- Idées. La 4 a été créée par JB pour lui, puis cachée par Alice (elle veut la lui offrir).
insert into public.ideas (id, title, created_by, hidden_by) values
  ('40000000-0000-0000-0000-000000000001', 'idée pour JB, secret d''Alice', '00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000a'),
  ('40000000-0000-0000-0000-000000000002', 'idée pour JB, pas secret', '00000000-0000-0000-0000-00000000000a', null),
  ('40000000-0000-0000-0000-000000000003', 'idée pour Alice, secret de JB', '00000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000b'),
  ('40000000-0000-0000-0000-000000000004', 'envie de JB cachée par Alice', '00000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a');
insert into public.idea_recipients (idea_id, person_id) values
  ('40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-00000000000b'),
  ('40000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-00000000000a');

-- ---------------------------------------------------------------- JB
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-00000000000b", "role": "authenticated"}';

select set_eq(
  $$select title from public.gifts where id::text like '30000000-%' or title like '%de JB'$$,
  array['pour JB, pas secret', 'pour Alice, secret de JB', 'pour Emile'],
  'JB voit tout sauf les cadeaux qu''Alice a cachés'
);
select set_eq(
  $$select title from public.ideas where id::text like '40000000-%'$$,
  array['idée pour JB, pas secret', 'idée pour Alice, secret de JB'],
  'JB voit tout sauf les idées qu''Alice a cachées, même celles qu''il a créées'
);
select is_empty($$select 1 from public.gift_recipients where gift_id = '30000000-0000-0000-0000-000000000001'$$, 'JB : destinataires d''un cadeau caché invisibles');
select is_empty($$select 1 from public.gift_feedback where gift_id = '30000000-0000-0000-0000-000000000001'$$, 'JB : note d''un cadeau caché invisible');
select is_empty($$select 1 from public.idea_recipients where idea_id = '40000000-0000-0000-0000-000000000001'$$, 'JB : destinataires d''une idée cachée invisibles');
select is_empty(
  $$update public.gifts set title = 'x' where id = '30000000-0000-0000-0000-000000000001' returning 1$$,
  'JB ne peut pas modifier un cadeau caché'
);
select is_empty(
  $$delete from public.ideas where id = '40000000-0000-0000-0000-000000000001' returning 1$$,
  'JB ne peut pas supprimer une idée cachée'
);
select throws_ok(
  $$insert into public.gift_recipients (gift_id, person_id) values ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-00000000000e')$$,
  '42501', null,
  'JB ne peut pas toucher aux destinataires d''un cadeau caché'
);
select throws_ok(
  $$update public.ideas set hidden_by = '00000000-0000-0000-0000-00000000000a' where id = '40000000-0000-0000-0000-000000000002'$$,
  '42501', null,
  'JB ne peut pas cacher une idée au nom d''Alice'
);
select throws_ok(
  $$insert into public.gifts (title, hidden_by) values ('caché pour Alice', '00000000-0000-0000-0000-00000000000a')$$,
  '42501', null,
  'JB ne peut pas créer un cadeau caché au nom d''Alice'
);
select throws_ok(
  $$insert into public.gifts (title, created_by) values ('usurpé', '00000000-0000-0000-0000-00000000000a')$$,
  '42501', null,
  'JB ne peut pas créer un cadeau au nom d''Alice'
);
select lives_ok(
  $$insert into public.gifts (title, hidden_by) values ('surprise de JB', '00000000-0000-0000-0000-00000000000b')$$,
  'JB peut créer un cadeau secret'
);
select lives_ok(
  $$update public.ideas set hidden_by = '00000000-0000-0000-0000-00000000000b' where id = '40000000-0000-0000-0000-000000000002'$$,
  'JB peut cacher une idée visible'
);
select is((select count(*)::int from public.persons where id::text like '10000000-%'), 3, 'JB voit toutes les fiches');
select throws_ok(
  $$update public.users set person_id = '10000000-0000-0000-0000-00000000000e' where id = '00000000-0000-0000-0000-00000000000b'$$,
  '42501', null,
  'JB ne peut pas changer la fiche liée à son compte'
);

-- ---------------------------------------------------------------- Alice
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}';
select set_eq(
  $$select title from public.gifts where id::text like '30000000-%' or title like '%de JB'$$,
  array['pour JB, secret d''Alice', 'pour JB, pas secret', 'pour Emile'],
  'Alice voit tout sauf les cadeaux que JB a cachés'
);
select set_eq(
  $$select title from public.ideas where id::text like '40000000-%'$$,
  array['idée pour JB, secret d''Alice', 'envie de JB cachée par Alice'],
  'Alice voit ses secrets, pas ceux de JB (dont l''idée qu''il vient de cacher)'
);
select lives_ok(
  $$update public.gifts set hidden_by = null where id = '30000000-0000-0000-0000-000000000001'$$,
  'Alice peut révéler son secret'
);
select is_empty($$select 1 from public.gifts where id = '30000000-0000-0000-0000-000000000003'$$, 'Alice : cadeau caché par JB invisible');

-- Révélé par Alice : JB le voit.
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-00000000000b", "role": "authenticated"}';
select isnt_empty($$select 1 from public.gifts where id = '30000000-0000-0000-0000-000000000001'$$, 'JB voit le cadeau une fois révélé');

-- ---------------------------------------------------------------- Inconnu inscrit
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000ff", "role": "authenticated"}';
select is_empty('select 1 from public.persons', 'Inconnu : aucune fiche');
select is_empty('select 1 from public.gifts', 'Inconnu : aucun cadeau');
select is_empty('select 1 from public.ideas', 'Inconnu : aucune idée');

-- ---------------------------------------------------------------- Anonyme
reset role;
set local role anon;
select throws_ok('select 1 from public.gifts', '42501', null, 'Anonyme : accès refusé');

select * from finish();
rollback;
