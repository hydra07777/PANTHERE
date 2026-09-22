// ──────────────────────────────────────────────
// Service d'embeddings — OpenAI text-embedding-3-small
// ──────────────────────────────────────────────

import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_DIMENSIONS = 512; // Bon équilibre coût/qualité pour le RAG

/**
 * Génère un embedding pour un texte donné.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await client.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
    dimensions: EMBEDDING_DIMENSIONS,
  });

  return response.data[0].embedding;
}

/**
 * Génère des embeddings pour plusieurs textes (batch).
 */
export async function generateEmbeddings(
  texts: string[]
): Promise<number[][]> {
  // OpenAI accepte jusqu'à 2048 inputs par appel
  const results: number[][] = [];

  for (let i = 0; i < texts.length; i += 100) {
    const batch = texts.slice(i, i + 100);
    const response = await client.embeddings.create({
      model: EMBEDDING_MODEL,
      input: batch,
      dimensions: EMBEDDING_DIMENSIONS,
    });
    results.push(...response.data.map((d) => d.embedding));
  }

  return results;
}