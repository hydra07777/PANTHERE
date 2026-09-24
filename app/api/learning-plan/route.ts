// API Route — /api/learning-plan
// Génère un plan d'apprentissage structuré (JSON) pour un concept.
// POST { concept, matiere, niveau?, pays?, contexte? }
// Retourne : LearningPlanDraft (avec sources RAG)

import { NextRequest, NextResponse } from "next/server";
import { getMiniMax, MODEL_NAME, hasApiKey } from "@/lib/minimax";
import { checkRateLimit } from "@/lib/rate-limit";
import { generateLearningPlan, type PlanRequest } from "@/lib/learning-plan/generate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!hasApiKey()) {
    return NextResponse.json(
      { error: "MiniMax non configuré : renseigne MINIMAX_API_KEY dans .env.local." },
      { status: 503 }
    );
  }

  // Rate limit
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

  let body: PlanRequest;
  try {
    body = (await request.json()) as PlanRequest;
  } catch {
    return NextResponse.json({ error: "Body JSON invalide" }, { status: 400 });
  }
  if (!body.concept || typeof body.concept !== "string") {
    return NextResponse.json({ error: "concept requis" }, { status: 400 });
  }
  if (!body.matiere || typeof body.matiere !== "string") {
    return NextResponse.json({ error: "matiere requise" }, { status: 400 });
  }

  try {
    const draft = await generateLearningPlan(body, async ({ system, user, maxTokens }) => {
      const completion = await getMiniMax().chat.completions.create({
        model: MODEL_NAME,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        stream: false,
        max_completion_tokens: maxTokens ?? 1800,
        temperature: 0.4,
      });
      return completion.choices?.[0]?.message?.content ?? "";
    });

    return NextResponse.json(draft);
  } catch (error) {
    console.error("Erreur génération plan:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Échec de la génération du plan." },
      { status: 500 }
    );
  }
}