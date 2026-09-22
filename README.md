# Panthère — Assistant IA éducatif socratique pour l'Afrique

Panthère ne donne **jamais** la réponse à un exercice : il guide l'étudiant
par une pédagogie socratique (diagnostic → indices progressifs → vérification)
en s'appuyant sur des contenus pédagogiques africains.

> **Statut** : MVP hackathon. Pile minimale : Next.js + MiniMax-M3.
> Pas de Supabase, pas d'OpenAI externe, pas de base vectorielle : la base de
> connaissances africaine est chargée en mémoire dans le serveur.

---

## 1. Pré-requis

- **Node.js 18+**
- Une **clé API MiniMax** (crée-la sur <https://platform.minimax.io>)

## 2. Installation

```bash
npm install
cp .env.example .env.local
# Édite .env.local et colle ta clé après MINIMAX_API_KEY=
```

## 3. Lancer

```bash
npm run dev        # serveur sur http://localhost:3000
npm run test       # 13 tests (system prompt + RAG)
npm run build      # build de production (ne nécessite pas la clé)
```

Le chat est accessible sur <http://localhost:3000/chat>.

## 4. Architecture

```
Navigateur (app/chat)
       │
       ▼
API Next.js (app/api/chat/route.ts)
       │
       ├─► Rate-limit (lib/rate-limit.ts)
       │
       ├─► RAG en mémoire (lib/rag/search.ts)
       │      └─ charge test-data/*.txt, découpe en chunks,
       │         tokenise, score par overlap lexical
       │
       ├─► System prompt socratique (lib/prompts/socratic.ts)
       │      + injection du contexte RAG pertinent
       │
       └─► MiniMax-M3 via SDK OpenAI-compat (lib/minimax.ts)
              └─ stream SSE renvoyé au navigateur
```

## 5. Ajouter des documents

Pose un nouveau fichier `test-data/mon-cours.txt` avec un frontmatter YAML :

```
---
titre: Titre du document
matiere: mathematiques
pays: Cote d'Ivoire
niveau: lycee
source: Nom du manuel
---

Contenu du cours, en texte brut. Il sera découpé en chunks
de 80 mots avec 15 mots de chevauchement.
```

Recharge le serveur (Ctrl+C → `npm run dev`) : les documents sont
réindexés au démarrage.

## 6. Variables d'environnement

| Variable              | Description                                |
| --------------------- | ------------------------------------------ |
| `MINIMAX_API_KEY`     | Clé API MiniMax (obligatoire en runtime)   |
| `NEXT_PUBLIC_APP_URL` | URL de l'app (utile au déploiement)        |

## 7. Limites connues & pistes d'évolution

- **Recherche lexicale** : pas de similarité sémantique. Suffisant pour
  quelques documents ; passer à des embeddings (OpenAI ou local) dès que
  la base grandit.
- **Pas d'auth** : Phase 1, l'historique est conservé en `localStorage`.
- **Contexte** : 20 derniers échanges + 3 chunks RAG.
- **Streaming** : SSE standard, fonctionne derrière Vercel sans config.
- **Multilinguisme** : prêt à recevoir des questions en français +
  langues africaines ; le tokenizer retire déjà les accents.