// ──────────────────────────────────────────────
// Helpers de parsing des marqueurs IA — Panthère
// Marqueurs discrets ajoutés par Claude en fin de réponse :
//   [PLAN_PROPOSAL: nom_concept]
//   [PROGRESS: plan_id point_id.sous_id]
// ──────────────────────────────────────────────

const PLAN_PROPOSAL_REGEX = /\[PLAN_PROPOSAL:\s*([^\]]+)\]/i;
const PROGRESS_REGEX = /\[PROGRESS:\s+([a-z0-9_-]+)\s+([a-z0-9_-]+)\]/i;

/** Extrait le concept proposé pour un plan d'apprentissage, ou null. */
export function extractPlanProposal(content: string): string | null {
  const m = content.match(PLAN_PROPOSAL_REGEX);
  if (!m) return null;
  const concept = m[1].trim().toLowerCase();
  return concept.length > 0 ? concept : null;
}

/** Extrait un marqueur [PROGRESS: plan_id sous_id], ou null. */
export function extractProgressMark(
  content: string
): { planId: string; sousPointId: string } | null {
  const m = content.match(PROGRESS_REGEX);
  if (!m) return null;
  return { planId: m[1], sousPointId: m[2] };
}

/** Retire les marqueurs [PLAN_PROPOSAL:] et [PROGRESS:] du contenu affiché. */
export function stripPlanMarkers(content: string): string {
  return content
    .replace(PLAN_PROPOSAL_REGEX, "")
    .replace(PROGRESS_REGEX, "")
    .trimEnd();
}