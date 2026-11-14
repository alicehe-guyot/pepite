-- Femme ou homme, adulte ou enfant (retour Alice #76), pour filtrer Personnes, Idées et Offerts.
-- Facultatifs. Aucune nouvelle politique : les colonnes suivent members_all de public.persons.
alter table public.persons
  add column gender text check (gender in ('female', 'male')),
  add column age_group text check (age_group in ('adult', 'child'));
