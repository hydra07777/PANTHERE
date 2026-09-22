# Panthère — Claude Code

## Contexte du projet

Panthère est un assistant IA éducatif pour l'Afrique. Il ne donne jamais
directement la réponse à un exercice : il guide l'étudiant via une
pédagogie socratique (indices progressifs, vérification de compréhension)
et s'appuie sur une base de connaissances RAG de contenus africains.

Les documents de référence sont dans `docs/`.

## Stack

- **Frontend + Backend** : Next.js 15 (App Router, TypeScript)
- **IA** : API Anthropic Claude (modèle: claude-sonnet-4-20250514)
- **Embeddings** : OpenAI text-embedding-3-small (512 dimensions)
- **Base vectorielle** : Supabase pgvector
- **Hébergement** : Vercel
- **Tests** : Vitest

## Structure du projet

```
├── app/
│   ├── api/chat/route.ts    # API endpoint (streaming)
│   ├── chat/page.tsx         # Interface de chat
│   ├── globals.css           # Styles Tailwind
│   ├── layout.tsx            # Layout racine
│   └── page.tsx              # Page d'accueil
├── lib/
│   ├── hooks/use-local-storage.ts  # Hook localStorage
│   ├── prompts/socratic.ts         # System prompt socratique
│   ├── rag/
│   │   ├── types.ts          # Types RAG
│   │   ├── embeddings.ts     # Service OpenAI embeddings
│   │   └── search.ts         # Recherche vectorielle Supabase
│   └── rate-limit.ts         # Rate limiting mémoire
├── scripts/ingest.ts         # Script d'ingestion documents
├── tests/
│   └── socratic-prompt.test.ts
├── test-data/                 # Documents de test (maths CI)
├── supabase-migration.sql     # SQL pour créer les tables
└── .env.example               # Variables d'environnement
```

## Commandes

```bash
npm run dev       # Démarrer le serveur de dev
npm run build     # Build de production
npm run test      # Exécuter les tests
npm run ingest    # Ingérer les documents dans Supabase
```

## Règles de développement

1. **System prompt** : toujours dans `lib/prompts/socratic.ts`, jamais hardcodé
2. **RAG** : recherche vectorielle simple via Supabase, pas de framework externe
3. **Pas de comptes utilisateurs** en Phase 1 (historique côté client)
4. **Toujours streamer** les réponses Claude (pas d'attente bloquante)
5. **Tests** : exécuter `npm run test` après chaque modification du prompt
6. **Types** : tout le code en TypeScript strict

## Dépendances principales

- `next`, `react`, `react-dom`
- `@anthropic-ai/sdk` (API Claude)
- `openai` (embeddings)
- `@supabase/supabase-js` (base de données)

## Notes

- Le modèle Claude utilisé est `claude-sonnet-4-20250514`
- Les embeddings utilisent `text-embedding-3-small` avec 512 dimensions
- Le rate limiting est configuré à 60 requêtes/minute par IP
- L'historique de chat est persisté dans localStorage
- La migration SQL est dans `supabase-migration.sql`