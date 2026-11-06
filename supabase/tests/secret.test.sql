-- Règle de secret (SPEC §8.5, §11, NF4) : JB ne voit jamais un cadeau ni une idée dont il est
-- destinataire, directement ou via un groupe. Lancer : npx supabase test db
begin;
create extension if not exists pgtap with schema extensions;
select plan(25);

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

-- Cercle C > foyer H (JB) ; groupe transverse T (JB, Emile).
insert into public.groups (id, name, kind, parent_id) values
  ('20000000-0000-0000-0000-00000000000c', 'Cercle', 'circle', null),
  ('20000000-0000-0000-0000-0000000000a1', 'Foyer', 'household', '20000000-0000-0000-0000-00000000000c'),
  ('20000000-0000-0000-0000-0000000000f1', 'Transverse', 'transverse', null);
insert into public.group_members (group_id, person_id) values
  ('20000000-0000-0000-0000-0000000000a1', '10000000-0000-0000-0000-00000000000b'),
  ('20000000-0000-0000-0000-0000000000f1', '10000000-0000-0000-0000-00000000000b'),
  ('20000000-0000-0000-0000-0000000000f1', '10000000-0000-0000-0000-00000000000e');

-- Cadeaux (créés par Alice sauf g7).
insert into public.gifts (id, title, created_by, visible_to_recipient_users) values
  ('30000000-0000-0000-0000-000000000001', 'pour JB', '00000000-0000-0000-0000-00000000000a', false),
  ('30000000-0000-0000-0000-000000000002', 'pour Emile', '00000000-0000-0000-0000-00000000000a', false),
  ('30000000-0000-0000-0000-000000000003', 'pour le foyer de JB', '00000000-0000-0000-0000-00000000000a', false),
  ('30000000-0000-0000-0000-000000000004', 'pour le cercle de JB', '00000000-0000-0000-0000-00000000000a', false),
  ('30000000-0000-0000-0000-000000000005', 'pour le groupe transverse', '00000000-0000-0000-0000-00000000000a', false),
  ('30000000-0000-0000-0000-000000000006', 'commun visible', '00000000-0000-0000-0000-00000000000a', true),
  ('30000000-0000-0000-0000-000000000007', 'reçu par JB, noté par JB', '00000000-0000-0000-0000-00000000000b', false),
  ('30000000-0000-0000-0000-000000000008', 'commun masqué', '00000000-0000-0000-0000-00000000000a', false);
insert into public.gift_recipients (gift_id, person_id, group_id) values
  ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-00000000000b', null),
  ('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-00000000000e', null),
  ('30000000-0000-0000-0000-000000000003', null, '20000000-0000-0000-0000-0000000000a1'),
  ('30000000-0000-0000-0000-000000000004', null, '20000000-0000-0000-0000-00000000000c'),
  ('30000000-0000-0000-0000-000000000005', null, '20000000-0000-0000-0000-0000000000f1'),
  ('30000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-00000000000b', null),
  ('30000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-00000000000b', null),
  ('30000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-00000000000b', null),
  ('30000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-00000000000e', null);
insert into public.gift_feedback (gift_id, rating, rated_by) values
  ('30000000-0000-0000-0000-000000000001', 'wow', '00000000-0000-0000-0000-00000000000a'),
  ('30000000-0000-0000-0000-000000000002', 'worked', '00000000-0000-0000-0000-00000000000a');
insert into public.gift_givers (gift_id, user_id) values
  ('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000a');

-- Idées.
insert into public.ideas (id, title, created_by) values
  ('40000000-0000-0000-0000-000000000001', 'idée pour JB par Alice', '00000000-0000-0000-0000-00000000000a'),
  ('40000000-0000-0000-0000-000000000002', 'envie de JB', '00000000-0000-0000-0000-00000000000b'),
  ('40000000-0000-0000-0000-000000000003', 'idée pour le groupe transverse', '00000000-0000-0000-0000-00000000000a'),
  ('40000000-0000-0000-0000-000000000004', 'envie d''Alice', '00000000-0000-0000-0000-00000000000a'),
  ('40000000-0000-0000-0000-000000000005', 'idée sans personne', '00000000-0000-0000-0000-00000000000a');
