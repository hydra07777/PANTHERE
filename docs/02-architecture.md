# Architecture technique — Panthère

Choix pensés pour un développeur solo avec un petit budget : rapidité de
mise en œuvre, coûts faibles ou nuls au démarrage, possibilité de faire
évoluer sans tout réécrire.

## Stack recommandée (Phase 1)

| Composant | Choix | Pourquoi |
|---|---|---|
| Frontend + Backend | Next.js (App Router) | Un seul projet, API routes intégrées, déploiement simple |
| Langage | TypeScript | Sécurité de type, écosystème riche |
| Modèle IA | API Anthropic (Claude) | Qualité de raisonnement, bon pour le prompt engineering pédagogique |
| Base vectorielle (RAG) | Supabase (pgvector) | Gratuit au départ, SQL classique + vecteurs, facile à requêter |
| Hébergement frontend | Vercel | Gratuit pour un projet perso/prototype |
| Hébergement backend | Intégré à Next.js sur Vercel (ou Railway si besoin de process séparés) | Pas de serveur à gérer |
| Auth (phase 2+) | Supabase Auth ou Clerk | Rapide à intégrer, gratuit jusqu'à un certain seuil |
| Stockage documents source | Supabase Storage ou simple dossier + script d'ingestion | Suffisant pour quelques dizaines de documents |

## Schéma général

```
Étudiant (navigateur / WhatsApp plus tard)
        │
        ▼
   Frontend Next.js (chat UI)
        │
        ▼
   API Route Next.js (/api/chat)
        │
        ├─► Recherche RAG (Supabase pgvector)
        │        └─ récupère les passages pertinents des documents africains
        │
        ├─► Construction du prompt final
        │        (system prompt socratique + contexte RAG + historique)
        │
        ▼
   API Anthropic (Claude)
        │
        ▼
   Réponse streamée à l'étudiant
```

## Modules à développer

1. **`lib/rag/`** — ingestion des documents (découpage/chunking, embeddings,
   insertion en base), et fonction de recherche par similarité.
2. **`lib/prompts/`** — le system prompt socratique, versionné et testable
   indépendamment du reste du code.
3. **`app/api/chat/route.ts`** — endpoint principal : reçoit le message de
   l'étudiant, va chercher le contexte RAG, appelle Claude, renvoie la
   réponse en streaming.
4. **`app/chat/page.tsx`** — interface de chat minimaliste.
5. **`lib/parcours/`** (phase 2+) — logique de découpage en sous-compétences
   et de progression par maîtrise.

## Pourquoi pas de framework RAG tout fait (LangChain, LlamaIndex) au début

Pour un prototype avec un seul sujet et quelques documents, une recherche
vectorielle simple codée à la main (embeddings + similarité cosinus via
pgvector) est plus rapide à comprendre, à déboguer, et à faire évoluer que
d'apprendre un framework complet. On pourra introduire ce genre d'outil plus
tard si la complexité du RAG le justifie.

## Évolutions prévues (Phase 3+)

- Passage à une base vectorielle managée plus robuste si le volume de
  documents grossit (Pinecone, Weaviate, ou Supabase reste suffisant selon
  l'échelle).
- Ajout d'une queue/job pour l'ingestion de gros volumes de documents.
- Mode "faible bande passante" : réponses plus courtes, compression,
  interface allégée, potentiellement une passerelle WhatsApp Business API.
