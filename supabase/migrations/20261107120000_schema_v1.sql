-- Pépite V1 : schéma de base et règle de secret.
-- Source : docs/SPEC.md §11, corrigé par §8.10 (cercles/foyers/groupes, Piste,
-- Choisi → Commandé → Prêt → Offert, notation wow / a marché / pas marché, portrait à 5 rubriques).
--
-- Accès : seuls les comptes présents dans public.users (Alice, JB) voient quelque chose.
-- Un compte Supabase Auth créé par un inconnu ne lit et n'écrit rien.
--
-- Secret : un utilisateur ne lit jamais un cadeau ni une idée dont il est destinataire,
-- directement ou via un groupe (ou le cercle parent d'un foyer) dont sa fiche est membre.
-- Exceptions : ce qu'il a créé lui-même (ses envies, les cadeaux reçus qu'il note)
-- et les cadeaux marqués visible_to_recipient_users (cadeau commun).

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.persons (
  id uuid primary key default gen_random_uuid(),
  slug text unique,                                  -- identifiant lisible, utilisé par l'import
  name text not null,
  nickname text,
  description text,                                  -- portrait libre (import des notes)
  -- Portrait : 5 rubriques identiques pour tous (§8.10)
  situation text,
  passions text,
  style text,
  avoid text,
  wishes text,
  birth_year smallint check (birth_year between 1900 and 2100),
  birth_month smallint check (birth_month between 1 and 12),
  birth_day smallint check (birth_day between 1 and 31),
  birth_date_uncertain boolean not null default false,
  life_stage_tags text[] not null default '{}',
  family_situation text,
  preferences text[] not null default '{}',
  budget_min numeric(10, 2),
  budget_max numeric(10, 2),
  city text,
  country text,                                      -- code ISO (FR, GB, US…)
  delivery_mode text check (delivery_mode in ('in_person', 'post', 'via_someone')),
  address text,
  sizes text,
  notes text,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  display_name text not null,
  person_id uuid unique references public.persons (id) on delete set null,
  capture_token_hash text unique,                    -- jeton du raccourci iOS, haché
  created_at timestamptz not null default now()
);

-- Cercle (Famille de JB…) > foyer (Mama et Papa…) ; groupes transverses (Les cousines…).
create table public.groups (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  name text not null,
  kind text not null check (kind in ('circle', 'household', 'transverse')),
  type text check (type in ('family', 'couple', 'parent_child', 'single', 'cousins', 'other')),
  parent_id uuid references public.groups (id) on delete set null,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  check (parent_id is null or kind = 'household')
);

create table public.group_members (
  group_id uuid not null references public.groups (id) on delete cascade,
  person_id uuid not null references public.persons (id) on delete cascade,
  primary key (group_id, person_id)
);

