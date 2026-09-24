"use client";

// Dropdown repliable qui affiche le bloc de raisonnement de l'IA
// (extrait des balises <think>...</think>). Plié par défaut.
// Style Dribbble : surface claire, bordure, chevron animé.

import { useState } from "react";
import { ChevronDown, Brain } from "lucide-react";
import { cn } from "@/lib/cn";
import { Markdown } from "./Markdown";

interface ThinkDropdownProps {
  content: string;
}

export function ThinkDropdown({ content }: ThinkDropdownProps) {
  const [open, setOpen] = useState(false);

  if (!content || !content.trim()) return null;

  return (
    <div className="mt-3 rounded-lg border border-border-warm bg-surface-sunk overflow-hidden animate-fade-up">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          "w-full flex items-center gap-2 px-3.5 py-2.5",
          "text-left transition-colors duration-200 ease-out-soft",
          "hover:bg-bg/60",
          open && "border-b border-border-warm"
        )}
      >
        <Brain
          size={13}
          strokeWidth={1.75}
          className="text-muted-soft shrink-0"
        />
        <span className="text-[12.5px] font-medium text-muted flex-1">
          Raisonnement de Panthère
        </span>
        <span className="text-[11px] text-muted-soft tabular-nums">
          {open ? "Masquer" : "Afficher"}
        </span>
        <ChevronDown
          size={14}
          strokeWidth={1.75}
          className={cn(
            "text-muted-soft shrink-0 transition-transform duration-200 ease-out-soft",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="px-3.5 py-3 text-muted">
          <div className="text-[12.5px] leading-relaxed italic">
            <Markdown source={content} />
          </div>
        </div>
      )}
    </div>
  );
}