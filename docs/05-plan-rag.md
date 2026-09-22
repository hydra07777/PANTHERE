# Plan RAG — Base de connaissances africaine

## Objectif

Permettre à l'IA de répondre en s'appuyant sur des contenus réellement
adaptés au contexte africain (curricula nationaux, manuels, exemples
locaux) plutôt que sur des connaissances génériques occidentales.

## Portée en Phase 1

Un seul périmètre pour commencer, ex :
- Matière : mathématiques
- Niveau : lycée (à préciser, ex: terminale)
- Pays/curriculum : un seul pays au départ (ex: Côte d'Ivoire)

5 à 10 documents suffisent pour valider le pipeline technique avant
d'élargir.

## Types de contenus à collecter

- Programmes scolaires officiels (curricula)
- Manuels scolaires (avec attention aux droits d'auteur — privilégier les
  contenus officiels/libres de droits ou dont vous avez l'autorisation)
- Annales d'examens nationaux avec corrigés méthodologiques (pas juste la
  réponse finale, mais la démarche)
- Exemples contextualisés (cas pratiques locaux : agriculture, énergie,
  économie informelle, etc. selon la matière)

## Pipeline d'ingestion

1. **Collecte** : rassembler les documents sources (PDF, texte, etc.)
2. **Nettoyage** : extraire le texte propre (voir skill `pdf-reading` /
   `pdf` si les sources sont des PDF)
3. **Découpage (chunking)** : découper en passages de taille raisonnable
   (ex: 300-500 mots, avec un léger chevauchement entre chunks pour ne pas
   couper une idée en deux)
4. **Embeddings** : générer un vecteur pour chaque chunk
5. **Stockage** : insérer dans `document_chunks` (voir
   `03-modele-donnees.md`) avec les métadonnées (matière, pays, niveau)
6. **Indexation** : une fois plusieurs centaines de chunks, ajouter un
   index vectoriel pour accélérer la recherche

## Recherche au moment de la réponse

1. L'étudiant pose une question
2. On génère l'embedding de la question
3. On cherche les chunks les plus proches, **filtrés par métadonnées**
   (matière/pays/niveau de l'étudiant si connus)
4. On injecte les 3-5 passages les plus pertinents dans le prompt envoyé à
   Claude, avec instruction de s'appuyer dessus et de citer la source
   quand c'est pertinent

## Qualité et confiance

- Toujours citer la source d'un passage utilisé (nom du document/manuel)
  pour que l'étudiant puisse vérifier
- Prévoir un mécanisme pour signaler un contenu incorrect ou obsolète
- Éviter d'injecter du contexte non pertinent : mieux vaut ne rien injecter
  que d'injecter un passage hors-sujet qui pourrait induire l'IA en erreur

## Élargissement (Phase 3+)

- Ajout progressif d'autres matières et d'autres pays/curricula
- Système de tags plus fin (par chapitre, par compétence)
- Possibilité pour des enseignants de soumettre leurs propres contenus
  (avec modération avant intégration à la base)
