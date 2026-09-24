"use client";

// Bulle de message dans le chat.
// User : fond forest, texte blanc, aligné à droite.
// Assistant : surface blanche, bordure, texte ink formaté en Markdown,
// aligné à gauche. Marque Panthère au-dessus de la bulle assistant.
// Optionnellement, un bloc "think" (raisonnement de l'IA) est rendu
// dans un dropdown repliable en bas de la bulle.

import { Logo } from "./Logo";
import { Markdown } from "./Markdown";
import { ThinkDropdown } from "./ThinkDropdown";
import { cn } from "@/lib/cn";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  think?: string;
  streaming?: boolean;
}

export function MessageBubble({
  role,
  content,
  think,
  streaming = false,
}: MessageBubbleProps) {
  if (role === "user") {
    // L'utilisateur tape en texte brut — pas de Markdown pour éviter
    // que `**` affiché dans une question ne se mette à styliser.
    return (
      <div className="flex justify-end animate-fade-up">
        <div
          className={cn(
            "max-w-[80%] px-4 py-2.5 rounded-lg rounded-tr-sm",
            "bg-forest text-white",
            "text-[14.5px] leading-relaxed",
            "shadow-xs whitespace-pre-wrap"
          )}
        >
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start gap-2.5 animate-fade-up">
      <div className="shrink-0 mt-1">
        <Logo variant="compact" />
      </div>
      <div className="max-w-[80%]">
        <div
          className={cn(
            "px-4 py-2.5 rounded-lg rounded-tl-sm",
            "bg-surface text-ink border border-border",
            "shadow-xs"
          )}
        >
          <Markdown source={content} />
          {streaming && (
            <span className="inline-block w-[2px] h-[1em] bg-ink ml-0.5 align-middle animate-blink" />
          )}
          {think && think.trim().length > 0 && !streaming && (
            <ThinkDropdown content={think} />
          )}
        </div>
      </div>
    </div>
  );
}