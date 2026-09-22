// ──────────────────────────────────────────────
// RAG en mémoire — Panthère
// Pas de base vectorielle externe : on charge les documents
// africains au démarrage du serveur, on découpe en chunks,
// on indexe les mots-clés, et la recherche se fait par
// scoring lexical (overlap de mots significatifs).
//
// Suffisant pour un MVP hackathon avec quelques documents.
// Évolutif : il suffira de remplacer searchRelevantContext()
// par une recherche vectorielle plus tard.
// ──────────────────────────────────────────────

import fs from "node:fs";
import path from "node:path";
import type {
  Document,
  DocumentChunk,
  SearchResult,
  RAGContext,
} from "./types";

// ─── Stop words français minimaux ───
const STOP_WORDS = new Set([
  "le", "la", "les", "un", "une", "des", "de", "du", "d", "au", "aux",
  "et", "ou", "mais", "donc", "or", "ni", "car", "que", "qui", "quoi",
  "ce", "cet", "cette", "ces", "mon", "ma", "mes", "ton", "ta", "tes",
  "son", "sa", "ses", "notre", "votre", "leur", "leurs",
  "je", "tu", "il", "elle", "on", "nous", "vous", "ils", "elles",
  "me", "te", "se", "lui", "leur", "moi", "toi", "soi",
  "est", "sont", "soit", "ete", "etre", "avoir", "ai", "as", "a",
  "avons", "avez", "ont", "fais", "fait", "faire",
  "dans", "sur", "sous", "avec", "sans", "pour", "par", "vers", "chez",
  "pas", "plus", "moins", "tres", "trop", "peu", "beaucoup",
  "ne", "n", "y", "si", "non", "oui", "aussi", "encore", "alors",
  "comme", "quand", "ou", "donc",
  "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m",
  "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z",
]);

const CHUNK_SIZE = 80; // en mots
const CHUNK_OVERLAP = 15; // chevauchement
const TOP_K = 3; // passages renvoyés au prompt
const SCORE_THRESHOLD = 1; // overlap minimum

// ─── Normalisation ───
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // retire accents
    .replace(/[^\w\s-]/g, " "); // retire ponctuation
}

function tokenize(text: string): string[] {
  return normalize(text)
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

// ─── Parsing du frontmatter YAML léger ───
// Format attendu :
//   ---
//   titre: ...
//   matiere: ...
//   pays: ...
//   niveau: ...
//   source: ...
//   ---
function parseFrontmatter(raw: string): {
  meta: Partial<Document>;
  body: string;
} {
  const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  if (!match) {
    return { meta: {}, body: raw };
  }
  const [, header, body] = match;
  const meta: Record<string, string> = {};
  for (const line of header.split("\n")) {
    const m = line.match(/^([a-zA-Z_]+)\s*:\s*(.*)$/);
    if (m) meta[m[1]] = m[2].trim();
  }
  return { meta, body };
}

// ─── Découpage en chunks ───
function chunkBody(body: string): string[] {
  const words = body.split(/\s+/).filter(Boolean);
  const chunks: string[] = [];
  let i = 0;
  while (i < words.length) {
    const end = Math.min(i + CHUNK_SIZE, words.length);
    chunks.push(words.slice(i, end).join(" "));
    if (end === words.length) break;
    i += CHUNK_SIZE - CHUNK_OVERLAP;
  }
  return chunks;
}

// ─── Indexation (singleton, initialisée paresseusement) ───
let index: {
  documents: Document[];
  chunks: DocumentChunk[];
} | null = null;

function buildIndex(): { documents: Document[]; chunks: DocumentChunk[] } {
  const testDataDir = path.join(process.cwd(), "test-data");
  const documents: Document[] = [];
  const chunks: DocumentChunk[] = [];

  if (!fs.existsSync(testDataDir)) {
    return { documents, chunks };
  }

  const files = fs
    .readdirSync(testDataDir)
    .filter((f) => f.endsWith(".txt") || f.endsWith(".md"));

  for (const file of files) {
    const raw = fs.readFileSync(path.join(testDataDir, file), "utf-8");
    const { meta, body } = parseFrontmatter(raw);
    const docId = path.basename(file, path.extname(file));

    const doc: Document = {
      id: docId,
      titre: meta.titre ?? docId,
      matiere: meta.matiere ?? "mathematiques",
      pays: meta.pays ?? "Cote d'Ivoire",
      niveau: meta.niveau ?? "lycee",
      source: meta.source ?? "Programme scolaire",
      contenu_brut: body,
    };
    documents.push(doc);

    const bodyChunks = chunkBody(body);
    bodyChunks.forEach((contenu, position) => {
      chunks.push({
        id: `${docId}-${position}`,
        document_id: docId,
        contenu,
        position,
        keywords: tokenize(contenu),
      });
    });
  }

  return { documents, chunks };
}

function getIndex() {
  if (!index) index = buildIndex();
  return index;
}

// ─── Recherche par overlap lexical ───
export function searchRelevantContext(
  query: string,
  filters?: { matiere?: string; pays?: string; niveau?: string }
): RAGContext {
  const { documents, chunks } = getIndex();

  const queryKeywords = tokenize(query);
  if (queryKeywords.length === 0) {
    return { passages: [], sources: [] };
  }

  // Filtre documentaire (sur métadonnées)
  const filteredDocIds = new Set(
    documents
      .filter((d) => {
        if (filters?.matiere && d.matiere !== filters.matiere) return false;
        if (filters?.pays && d.pays !== filters.pays) return false;
        if (filters?.niveau && !d.niveau.includes(filters.niveau)) return false;
        return true;
      })
      .map((d) => d.id)
  );

  // Si filtre appliqué et qu'aucun doc ne correspond → on élargit à tout
  const effectiveDocIds =
    filteredDocIds.size > 0 || !filters
      ? filteredDocIds
      : new Set(documents.map((d) => d.id));

  // Scoring : nombre de mots-clés de la requête présents dans le chunk
  const scored: SearchResult[] = [];
  for (const chunk of chunks) {
    if (!effectiveDocIds.has(chunk.document_id)) continue;
    let score = 0;
    for (const kw of queryKeywords) {
      if (chunk.keywords.includes(kw)) score += 1;
    }
    if (score >= SCORE_THRESHOLD) {
      const doc = documents.find((d) => d.id === chunk.document_id)!;
      scored.push({ chunk, score, document: doc });
    }
  }

  scored.sort((a, b) => b.score - a.score);

  const top = scored.slice(0, TOP_K);
  return {
    passages: top.map((r) => r.chunk.contenu),
    sources: top.map((r) => ({
      titre: r.document.titre,
      source: r.document.source,
    })),
  };
}

// ─── Formatage pour injection dans le prompt ───
export function formatRAGContext(context: RAGContext): string {
  if (context.passages.length === 0) return "";
  const passages = context.passages
    .map((p, i) => {
      const meta = context.sources[i];
      const label = meta?.titre
        ? ` (source : ${meta.titre}${meta.source ? ` — ${meta.source}` : ""})`
        : "";
      return `[Passage ${i + 1}${label}]\n${p}`;
    })
    .join("\n\n");
  return `<contexte_rag>\n${passages}\n</contexte_rag>`;
}

// Export pour les tests / debug
export const __test__ = { tokenize, normalize, chunkBody };