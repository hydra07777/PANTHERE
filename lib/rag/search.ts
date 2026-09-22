// ──────────────────────────────────────────────
// RAG — Recherche vectorielle
// À utiliser avec Supabase pgvector
// ──────────────────────────────────────────────

import { createClient } from "@supabase/supabase-js";
import type { SearchResult, RAGContext } from "./types";
import { generateEmbedding } from "./embeddings";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

const TOP_K = 5; // Nombre de chunks pertinents à retourner
const SIMILARITY_THRESHOLD = 0.5; // Seuil de similarité minimum

/**
 * Recherche les passages les plus pertinents pour une requête donnée.
 */
export async function searchRelevantContext(
  query: string,
  filters?: {
    matiere?: string;
    pays?: string;
    niveau?: string;
  }
): Promise<RAGContext> {
  // 1. Générer l'embedding de la question
  const queryEmbedding = await generateEmbedding(query);

  // 2. Construire la requête de recherche vectorielle
  let dbQuery = supabase.rpc("match_document_chunks", {
    query_embedding: queryEmbedding,
    match_threshold: SIMILARITY_THRESHOLD,
    match_count: TOP_K,
  });

  // 3. Filtrer par métadonnées si fournies
  if (filters?.matiere) {
    dbQuery = dbQuery.eq("matiere", filters.matiere);
  }
  if (filters?.pays) {
    dbQuery = dbQuery.eq("pays", filters.pays);
  }
  if (filters?.niveau) {
    dbQuery = dbQuery.eq("niveau", filters.niveau);
  }

  const { data, error } = await dbQuery;

  if (error) {
    console.error("Erreur de recherche RAG :", error);
    return { passages: [], sources: [] };
  }

  // 4. Formater les résultats
  const results = data as SearchResult[];
  const passages = results.map((r) => r.chunk.contenu);
  const sources = results.map((r) => ({
    titre: r.chunk.document_id, // À enrichir avec le titre réel via une jointure
    source: "", // À enrichir
  }));

  return { passages, sources };
}

/**
 * Formate le contexte RAG pour l'injection dans le prompt.
 */
export function formatRAGContext(context: RAGContext): string {
  if (context.passages.length === 0) {
    return "";
  }

  const passages = context.passages
    .map((p, i) => `[Passage ${i + 1}] ${p}`)
    .join("\n\n");

  return `<contexte_rag>\n${passages}\n</contexte_rag>`;
}