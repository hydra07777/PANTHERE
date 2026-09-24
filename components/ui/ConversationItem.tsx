// Ligne de conversation dans la sidebar.
// État actif = bordure forest à gauche + fond forest-soft + texte ink.
// État normal = texte muted, hover subtle. Croix suppression au hover.

"use client";

import { Trash2, MessageSquare } from "lucide-react";
import { cn } from "@/lib/cn";
import { IconButton } from "./IconButton";

interface ConversationItemProps {
  titre: string;
  active?: boolean;
  onClick: () => void;
  onDelete: () => void;
}

export function ConversationItem({
  titre,
  active = false,
  onClick,
  onDelete,
}: ConversationItemProps) {
  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        "group relative flex items-center gap-2",
        "px-3 py-2 rounded-md cursor-pointer",
        "text-[13px] leading-snug",
        "transition-colors duration-200 ease-out-soft",
        active
          ? "bg-forest-soft text-ink font-medium"
          : "text-muted hover:bg-surface-sunk hover:text-ink"
      )}
    >
      {/* Indicateur actif : barre verticale forest à gauche */}
      {active && (
        <span
          className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-forest"
          aria-hidden="true"
        />
      )}
      <MessageSquare
        size={14}
        strokeWidth={1.75}
        className={cn(
          "shrink-0",
          active ? "text-forest" : "text-muted-soft"
        )}
      />
      <span className="flex-1 truncate">{titre}</span>
      <IconButton
        size="sm"
        tone="danger"
        className={cn(
          "opacity-0 group-hover:opacity-100 transition-opacity",
          "-mr-1"
        )}
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        aria-label="Supprimer la conversation"
      >
        <Trash2 size={13} strokeWidth={2} />
      </IconButton>
    </div>
  );
}