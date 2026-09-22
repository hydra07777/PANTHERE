# Roadmap — Panthère

Développeur solo, petit budget. Objectif : valider vite, construire ensuite.

## Phase 1 — Prototype minimal (2 à 4 semaines)

Objectif : prouver que le moteur socratique fonctionne, avant d'investir
dans le reste.

### Étapes

1. **Setup projet**
   - [ ] Initialiser un repo Next.js (frontend + API routes dans le même
         projet pour aller vite)
   - [ ] Configurer l'accès à l'API Claude (clé API, `.env`)
   - [ ] Déployer un "hello world" sur Vercel pour valider la chaîne complète

2. **Chat de base**
   - [ ] Interface de chat simple (une seule page, pas de design élaboré)
   - [ ] Connexion à l'API Claude, streaming des réponses
   - [ ] Historique de conversation conservé côté client (pas de DB pour l'instant)

3. **Moteur socratique (priorité n°1)**
   - [ ] Rédiger et tester le system prompt (voir
         `04-system-prompt-socratique.md`)
   - [ ] Tester manuellement avec 10-15 questions d'étudiants types
   - [ ] Ajuster le prompt jusqu'à ce que l'IA ne "craque" jamais et ne
         donne pas la réponse directement

4. **RAG minimal**
   - [ ] Choisir UN seul sujet pour commencer (ex: maths niveau lycée,
         un seul pays)
   - [ ] Rassembler 5 à 10 documents (programme officiel, exercices types)
   - [ ] Mettre en place une base vectorielle simple (Supabase pgvector ou
         Chroma en local)
   - [ ] Brancher la recherche RAG dans le pipeline de réponse

5. **Boucle pédagogique**
   - [ ] Diagnostic : l'IA demande ce que l'étudiant a déjà tenté
   - [ ] Indices progressifs (niveau 1 → 2 → 3)
   - [ ] Vérification de compréhension après chaque explication

**Ce qu'on NE construit PAS encore** : comptes utilisateurs, dashboard prof,
multi-matières, paiement, application mobile.

## Phase 2 — Test avec de vrais utilisateurs (2 à 3 semaines)

- [ ] Recruter 10-20 étudiants réels (réseau personnel, une classe, un
      groupe WhatsApp)
- [ ] Observer où ils bloquent et comment ils tentent de contourner le
      système socratique
- [ ] Logger les conversations (avec consentement) pour analyse
- [ ] Itérer sur le prompt et le parcours selon les retours

## Phase 3 — Produit réel

- [ ] Comptes utilisateurs (auth) + persistance des conversations et de la
      progression
- [ ] Suivi de progression visible (dashboard étudiant)
- [ ] Extension à plusieurs matières / plusieurs pays (curricula distincts)
- [ ] Dashboard enseignant/parent (lecture seule sur la progression)
- [ ] Optimisation du RAG (plus de documents, meilleur chunking, citation
      des sources)
- [ ] Réflexion sérieuse sur : mode faible bande passante, multilinguisme,
      modèle économique (freemium, partenariats écoles)

## Phase 4 — Mise à l'échelle

- [ ] Partenariats avec écoles/ministères
- [ ] Version WhatsApp/SMS pour zones à faible connectivité
- [ ] Support multilingue (langues locales)
- [ ] Infrastructure scalable (passage éventuel à une base vectorielle
      managée, monitoring, etc.)

## Priorité immédiate

Commencer par l'étape 3 de la Phase 1 (le moteur socratique) car c'est la
pièce la plus critique et la plus rapide à tester : elle peut être validée
avec juste un system prompt + l'API Claude, avant même de toucher au RAG ou
à l'interface.
