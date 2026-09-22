// ──────────────────────────────────────────────
// Types partagés pour le RAG
// ──────────────────────────────────────────────

export interface Document {
  id: string;
  titre: string;
  matiere: string;
  pays: string;
  niveau: string;
  source: string;
  contenu_brut: string;
  created_at: string;
}

export interface DocumentChunk {
  id: string;
  document_id: string;
  contenu: string;
  embedding: number[] | null;
  position: number;
}

export interface SearchResult {
  chunk: DocumentChunk;
  score: number; // similarité cosinus
}

export interface RAGContext {
  passages: string[];
  sources: { titre: string; source: string }[];
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatRequest {
  message: string;
  history: ChatMessage[];
}

export interface ChatResponse {
  id: string;
  content: string;
  role: "assistant";
}