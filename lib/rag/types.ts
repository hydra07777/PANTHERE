// ──────────────────────────────────────────────
// Types partagés — Panthère
// ──────────────────────────────────────────────

/** Un document pédagogique africain chargé dans la base locale. */
export interface Document {
  id: string;
  titre: string;
  matiere: string;
  pays: string;
  niveau: string;
  source: string;
  contenu_brut: string;
}

/** Un passage découpé d'un document, indexé pour la recherche. */
export interface DocumentChunk {
  id: string;
  document_id: string;
  contenu: string;
  position: number;
  /** Mots-clés significatifs pré-extraits (sans stop words, sans accents). */
  keywords: string[];
}

/** Résultat d'une recherche RAG (mémoire). */
export interface SearchResult {
  chunk: DocumentChunk;
  score: number;
  document: Document;
}

/** Contexte RAG formaté pour l'injection dans le prompt. */
export interface RAGContext {
  passages: string[];
  sources: { titre: string; source: string }[];
}

/** Message d'historique de conversation. */
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/** Body envoyé à /api/chat. */
export interface ChatRequest {
  message: string;
  history: ChatMessage[];
  profile?: {
    prenom: string;
    pays: string;
    ville: string;
    niveau: string;
    langue: string;
    matierePreferee: string;
  };
}