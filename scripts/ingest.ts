// -----------------------------------------------------------------------------
// Script d'ingestion de documents dans Supabase pgvector
// Usage : npm run ingest
// -----------------------------------------------------------------------------

import { createClient } from "@supabase/supabase-js";
import { generateEmbeddings } from "../lib/rag/embeddings";
import * as fs from "fs";
import * as path from "path";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "Erreur : Variables Supabase manquantes. Copie .env.example en .env.local"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const CHUNK_SIZE = 400;
const CHUNK_OVERLAP = 50;

function chunkText(text: string, size: number, overlap: number): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  let start = 0;
  while (start < words.length) {
    const end = Math.min(start + size, words.length);
    chunks.push(words.slice(start, end).join(" "));
    start += size - overlap;
  }
  return chunks;
}

function findTestDocuments() {
  const testDataDir = path.join(process.cwd(), "test-data");
  if (!fs.existsSync(testDataDir)) return [];
  return fs.readdirSync(testDataDir)
    .filter((f) => f.endsWith(".txt") || f.endsWith(".md"))
    .map((f) => ({
      path: path.join(testDataDir, f),
      metadata: {
        titre: f.replace(/\.(txt|md)$/, ""),
        matiere: "mathematiques",
        pays: "Cote d'Ivoire",
        niveau: "lycee",
        source: "test",
      },
    }));
}

async function main() {
  console.log("Ingestion de documents");
  const documents = findTestDocuments();
  if (documents.length === 0) {
    console.log("Aucun document trouve dans test-data/");
    return;
  }
  console.log(`${documents.length} document(s) trouve(s)`);

  for (const doc of documents) {
    console.log(`Traitement: ${doc.metadata.titre}`);
    const content = fs.readFileSync(doc.path, "utf-8");

    const { data: document, error: docError } = await supabase
      .from("documents")
      .insert({
        titre: doc.metadata.titre,
        matiere: doc.metadata.matiere,
        pays: doc.metadata.pays,
        niveau: doc.metadata.niveau,
        source: doc.metadata.source,
        contenu_brut: content,
      })
      .select()
      .single();

    if (docError || !document) {
      console.error("Erreur insertion document:", docError);
      continue;
    }
    console.log(`Document insere (id: ${document.id})`);

    const chunks = chunkText(content, CHUNK_SIZE, CHUNK_OVERLAP);
    console.log(`${chunks.length} chunks generes`);

    console.log("Generation des embeddings...");
    const embeddings = await generateEmbeddings(chunks);

    const records = chunks.map((text, i) => ({
      document_id: document.id,
      contenu: text,
      embedding: embeddings[i],
      position: i,
    }));

    const { error: chunkError } = await supabase
      .from("document_chunks")
      .insert(records);

    if (chunkError) {
      console.error("Erreur insertion chunks:", chunkError);
    } else {
      console.log(`${records.length} chunks inseres`);
    }
  }
  console.log("Termine!");
}

main().catch(console.error);