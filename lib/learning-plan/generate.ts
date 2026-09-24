// ──────────────────────────────────────────────
// Génération de plan d'apprentissage — Panthère
// Appelé par /api/learning-plan. Prend un concept + profil,
// interroge le RAG local pour contextualiser, puis demande
// à Claude un plan structuré (JSON).
// ──────────────────────────────────────────────

import { searchRelevantContext, formatRAGContext } from "@/lib/rag/search";
import type { LearningPlanDraft } from "./types";

/** Prompt envoyé à Claude pour générer un plan structuré.
 *  On lui demande du JSON strict, parsable côté serveur. */
export const LEARNING_PLAN_SYSTEM_PROMPT = `Tu es Panthère, professeur pédagogique pour des étudiants africains (RDC, lycée et université). Tu dois produire un plan d'apprentissage structuré en JSON.

## Ton rôle

L'étudiant a un trou sur un concept et veut un plan pour le maîtriser. Tu conçois ce plan.

## Règles

- 3 à 5 POINTS principaux (étapes macro du parcours).
- Chaque point contient 2 à 5 SOUS-POINTS (étapes atomiques).
- Les sous-points doivent être CONCRETS et ACTIONNABLES : pas "comprendre X", mais "identifier l'hypothèse dans un énoncé", "vérifier une hypothèse sur un exemple simple", "résoudre un exercice d'application directe".
- L'ordre des points doit suivre une progression pédagogique : du plus simple (définition, repérage) au plus complexe (exercice, transfert).
- Chaque sous-point peut avoir une "questionInitiale" : la première question que l'IA posera à l'étudiant pour démarrer ce sous-point (en mode socratique, jamais la réponse).
- Adapte le vocabulaire et la profondeur au niveau scolaire fourni.
- Appuie-toi sur le contexte RAG s'il est fourni (programme RDC).

## Format de sortie

Réponds UNIQUEMENT avec un JSON valide de la forme :

{
  "concept": "<nom du concept>",
  "matiere": "<mathematiques|physique|svt|francais|anglais>",
  "objectif": "<phrase courte : À la fin, tu sauras…>",
  "points": [
    {
      "titre": "<titre du point 1>",
      "description": "<1 phrase>",
      "sousPoints": [
        { "titre": "<…>", "questionInitiale": "<question socratique d'ouverture>" },
        ...
      ]
    },
    ...
  ]
}

Aucun texte avant ou après le JSON. Pas de markdown. Pas de bloc \`\`\`. Juste le JSON.`;

export interface PlanRequest {
  concept: string;
  matiere: string;
  niveau?: string;
  pays?: string;
  /** Contexte récent de conversation pour mieux cibler le plan. */
  contexte?: string;
}

/** Construit le user prompt pour la génération du plan. */
function buildUserPrompt(req: PlanRequest, rag: string): string {
  const lines = [
    `Concept à maîtriser : ${req.concept}`,
    `Matière : ${req.matiere}`,
  ];
  if (req.niveau) lines.push(`Niveau scolaire : ${req.niveau}`);
  if (req.pays) lines.push(`Pays / contexte : ${req.pays}`);
  if (req.contexte) {
    lines.push("", "Contexte récent de conversation :", req.contexte);
  }
  if (rag) {
    lines.push("", rag);
  }
  lines.push("", "Génère le plan JSON maintenant.");
  return lines.join("\n");
}

/** Appelle Claude (via le client MiniMax) et récupère le plan en JSON. */
export async function generateLearningPlan(
  req: PlanRequest,
  callLLM: (args: {
    system: string;
    user: string;
    maxTokens?: number;
  }) => Promise<string>
): Promise<LearningPlanDraft> {
  const ragContext = searchRelevantContext(req.concept, {
    matiere: req.matiere,
    pays: req.pays,
    niveau: req.niveau,
  });
  const ragFormatted = formatRAGContext(ragContext);

  const raw = await callLLM({
    system: LEARNING_PLAN_SYSTEM_PROMPT,
    user: buildUserPrompt(req, ragFormatted),
    maxTokens: 1800,
  });

  // Extraction du JSON : Claude peut mettre des ```json autour, ou pas.
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("L'IA n'a pas renvoyé de JSON valide pour le plan.");
  }
  let parsed: LearningPlanDraft;
  try {
    parsed = JSON.parse(jsonMatch[0]) as LearningPlanDraft;
  } catch (e) {
    throw new Error("JSON du plan mal formé : " + (e as Error).message);
  }

  // Validation minimale
  if (!parsed.concept || !Array.isArray(parsed.points)) {
    throw new Error("Plan invalide : concept ou points manquants.");
  }
  if (parsed.points.length === 0) {
    throw new Error("Plan invalide : aucun point défini.");
  }

  // Attache les sources RAG pour affichage ultérieur.
  parsed.sources = ragContext.sources;

  return parsed;
}