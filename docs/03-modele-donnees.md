# Modèle de données — Panthère

Ce document décrit les entités principales. En Phase 1, seules les tables
`documents` et `document_chunks` sont réellement nécessaires. Le reste est
là pour anticiper la Phase 2/3.

## Phase 1 (RAG uniquement, pas d'auth)

### `documents`
| Colonne | Type | Description |
|---|---|---|
| id | uuid | identifiant |
| titre | text | titre du document |
| matiere | text | ex: "mathématiques" |
| pays | text | ex: "Côte d'Ivoire" |
| niveau | text | ex: "lycée, terminale" |
| source | text | origine (manuel officiel, auteur, etc.) |
| contenu_brut | text | texte complet du document |
| created_at | timestamp | |

### `document_chunks`
| Colonne | Type | Description |
|---|---|---|
| id | uuid | identifiant |
| document_id | uuid (FK) | référence vers `documents` |
| contenu | text | portion découpée du document |
| embedding | vector | vecteur d'embedding (pgvector) |
| position | int | ordre dans le document |

## Phase 2+ (comptes utilisateurs et progression)

### `users`
| Colonne | Type | Description |
|---|---|---|
| id | uuid | identifiant |
| nom | text | |
| pays | text | pour adapter le curriculum |
| niveau_scolaire | text | |
| role | enum | étudiant / enseignant / parent |
| created_at | timestamp | |

### `parcours`
| Colonne | Type | Description |
|---|---|---|
| id | uuid | identifiant |
| user_id | uuid (FK) | |
| matiere | text | |
| objectif | text | ex: "comprendre les équations du second degré" |
| sous_competences | jsonb | liste ordonnée des sous-étapes |
| statut | enum | en cours / terminé |
| created_at | timestamp | |

### `progression`
| Colonne | Type | Description |
|---|---|---|
| id | uuid | identifiant |
| parcours_id | uuid (FK) | |
| sous_competence | text | |
| statut_maitrise | enum | non acquis / en cours / acquis |
| derniere_evaluation | timestamp | |
| historique_erreurs | jsonb | pour la répétition espacée |

### `conversations`
| Colonne | Type | Description |
|---|---|---|
| id | uuid | identifiant |
| user_id | uuid (FK) | |
| parcours_id | uuid (FK, nullable) | |
| messages | jsonb | historique des échanges |
| created_at | timestamp | |

## Notes d'implémentation

- En Phase 1, l'historique de conversation peut rester **côté client**
  (state React), aucune table `conversations` n'est nécessaire tant qu'il
  n'y a pas de comptes utilisateurs.
- Le champ `embedding` nécessite l'extension `pgvector` activée sur
  Supabase (`create extension if not exists vector;`).
- Prévoir un index sur `document_chunks.embedding` (ex: `ivfflat`) une fois
  qu'il y a plusieurs centaines de chunks, pas nécessaire au tout début.
