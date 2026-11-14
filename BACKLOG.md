# Backlog

Toute idée nouvelle arrive ici d'abord. Elle entre dans le code seulement si elle en remplace une autre ou si elle a été demandée 3 fois (spec §3).

## V2 (janvier 2027)
- Tagging IA des captures et matching idée ↔ personne
- Adresse email pour les newsletters (Voxe…)
- Bibliothèque « à refaire »
- Suggestions IA par personne

## Accès JB (dès qu'Alice le décide, #80)
- Créer le compte de JB avec son propre mot de passe (`scripts/set-password.mjs jb`) et l'ajouter à la connexion (`src/app/login/actions.ts`)
- La règle du secret est déjà en base (RLS testée) : JB ne verra ni les idées ni les cadeaux pour lui, ni ceux de ses groupes, sauf ce qu'il crée
- À vérifier avant : les idées « Famille JB », « Alice & JB & Emile »… lui seront masquées ; choisir celles à rendre visibles

## V3 (printemps 2027)
- Serveur MCP, intégration Instinct si API
- Rappels de retrait géolocalisés
- « Partager mes pépites » pour conseiller des gens sans idée
- Test avec 3 à 5 familles : comptes séparés (une base par famille ou une colonne famille + RLS), inscription, parcours d'accueil qui guide (créer sa fiche, ses proches, ses événements, une première idée), import depuis des notes (#80)

## En attente de décision
- Raccourci iOS hors ligne (note Apple de secours) : à tester
- Budget par personne : champ optionnel ?
