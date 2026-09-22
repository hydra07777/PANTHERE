# Panthère — Vue d'ensemble du projet

## Vision

Panthère est un assistant IA éducatif conçu pour l'Afrique. Contrairement à un
chatbot généraliste type ChatGPT, Panthère ne donne **jamais directement la
réponse** à un exercice ou un devoir. Son rôle est de guider l'étudiant vers
la compréhension, via une pédagogie socratique et des parcours d'apprentissage
adaptatifs, en s'appuyant sur une base de connaissances de contenus africains
(programmes scolaires, manuels, exemples contextualisés).

## Problème adressé

Les étudiants utilisent l'IA pour copier-coller des réponses toutes faites,
sans apprendre. Panthère inverse ce comportement : l'IA pousse à réfléchir,
pose des questions, donne des indices progressifs, et ne valide la
compréhension qu'après vérification active de l'étudiant.

## Piliers du produit

1. **Moteur socratique** — jamais de réponse directe, toujours un
   questionnement guidé (voir `04-system-prompt-socratique.md`).
2. **Parcours d'apprentissage adaptatifs** — diagnostic initial, découpage en
   sous-compétences, progression par maîtrise, répétition espacée.
3. **Base de connaissances africaine (RAG)** — contenus locaux (curricula par
   pays, manuels, exemples contextualisés) injectés dans les réponses (voir
   `05-plan-rag.md`).
4. **Contraintes locales** — connectivité limitée, coût des données,
   multilinguisme, modèle économique adapté au pouvoir d'achat.

## Non-objectifs (pour l'instant)

- Pas de comptes utilisateurs complexes en phase 1.
- Pas de multi-matières/multi-pays dès le départ — un seul sujet, un seul
  système éducatif pour valider le concept.
- Pas de paiement en phase 1.

## Statut actuel

Projet en phase de prototypage. Développeur solo, petit budget, objectif :
tester l'idée rapidement puis construire un vrai produit.

## Documents de ce dossier

- `01-roadmap.md` — étapes de réalisation, phase par phase.
- `02-architecture.md` — stack technique recommandée.
- `03-modele-donnees.md` — structure des données (utilisateurs, parcours, RAG).
- `04-system-prompt-socratique.md` — spécification du comportement pédagogique.
- `05-plan-rag.md` — conception de la base de connaissances africaine.
- `06-instructions-claude-code.md` — brief à donner à l'agent Claude Code
  pour démarrer l'implémentation (à utiliser comme `CLAUDE.md`).
