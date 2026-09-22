# Instructions pour Claude Code — Démarrage du projet Panthère

Ce document est destiné à être donné tel quel à l'agent Claude Code (par
exemple copié dans un fichier `CLAUDE.md` à la racine du repo, ou collé
directement dans le premier message) pour démarrer l'implémentation.

---

## Contexte du projet

Panthère est un assistant IA éducatif pour l'Afrique. Il ne donne jamais
directement la réponse à un exercice : il guide l'étudiant via une
pédagogie socratique (indices progressifs, vérification de compréhension)
et s'appuie sur une base de connaissances RAG de contenus africains
(curricula, manuels, exemples locaux).

Les documents de référence complets sont dans le dossier `panthere-docs/` :
- `00-project-overview.md` — vision et piliers du produit
- `01-roadmap.md` — étapes détaillées
- `02-architecture.md` — stack technique
- `03-modele-donnees.md` — schéma des données
- `04-system-prompt-socratique.md` — spécification du comportement pédagogique
- `05-plan-rag.md` — conception de la base RAG

Lis ces documents avant de commencer à coder.

## Objectif de cette première session

Construire le **Prototype Phase 1** décrit dans `01-roadmap.md` :
un chat fonctionnel avec moteur socratique et RAG minimal sur un seul
sujet.

## Tâches à réaliser, dans l'ordre

1. **Initialiser le projet**
   - Créer un projet Next.js (App Router, TypeScript)
   - Configurer les variables d'environnement (`ANTHROPIC_API_KEY`,
     variables Supabase)
   - Vérifier que le projet démarre en local

2. **Créer le system prompt socratique**
   - Fichier `lib/prompts/socratic.ts`
   - Implémenter les principes décrits dans
     `04-system-prompt-socratique.md` (diagnostic, indices progressifs,
     refus de donner la réponse directe, vérification de compréhension)
   - Écrire le prompt en français, ton bienveillant et concis

3. **Mettre en place la base RAG minimale**
   - Activer `pgvector` sur Supabase
   - Créer les tables `documents` et `document_chunks` (voir
     `03-modele-donnees.md`)
   - Écrire un script d'ingestion (`scripts/ingest.ts`) qui :
     - découpe un texte en chunks
     - génère les embeddings
     - insère en base
   - Créer une fonction de recherche par similarité
     (`lib/rag/search.ts`)

4. **Construire l'API de chat**
   - `app/api/chat/route.ts` :
     - reçoit le message de l'étudiant + historique
     - appelle `lib/rag/search.ts` pour récupérer le contexte pertinent
     - construit le prompt final (system prompt + contexte RAG + historique)
     - appelle l'API Anthropic en streaming
     - retourne la réponse en streaming au frontend

5. **Construire l'interface de chat**
   - `app/chat/page.tsx` : interface minimaliste, historique conservé côté
     client (pas de DB en phase 1)
   - Affichage en streaming des réponses

6. **Documents de test**
   - Créer 2-3 documents de test (texte brut) sur un seul sujet
     (ex: équations du second degré, niveau lycée) pour valider le
     pipeline RAG de bout en bout

## Contraintes à respecter

- Pas de comptes utilisateurs, pas de paiement, pas de dashboard en Phase 1
- Le system prompt doit être dans un fichier séparé, pas hardcodé dans les
  routes API
- Code en TypeScript, structure claire, pas de sur-ingénierie (pas de
  framework RAG externe pour l'instant — recherche vectorielle simple via
  Supabase)
- Prioriser un chemin de bout en bout fonctionnel plutôt qu'un module
  parfait isolé

## Critère de succès de cette session

Un développeur peut :
1. Lancer le projet en local
2. Poser une question liée au sujet de test dans le chat
3. Recevoir une réponse qui (a) ne donne pas la solution directement,
   (b) s'appuie sur le contexte RAG injecté, (c) pose une question de
   diagnostic ou un indice progressif

## Après cette session

Se référer à la Phase 2 de `01-roadmap.md` : test avec de vrais étudiants
et itération sur le prompt.