insert into public.idea_recipients (idea_id, person_id, group_id) values
  ('40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-00000000000b', null),
  ('40000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-00000000000b', null),
  ('40000000-0000-0000-0000-000000000003', null, '20000000-0000-0000-0000-0000000000f1'),
  ('40000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-00000000000a', null);

-- ---------------------------------------------------------------- JB
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-00000000000b", "role": "authenticated"}';

select set_eq(
  'select title from public.gifts',
  array['pour Emile', 'commun visible', 'reçu par JB, noté par JB'],
  'JB ne voit que les cadeaux dont il n''est pas destinataire, les communs visibles et ceux qu''il a créés'
);
select is_empty($$select 1 from public.gifts where id = '30000000-0000-0000-0000-000000000001'$$, 'JB : cadeau direct masqué');
select is_empty($$select 1 from public.gifts where id = '30000000-0000-0000-0000-000000000003'$$, 'JB : cadeau à son foyer masqué');
select is_empty($$select 1 from public.gifts where id = '30000000-0000-0000-0000-000000000004'$$, 'JB : cadeau au cercle de son foyer masqué');
select is_empty($$select 1 from public.gifts where id = '30000000-0000-0000-0000-000000000005'$$, 'JB : cadeau à son groupe transverse masqué');
select is_empty($$select 1 from public.gifts where id = '30000000-0000-0000-0000-000000000008'$$, 'JB : cadeau commun masqué par défaut');
select is_empty(
  $$select 1 from public.gift_recipients where gift_id in ('30000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000008')$$,
  'JB : destinataires d''un cadeau masqué invisibles'
);
select is_empty($$select 1 from public.gift_feedback where gift_id = '30000000-0000-0000-0000-000000000001'$$, 'JB : notation d''un cadeau masqué invisible');
select is_empty($$select 1 from public.gift_givers where gift_id = '30000000-0000-0000-0000-000000000001'$$, 'JB : offreurs d''un cadeau masqué invisibles');
select isnt_empty($$select 1 from public.gift_feedback where gift_id = '30000000-0000-0000-0000-000000000002'$$, 'JB : notation d''un cadeau visible lisible');

select set_eq(
  'select title from public.ideas',
  array['envie de JB', 'envie d''Alice', 'idée sans personne'],
  'JB voit ses envies, celles d''Alice, les idées sans personne, mais pas les idées pour lui'
);
select is_empty($$select 1 from public.idea_recipients where idea_id = '40000000-0000-0000-0000-000000000001'$$, 'JB : destinataires d''une idée masquée invisibles');

select is_empty(
  $$update public.gifts set title = 'x' where id = '30000000-0000-0000-0000-000000000001' returning 1$$,
  'JB ne peut pas modifier un cadeau masqué'
);
select is_empty(
  $$delete from public.gifts where id = '30000000-0000-0000-0000-000000000001' returning 1$$,
  'JB ne peut pas supprimer un cadeau masqué'
);
select throws_ok(
  $$insert into public.gift_recipients (gift_id, person_id) values ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-00000000000e')$$,
  '42501', null,
  'JB ne peut pas toucher aux destinataires d''un cadeau masqué'
);
select throws_ok(
  $$insert into public.gifts (title, created_by) values ('usurpé', '00000000-0000-0000-0000-00000000000a')$$,
  '42501', null,
  'JB ne peut pas créer un cadeau au nom d''Alice'
);
select lives_ok(
  $$insert into public.gifts (title) values ('cadeau de JB pour Emile')$$,
  'JB peut créer un cadeau'
);
select is((select count(*)::int from public.persons), 3, 'JB voit toutes les fiches');
select throws_ok(
  $$update public.users set person_id = '10000000-0000-0000-0000-00000000000e' where id = '00000000-0000-0000-0000-00000000000b'$$,
  '42501', null,
  'JB ne peut pas changer la fiche liée à son compte'
);

-- ---------------------------------------------------------------- Alice
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}';
select is((select count(*)::int from public.gifts), 9, 'Alice voit tous les cadeaux (aucun n''est pour elle)');
select set_eq(
  'select title from public.ideas',
  array['idée pour JB par Alice', 'envie de JB', 'idée pour le groupe transverse', 'envie d''Alice', 'idée sans personne'],
  'Alice voit toutes les idées, y compris ses envies et celles de JB'
);

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
