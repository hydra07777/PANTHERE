// ──────────────────────────────────────────────
// Extraction des blocs <think>...</think> — Panthère
// Certains modèles (Claude Sonnet 4, MiniMax-M3) émettent par défaut
// un bloc <think>...</think> en début de réponse pour exposer leur
// raisonnement. On l'extrait pour l'afficher dans un dropdown repliable
// (et ne pas le voir polluer la réponse Markdown principale).
// ──────────────────────────────────────────────

export interface ParsedResponse {
  /** Texto "propre", sans le(s) bloc(s) <think>. Affiché normalement. */
  visible: string;
  /** Texto du/des bloc(s) <think>, concaténé. Affiché dans un dropdown. */
  think: string;
}

const THINK_REGEX = /<think>([\s\S]*?)<\/think>/gi;

export function splitThinkBlocks(input: string): ParsedResponse {
  if (!input) return { visible: input, think: "" };

  let thinkContent = "";
  const visible = input.replace(THINK_REGEX, (_match, content: string) => {
    thinkContent += (thinkContent ? "\n\n" : "") + content.trim();
    return "";
  });

  return {
    visible: visible.trim(),
    think: thinkContent,
  };
}