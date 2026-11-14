-- Catégories modifiables et multiples (retour Alice #69).
-- Une table partagée par les membres (pas de secret : ce sont des libellés), et un tableau de
-- catégories sur les idées et sur les cadeaux. L'ancienne colonne ideas.category reste, inutilisée.
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (length(trim(name)) > 0),
  position smallint not null default 0,
  created_at timestamptz not null default now()
);
alter table public.categories enable row level security;
create policy members_all on public.categories for all to authenticated
  using (private.is_member()) with check (private.is_member());

alter table public.ideas add column categories text[] not null default '{}';
alter table public.gifts add column categories text[] not null default '{}';

insert into public.categories (name, position) values
  ('Activités', 1),
  ('Naissance', 2),
  ('Enfants', 3),
  ('Féminin', 4),
  ('Livres', 5),
  ('Abonnements', 6),
  ('Maison', 7),
  ('Moins personnel', 8);
