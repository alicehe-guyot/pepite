# Pépite — instructions pour l'agent de dev

@AGENTS.md

- Lire `docs/SPEC.md` avant toute tâche. Elle prime sur toute autre source. Les décisions du prototype sont en §8.10.
- **Périmètre :** ne coder que la version en cours (§4). Toute nouvelle idée va dans `BACKLOG.md`, pas dans le code.
- **3 onglets :** Agenda, ＋, Carnet. Refuser tout nouvel onglet ou menu de premier niveau ; proposer un emplacement dans un onglet existant.
- **Secret :** un utilisateur ne voit jamais un cadeau dont il est destinataire (règle en base, RLS). Toute nouvelle table ou requête sur `gifts`, `ideas`, notifications ou export passe par des politiques RLS testées (`supabase/tests`).
- **DA :** tokens dans `src/app/globals.css`. Accent framboise, soleil pour ce qui se prépare, pastels pour les personnes. Pas d'orange. Libellés de 1 à 3 mots, pas de sous-titres, pas de séparateurs (« - », « · »), pas d'emoji, pas d'exclamation.
- **Mobile d'abord :** iPhone, une main, cibles tactiles ≥ 44 px.
- **Petits incréments :** une PR = une user story, critères d'acceptation cochés dans la description.
- **Feedback :** pour chaque issue `feedback`, produire l'analyse §14 (constat, 5 pourquoi, origine, qui change quoi, garde-fou) avant de corriger.
- **Décisions :** toute décision produit ou technique va au §19 de la spec.
- **Données familiales :** `supabase/seed/*.json` reste hors de git.
- **Langue :** interface en français ; code, tables et colonnes en anglais.
- **Next.js 16 :** Cache Components désactivé (pages privées et dynamiques). Le middleware s'appelle `src/proxy.ts`.
