-- Date à laquelle un cadeau a été offert (retour Alice #25 : voir la date sur chaque fiche).
-- Aucune nouvelle politique : la colonne suit les politiques secrètes de public.gifts.
alter table public.gifts add column given_on date;

-- Reprise : un cadeau offert lié à un événement ponctuel prend la date de l'événement.
update public.gifts g
set given_on = e.date
from public.events e
where g.event_id = e.id and g.status = 'given' and e.recurrence = 'none';
