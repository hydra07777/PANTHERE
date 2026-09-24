"use client";

// Indicateur "thinking" affiché pendant le streaming.
// Apparaît dès que l'utilisateur envoie un message (avant que
// le texte arrive), disparaît dès que le 1er token arrive.

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { Logo } from "./Logo";
import { cn } from "@/lib/cn";

interface ThinkingIndicatorProps {
  /** Quand le streaming a commencé (sinon null). */
  streamingStartedAt: number | null;
  /** Premier token arrivé (le contenu commence à streamer). */
  firstTokenAt: number | null;
}

// Étapes affichées en rotation pendant le thinking (cosmétique).
const STEPS = [
  "Analyse de ta question…",
  "Recherche du contexte…",
  "Construction de la réponse…",
];

export function ThinkingIndicator({
  streamingStartedAt,
  firstTokenAt,
}: ThinkingIndicatorProps) {
  const [stepIdx, setStepIdx] = useState(0);

  useEffect(() => {
    if (firstTokenAt !== null) return; // on a commencé à streamer → plus de rotation
    const t = setInterval(() => {
      setStepIdx((s) => (s + 1) % STEPS.length);
    }, 1400);
    return () => clearInterval(t);
  }, [firstTokenAt]);

  // Caché si le streaming n'a pas commencé, OU si le 1er token est déjà arrivé.
  if (streamingStartedAt === null || firstTokenAt !== null) return null;

  return (
    <div className="flex justify-start gap-2.5 animate-fade-up">
      <div className="shrink-0 mt-1">
        <Logo variant="compact" />
      </div>
      <div className="max-w-[80%]">
        <div
          className={cn(
            "px-4 py-2.5 rounded-lg rounded-tl-sm",
            "bg-surface border border-border-warm",
            "shadow-xs"
          )}
        >
          <div className="flex items-center gap-2 text-[13px] text-muted">
            <Sparkles
              size={13}
              strokeWidth={1.75}
              className="text-forest animate-pulse-soft"
            />
            <span className="italic">{STEPS[stepIdx]}</span>
          </div>
          {/* Trois petits points animés */}
          <div className="flex items-center gap-1 mt-1.5">
            <span className="block w-1.5 h-1.5 rounded-full bg-muted-soft animate-pulse-soft" />
            <span
              className="block w-1.5 h-1.5 rounded-full bg-muted-soft animate-pulse-soft"
              style={{ animationDelay: "150ms" }}
            />
            <span
              className="block w-1.5 h-1.5 rounded-full bg-muted-soft animate-pulse-soft"
              style={{ animationDelay: "300ms" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}