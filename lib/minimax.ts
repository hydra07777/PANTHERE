// ──────────────────────────────────────────────
// Client MiniMax (compatible OpenAI)
// API : https://api.minimax.io/v1
// Modèle : MiniMax-M3
// ──────────────────────────────────────────────

import OpenAI from "openai";

const BASE_URL = "https://api.minimax.io/v1";
const MODEL = "MiniMax-M3";

let cachedClient: OpenAI | null = null;

/**
 * Client MiniMax paresseux : créé uniquement au premier appel.
 * Permet à `next build` de se terminer sans clé configurée.
 */
export function getMiniMax(): OpenAI {
  if (cachedClient) return cachedClient;
  const apiKey = process.env.MINIMAX_API_KEY;
  if (!apiKey) {
    throw new Error(
      "MINIMAX_API_KEY manquante. Configure-la dans .env.local avant de lancer l'app."
    );
  }
  cachedClient = new OpenAI({ apiKey, baseURL: BASE_URL });
  return cachedClient;
}

export const MODEL_NAME = MODEL;

/**
 * Vérifie qu'une clé API est bien présente.
 * Utilisé par /api/health pour donner un signal clair au jury.
 */
export function hasApiKey(): boolean {
  return Boolean(process.env.MINIMAX_API_KEY);
}