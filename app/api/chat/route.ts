// API Route — /api/chat
// Reçoit le message + historique, recherche le contexte RAG
// (en mémoire, sur les documents africains), appelle Claude
// en streaming, retourne la réponse en SSE.
// Supporte les marqueurs [PLAN_PROPOSAL:] et [PROGRESS:].
// Supporte aussi l'injection des plans d'apprentissage actifs
// dans le system prompt pour que l'IA puisse marquer la progression.

import { NextRequest, NextResponse } from "next/server";
import { getMiniMax, MODEL_NAME, hasApiKey } from "@/lib/minimax";
import { SOCRATIC_SYSTEM_PROMPT } from "@/lib/prompts/socratic";
import {
  searchRelevantContext,
  formatRAGContext,
} from "@/lib/rag/search";
import { checkRateLimit } from "@/lib/rate-limit";
import type { ChatMessage } from "@/lib/rag/types";
import { profilToContext, type ProfilEtudiant } from "@/lib/profil";

export const runtime = "nodejs"; // on a besoin du système de fichiers pour le RAG en mémoire
export const dynamic = "force-dynamic";

const MAX_HISTORY = 20;

export async function POST(request: NextRequest) {
  // ── Garde-fou clé API ──
  if (!hasApiKey()) {
    return NextResponse.json(
      {
        error:
          "MiniMax non configuré : renseigne MINIMAX_API_KEY dans .env.local.",
      },
      { status: 503 }
    );
  }

  // ── Rate limiting ──
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const limit = checkRateLimit(ip);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Trop de requêtes. Réessaie dans une minute." },
      { status: 429 }
    );
  }

  // ── Parsing ──
  let body: ChatRequest;
  try {
    body = (await request.json()) as ChatRequest;
  } catch {
    return NextResponse.json({ error: "Body JSON invalide" }, { status: 400 });
  }
  const { message, history, profile, activePlans } = body;
  if (!message || typeof message !== "string") {
    return NextResponse.json({ error: "Message requis" }, { status: 400 });
  }

  // ── RAG en mémoire ──
  const ragFilters = {
    matiere: profile?.matierePreferee ?? "mathematiques",
    pays: profile?.pays ?? undefined,
    niveau: profile?.niveau ?? undefined,
  };
  const ragContext = searchRelevantContext(message, ragFilters);
  const ragFormatted = formatRAGContext(ragContext);

  // ── Profil étudiant ──
  const profilBlock = profile
    ? `\n<profil_etudiant>\n${profilToContext(profile as ProfilEtudiant)}\n</profil_etudiant>`
    : "";

  // ── Plans d'apprentissage actifs ──
  const plansBlock =
    activePlans && activePlans.length > 0
      ? `\n<plans_apprentissage_actifs>\n${JSON.stringify(
          activePlans.map((p) => ({
            id: p.id,
            concept: p.concept,
            points: p.points.map((pt) => ({
              id: pt.id,
              titre: pt.titre,
              sousPoints: pt.sousPoints.map((sp) => ({
                id: sp.id,
                titre: sp.titre,
                statut: sp.statut,
              })),
            })),
          })),
          null,
          2
        )}\n</plans_apprentissage_actifs>`
      : "";

  // ── Prompt final ──
  const systemPrompt = `${SOCRATIC_SYSTEM_PROMPT}${profilBlock}${plansBlock ? `\n\n${plansBlock}` : ""}${ragFormatted ? `\n\n${ragFormatted}` : ""}`;

  // ── Historique (tronqué, formaté pour OpenAI-compat) ──
  const messages: Array<{ role: "user" | "assistant"; content: string }> = [
    ...history.slice(-MAX_HISTORY).map((m: ChatMessage) => ({
      role: m.role,
      content: m.content,
    })),
    { role: "user" as const, content: message },
  ];

  // ── Appel MiniMax en streaming ──
  let stream: Awaited<
    ReturnType<ReturnType<typeof getMiniMax>["chat"]["completions"]["create"]>
  >;
  try {
    stream = await getMiniMax().chat.completions.create({
      model: MODEL_NAME,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      stream: true,
      max_completion_tokens: 1024,
      temperature: 0.5,
    });
  } catch (error) {
    console.error("Erreur appel MiniMax:", error);
    return NextResponse.json(
      {
        error:
          "Impossible de joindre MiniMax. Vérifie ta clé et ta connexion internet.",
      },
      { status: 502 }
    );
  }

  // ── Stream SSE vers le navigateur ──
  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const delta = chunk.choices?.[0]?.delta?.content;
          if (delta) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: "text", content: delta })}\n\n`
              )
            );
          }
        }
        controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
        controller.close();
      } catch (error) {
        console.error("Erreur de streaming:", error);
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "error", content: "Erreur pendant la génération." })}\n\n`
          )
        );
        controller.close();
      }
    },
  });

  return new NextResponse(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

// Petit type local pour typer le body
type ChatRequest = {
  message: string;
  history: ChatMessage[];
  profile?: Partial<ProfilEtudiant>;
  activePlans?: Array<{
    id: string;
    concept: string;
    points: Array<{
      id: string;
      titre: string;
      sousPoints: Array<{ id: string; titre: string; statut: string }>;
    }>;
  }>;
};