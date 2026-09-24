// ──────────────────────────────────────────────
// Plan d'apprentissage — Panthère
// Schéma JSON structuré pour les plans d'apprentissage.
// Un plan est généré par l'IA (avec appui RAG) pour un concept
// non maîtrisé, accepté par l'étudiant, puis suivi dans la
// conversation.
//
// Le plan vit dans IndexedDB (store "learning_plans").
// ──────────────────────────────────────────────

export type StatutSousPoint = "a_venir" | "en_cours" | "termine";
export type StatutPoint = StatutSousPoint; // agrégé depuis les sous-points
export type StatutPlan = "actif" | "complete" | "abandonne";

/** Sous-étape atomique d'un point d'apprentissage. */
export interface SousPoint {
  /** Identifiant stable : "p1.2", "p2.1", etc. */
  id: string;
  titre: string;
  /** Phrase d'accroche que l'IA peut utiliser pour démarrer
   *  la discussion sur ce sous-point. */
  questionInitiale?: string;
  statut: StatutSousPoint;
  /** Date ISO de marquage (quand pertinent). */
  termineAt?: string;
}

/** Regroupement thématique de sous-points.
 *  Ex : "Comprendre l'énoncé du théorème". */
export interface Point {
  id: string;
  titre: string;
  /** Description courte du point. */
  description?: string;
  sousPoints: SousPoint[];
}

/** Plan d'apprentissage complet pour un concept. */
export interface LearningPlan {
  /** Identifiant unique (généré côté client après acceptation). */
  id: string;
  concept: string;
  /** Matière ciblée (mathematiques, physique, etc.). */
  matiere: string;
  /** Phrase courte : "À la fin de ce plan, tu sauras…". */
  objectif: string;
  points: Point[];
  /** Statut global. */
  statut: StatutPlan;
  /** ID conversation où le plan a été créé. */
  conversationId?: string;
  createdAt: string;
  updatedAt: string;
}

/** Réponse de l'API /api/learning-plan (JSON structuré par Claude). */
export interface LearningPlanDraft {
  concept: string;
  matiere: string;
  objectif: string;
  points: {
    titre: string;
    description?: string;
    sousPoints: { titre: string; questionInitiale?: string }[];
  }[];
  /** Sources RAG utilisées pour construire le plan. */
  sources?: { titre: string; source?: string }[];
}

/** Calcule le statut agrégé d'un point depuis ses sous-points. */
export function aggregatePointStatut(p: Point): StatutPoint {
  if (p.sousPoints.length === 0) return "a_venir";
  const counts = { a_venir: 0, en_cours: 0, termine: 0 };
  for (const sp of p.sousPoints) counts[sp.statut]++;
  if (counts.termine === p.sousPoints.length) return "termine";
  if (counts.en_cours > 0 || counts.termine > 0) return "en_cours";
  return "a_venir";
}

/** Calcule le statut agrégé d'un plan depuis ses points. */
export function aggregatePlanStatut(plan: LearningPlan): StatutPlan {
  if (plan.points.length === 0) return plan.statut;
  const allPointStatuts = plan.points.map(aggregatePointStatut);
  if (allPointStatuts.every((s) => s === "termine")) return "complete";
  if (allPointStatuts.some((s) => s === "en_cours" || s === "termine"))
    return "actif";
  return plan.statut;
}

/** Pourcentage global (0-100). */
export function planProgressPct(plan: LearningPlan): number {
  const all = plan.points.flatMap((p) => p.sousPoints);
  if (all.length === 0) return 0;
  const done = all.filter((sp) => sp.statut === "termine").length;
  return Math.round((done / all.length) * 100);
}

/** Pourcentage d'un point (0-100). */
export function pointProgressPct(p: Point): number {
  if (p.sousPoints.length === 0) return 0;
  const done = p.sousPoints.filter((sp) => sp.statut === "termine").length;
  return Math.round((done / p.sousPoints.length) * 100);
}