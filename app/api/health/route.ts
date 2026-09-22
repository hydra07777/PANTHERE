// ──────────────────────────────────────────────
// API Route — /api/health
// Sert au jury / aux devs pour vérifier que la
// clé MiniMax est chargée, sans déclencher d'appel coûteux.
// ──────────────────────────────────────────────

import { NextResponse } from "next/server";
import { hasApiKey } from "@/lib/minimax";
import { __test__ as ragTest } from "@/lib/rag/search";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const sample = "résoudre une équation du second degré";
  const tokens = ragTest.tokenize(sample);
  return NextResponse.json({
    status: "ok",
    minimaxConfigured: hasApiKey(),
    ragTokenizerSample: tokens.slice(0, 10),
    timestamp: new Date().toISOString(),
  });
}