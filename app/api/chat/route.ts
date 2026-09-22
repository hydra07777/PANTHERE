// ──────────────────────────────────────────────
// API Route — /api/chat
// Reçoit le message + historique, recherche le contexte RAG,
// appelle Claude en streaming, retourne la réponse.
// ──────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { SOCRATIC_SYSTEM_PROMPT } from "@/lib/prompts/socratic";
import { searchRelevantContext, formatRAGContext } from "@/lib/rag/search";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import type { ChatMessage } from "@/lib/rag/types";

// Initialiser le client Anthropic
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Modèle Claude
const MODEL = "claude-sonnet-4-20250514";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // --- Rate limiting ---
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const { allowed, remaining } = checkRateLimit(ip);
    const headers = rateLimitHeaders(ip);

    if (!allowed) {
      return NextResponse.json(
        { error: "Trop de requêtes. Réessaie dans une minute." },
        {
          status: 429,
          headers: { ...headers, "Content-Type": "application/json" },
        }
      );
    }

    // --- Parse du body ---
    const body = await request.json();
    const { message, history } = body as {
      message: string;
      history: ChatMessage[];
    };

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message requis" },
        { status: 400 }
      );
    }

    // --- Recherche RAG ---
    const ragContext = await searchRelevantContext(message, {
      matiere: "mathématiques",
      pays: "Côte d'Ivoire",
      niveau: "lycée",
    });
    const ragFormatted = formatRAGContext(ragContext);

    // --- Construction du prompt ---
    const systemPrompt = ragFormatted
      ? `${SOCRATIC_SYSTEM_PROMPT}\n\n${ragFormatted}`
      : SOCRATIC_SYSTEM_PROMPT;

    // --- Formatage de l'historique pour Claude ---
    const formattedHistory = history.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    }));

    // --- Appel à Claude en streaming ---
    const stream = await anthropic.messages.stream({
      model: MODEL,
      system: systemPrompt,
      max_tokens: 1024,
      messages: [
        ...formattedHistory,
        { role: "user" as const, content: message },
      ],
    });

    // --- Retourner le stream ---
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              const data = JSON.stringify({
                type: "text",
                content: event.delta.text,
              });
              controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`));
            }
          }
          controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          console.error("Erreur de streaming Claude:", error);
          const errorData = JSON.stringify({
            type: "error",
            content: "Erreur lors de la génération de la réponse.",
          });
          controller.enqueue(
            new TextEncoder().encode(`data: ${errorData}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new NextResponse(readableStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        ...headers,
      },
    });
  } catch (error) {
    console.error("Erreur API chat:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}