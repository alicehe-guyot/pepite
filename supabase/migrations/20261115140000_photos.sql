-- Photos des personnes et des idées (retour Alice #88).
-- Bucket privé « photos » : chemins persons/<id>/<fichier> et ideas/<id>/<fichier>.
-- Une photo d'idée suit le secret de l'idée (private.can_see_idea) : JB ne verra pas la photo
-- d'une idée pour lui, même en connaissant son chemin.
alter table public.persons add column photo_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create function private.can_see_photo(p_name text) returns boolean
language sql stable security definer set search_path = '' as $$
  select private.is_member() and case split_part(p_name, '/', 1)
    when 'persons' then true
    when 'ideas' then private.can_see_idea(nullif(split_part(p_name, '/', 2), '')::uuid)
    else false
  end;
$$;
grant execute on function private.can_see_photo(text) to authenticated;

create policy photos_select on storage.objects for select to authenticated
  using (bucket_id = 'photos' and private.can_see_photo(name));
create policy photos_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and private.can_see_photo(name));
create policy photos_update on storage.objects for update to authenticated
  using (bucket_id = 'photos' and private.can_see_photo(name));
create policy photos_delete on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and private.can_see_photo(name));
