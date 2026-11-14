-- Déplacer un événement d'un statut à l'autre à la main (retour Alice #39), pour une occurrence.
-- Le statut calculé à partir des cadeaux reste la règle ; ce choix ne vaut que pour l'occurrence
-- indiquée (un anniversaire repart en automatique l'année suivante). Aucune nouvelle politique :
-- les colonnes suivent la politique members_all de public.events.
alter table public.events
  add column status_override text check (status_override in ('todo', 'progress', 'ready')),
  add column status_override_on date;