create table public.ideas (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  title text not null,
  url text,
  links text[] not null default '{}',                -- où acheter, page Instinct
  image_path text,
  source text not null default 'manual'
    check (source in ('shortcut', 'whatsapp', 'email', 'manual', 'store', 'import')),
  price numeric(10, 2),
  category text,                                     -- Naissance, Enfants / jouets, Librairie…
  format text check (format in ('object', 'activity', 'voucher', 'shared_experience')),
  is_lead boolean not null default false,            -- Piste : un thème sans produit
  note text,
  status text not null default 'inbox' check (status in ('inbox', 'sorted', 'archived')),
  is_reusable boolean not null default false,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.idea_recipients (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references public.ideas (id) on delete cascade,
  person_id uuid references public.persons (id) on delete cascade,
  group_id uuid references public.groups (id) on delete cascade,
  check (num_nonnulls(person_id, group_id) = 1),
  unique (idea_id, person_id),
  unique (idea_id, group_id)
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  type text not null check (type in (
    'christmas', 'birthday', 'wedding_anniversary', 'valentines', 'birth',
    'mothers_day', 'fathers_day', 'invitation', 'other')),
  title text not null,
  date date not null,
  recurrence text not null default 'none' check (recurrence in ('yearly', 'none')),
  reference_year smallint,                           -- année du mariage → « 10 ans de mariage »
  person_id uuid references public.persons (id) on delete cascade, -- anniversaire tiré d'une fiche
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

-- Personnes concernées par un événement, avec leur avancement (À trouver → Piste → Trouvé → Offert).
create table public.event_persons (
  event_id uuid not null references public.events (id) on delete cascade,
  person_id uuid not null references public.persons (id) on delete cascade,
  status text not null default 'to_find' check (status in ('to_find', 'lead', 'found', 'given')),
  primary key (event_id, person_id)
);

create table public.gifts (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid references public.ideas (id) on delete set null,
  event_id uuid references public.events (id) on delete set null,
  event_label text,                                  -- événement passé sans fiche (import)
  title text not null,
  format text check (format in ('object', 'activity', 'voucher', 'shared_experience')),
  status text not null default 'chosen'
    check (status in ('chosen', 'to_plan', 'ordered', 'ready', 'given')),
  needs_pickup boolean not null default false,       -- case « à récupérer » sur Commandé
  requested_by_recipient boolean not null default false,
  received boolean not null default false,           -- cadeau reçu par Alice ou JB
  price_paid numeric(10, 2),
  order_url text,
  order_deadline date,
  pickup_place text,
  tracking text,
  note text,
  visible_to_recipient_users boolean not null default false,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.gift_recipients (
  id uuid primary key default gen_random_uuid(),
  gift_id uuid not null references public.gifts (id) on delete cascade,
  person_id uuid references public.persons (id) on delete cascade,
  group_id uuid references public.groups (id) on delete cascade,
  check (num_nonnulls(person_id, group_id) = 1),
  unique (gift_id, person_id),
  unique (gift_id, group_id)
);

create table public.gift_givers (
  id uuid primary key default gen_random_uuid(),
  gift_id uuid not null references public.gifts (id) on delete cascade,
  user_id uuid references public.users (id) on delete cascade,
  free_text text,
  check (num_nonnulls(user_id, free_text) = 1)
);

create table public.gift_feedback (
  gift_id uuid primary key references public.gifts (id) on delete cascade,
  rating text not null check (rating in ('wow', 'worked', 'miss')),
  comment text,
  redo boolean,
  rated_by uuid default auth.uid() references auth.users (id) on delete set null,
  rated_at timestamptz not null default now()
);

create table public.settings (
  user_id uuid primary key references public.users (id) on delete cascade,
  gift_principles text,
  inspiration_links text[] not null default '{}',
  shipping_delays_by_country jsonb not null default '{"FR": 3, "GB": 10, "US": 15}'
);

create table public.app_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid default auth.uid() references public.users (id) on delete set null,
  screen text,
  text text not null,
  screenshot_path text,
  github_issue_url text,
  created_at timestamptz not null default now()
);

create index on public.group_members (person_id);
create index on public.idea_recipients (person_id);
create index on public.idea_recipients (group_id);
create index on public.gift_recipients (person_id);
create index on public.gift_recipients (group_id);
create index on public.gifts (event_id);
create index on public.gifts (idea_id);
create index on public.event_persons (person_id);
create index on public.events (date);

-- ---------------------------------------------------------------------------
-- Fonctions de la règle de secret (security definer : lisent sans RLS, ne renvoient qu'un booléen)
-- ---------------------------------------------------------------------------

create schema if not exists private;

create function private.is_member() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.users where id = auth.uid());
$$;

-- Groupes qui « contiennent » la fiche de l'utilisateur courant : ses groupes directs
-- et le cercle parent de son foyer.
create function private.my_group_ids() returns setof uuid
language sql stable security definer set search_path = '' as $$
  with mine as (
    select gm.group_id
    from public.group_members gm
    join public.users u on u.person_id = gm.person_id
    where u.id = auth.uid()
  )
  select group_id from mine
  union
  select g.parent_id from public.groups g join mine on mine.group_id = g.id
  where g.parent_id is not null;
$$;

create function private.is_gift_recipient(p_gift_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.gift_recipients r
    where r.gift_id = p_gift_id
      and (
        r.person_id = (select person_id from public.users where id = auth.uid())
        or r.group_id in (select private.my_group_ids())
      )
  );
$$;

create function private.is_idea_recipient(p_idea_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.idea_recipients r
    where r.idea_id = p_idea_id
      and (
        r.person_id = (select person_id from public.users where id = auth.uid())
        or r.group_id in (select private.my_group_ids())
      )
  );
$$;

create function private.can_see_gift(p_gift_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select private.is_member() and exists (
    select 1 from public.gifts g
    where g.id = p_gift_id
      and (
        g.visible_to_recipient_users
        or g.created_by = auth.uid()
        or not private.is_gift_recipient(g.id)
      )
  );
$$;

create function private.can_see_idea(p_idea_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select private.is_member() and exists (
    select 1 from public.ideas i
    where i.id = p_idea_id
      and (i.created_by = auth.uid() or not private.is_idea_recipient(i.id))
  );
$$;

revoke all on schema private from public;
grant usage on schema private to authenticated;
revoke all on all functions in schema private from public;
grant execute on all functions in schema private to authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.persons enable row level security;
alter table public.users enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.ideas enable row level security;
alter table public.idea_recipients enable row level security;
alter table public.events enable row level security;
alter table public.event_persons enable row level security;
alter table public.gifts enable row level security;
alter table public.gift_recipients enable row level security;
alter table public.gift_givers enable row level security;
alter table public.gift_feedback enable row level security;
alter table public.settings enable row level security;
alter table public.app_feedback enable row level security;

-- Données partagées sans secret : membres seulement.
create policy members_all on public.persons for all to authenticated
  using (private.is_member()) with check (private.is_member());
create policy members_all on public.groups for all to authenticated
  using (private.is_member()) with check (private.is_member());
create policy members_all on public.group_members for all to authenticated
  using (private.is_member()) with check (private.is_member());
create policy members_all on public.events for all to authenticated
  using (private.is_member()) with check (private.is_member());
create policy members_all on public.event_persons for all to authenticated
  using (private.is_member()) with check (private.is_member());

-- Comptes : lecture par les membres, modification de sa propre ligne (jamais son id).
create policy members_read on public.users for select to authenticated
  using (private.is_member());
create policy self_update on public.users for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
-- Seul le nom affiché est modifiable : changer person_id contournerait le secret.
revoke update on public.users from authenticated;
grant update (display_name) on public.users to authenticated;

-- Idées : secret.
create policy secret_select on public.ideas for select to authenticated
  using (private.can_see_idea(id));
create policy secret_insert on public.ideas for insert to authenticated
  with check (private.is_member() and created_by = auth.uid());
create policy secret_update on public.ideas for update to authenticated
  using (private.can_see_idea(id)) with check (private.is_member());
create policy secret_delete on public.ideas for delete to authenticated
  using (private.can_see_idea(id));

create policy secret_all on public.idea_recipients for all to authenticated
  using (private.can_see_idea(idea_id)) with check (private.can_see_idea(idea_id));

-- Cadeaux : secret.
create policy secret_select on public.gifts for select to authenticated
  using (private.can_see_gift(id));
create policy secret_insert on public.gifts for insert to authenticated
  with check (private.is_member() and created_by = auth.uid());
create policy secret_update on public.gifts for update to authenticated
  using (private.can_see_gift(id)) with check (private.is_member());
create policy secret_delete on public.gifts for delete to authenticated
  using (private.can_see_gift(id));

create policy secret_all on public.gift_recipients for all to authenticated
  using (private.can_see_gift(gift_id)) with check (private.can_see_gift(gift_id));
create policy secret_all on public.gift_givers for all to authenticated
  using (private.can_see_gift(gift_id)) with check (private.can_see_gift(gift_id));
create policy secret_all on public.gift_feedback for all to authenticated
  using (private.can_see_gift(gift_id)) with check (private.can_see_gift(gift_id));

-- Réglages : chacun les siens. Mes principes sont lus par les deux pour le brief.
create policy members_read on public.settings for select to authenticated
  using (private.is_member());
create policy self_write on public.settings for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- « Ça cloche » : chacun crée et relit les siens.
create policy self_all on public.app_feedback for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid() and private.is_member());

-- Aucun accès anonyme.
revoke all on all tables in schema public from anon;
