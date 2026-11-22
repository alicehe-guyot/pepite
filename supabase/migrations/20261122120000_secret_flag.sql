-- Secret à la main (décision d'Alice du 2026-11-22, SPEC §8.5 et §19).
-- Avant : un utilisateur ne voyait jamais une idée ou un cadeau dont il était destinataire.
-- Maintenant : chacun voit tout, sauf ce que l'autre a marqué « Secret ».
-- hidden_by = le compte qui a caché la ligne ; elle n'est visible que de lui. null : visible de tous.
-- Rien n'est secret par défaut, et rien de l'existant ne le devient.

alter table public.ideas add column hidden_by uuid references auth.users (id) on delete set null;
alter table public.gifts add column hidden_by uuid references auth.users (id) on delete set null;

create or replace function private.can_see_gift(p_gift_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select private.is_member() and exists (
    select 1 from public.gifts g
    where g.id = p_gift_id and (g.hidden_by is null or g.hidden_by = auth.uid())
  );
$$;

create or replace function private.can_see_idea(p_idea_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select private.is_member() and exists (
    select 1 from public.ideas i
    where i.id = p_idea_id and (i.hidden_by is null or i.hidden_by = auth.uid())
  );
$$;

-- On ne cache une ligne qu'en son propre nom : personne ne peut la cacher « pour » l'autre.
drop policy secret_insert on public.ideas;
create policy secret_insert on public.ideas for insert to authenticated
  with check (private.is_member() and created_by = auth.uid() and (hidden_by is null or hidden_by = auth.uid()));
drop policy secret_update on public.ideas;
create policy secret_update on public.ideas for update to authenticated
  using (private.can_see_idea(id)) with check (private.is_member() and (hidden_by is null or hidden_by = auth.uid()));

drop policy secret_insert on public.gifts;
create policy secret_insert on public.gifts for insert to authenticated
  with check (private.is_member() and created_by = auth.uid() and (hidden_by is null or hidden_by = auth.uid()));
drop policy secret_update on public.gifts;
create policy secret_update on public.gifts for update to authenticated
  using (private.can_see_gift(id)) with check (private.is_member() and (hidden_by is null or hidden_by = auth.uid()));

comment on column public.gifts.visible_to_recipient_users is 'Obsolète depuis 2026-11-22 (remplacé par hidden_by).';
