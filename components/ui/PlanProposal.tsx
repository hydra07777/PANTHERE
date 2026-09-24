"use client";

// Carte affichée sous un message assistant quand l'IA propose un plan.
// Permet à l'étudiant d'accepter (déclenche /api/learning-plan) ou refuser.

import { useState } from "react";
import { Sparkles, Loader2, X } from "lucide-react";
import { Button } from "./Button";
import type { LearningPlanDraft } from "@/lib/learning-plan/types";

interface PlanProposalProps {
  concept: string;
  profil?: {
    prenom: string;
    pays?: string;
    niveau?: string;
    matierePreferee: string;
  };
  recentContext?: string;
  onAccept: (plan: import("@/lib/learning-plan/types").LearningPlan) => void;
  onDismiss: () => void;
}

export function PlanProposal({
  concept,
  profil,
  recentContext,
  onAccept,
  onDismiss,
}: PlanProposalProps) {
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");

  const handleAccept = async () => {
    setState("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/learning-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          concept,
          matiere: profil?.matierePreferee ?? "mathematiques",
          niveau: profil?.niveau,
          pays: profil?.pays,
          contexte: recentContext,
        }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error || "Erreur lors de la génération.");
      }
      const draft = (await res.json()) as LearningPlanDraft;
      // On remonte le draft : la page de chat s'occupera de l'enregistrer.
      // (La signature onAccept accepte déjà un LearningPlan complet —
      // on triche un peu en passant un pseudo-plan avec le draft attaché.)
      onAccept({
        id: "",
        concept: draft.concept,
        matiere: draft.matiere,
        objectif: draft.objectif,
        points: [], // sera remplacé par createLearningPlan()
        statut: "actif",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // @ts-expect-error — on attache le draft pour le parent
        draft,
      });
    } catch (e) {
      setState("error");
      setErrorMsg((e as Error).message);
    }
  };

  return (
    <div className="mt-3 rounded-lg border border-forest/20 bg-forest-soft px-4 py-3 animate-fade-up">
      <div className="flex items-start gap-3">
        <div className="shrink-0 mt-0.5 inline-flex items-center justify-center w-7 h-7 rounded-full bg-forest text-white">
          <Sparkles size={13} strokeWidth={2.25} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-medium text-ink">
            Panthère te propose un plan d'apprentissage
          </div>
          <div className="text-[12.5px] text-muted mt-0.5 leading-snug">
            Pour maîtriser{" "}
            <span className="font-medium text-ink">{concept}</span>, on
            pourrait structurer ton parcours en quelques étapes guidées.
          </div>

          {state === "error" && (
            <p className="text-[12px] text-terracotta mt-2">{errorMsg}</p>
          )}

          <div className="flex items-center gap-2 mt-3">
            <Button
              size="sm"
              onClick={handleAccept}
              disabled={state === "loading"}
            >
              {state === "loading" ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  Préparation…
                </>
              ) : (
                "Créer le plan"
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onDismiss}
              disabled={state === "loading"}
            >
              Pas maintenant
            </Button>
          </div>
        </div>
        <button
          onClick={onDismiss}
          aria-label="Fermer"
          className="shrink-0 -mt-1 -mr-1 p-1 text-muted-soft hover:text-ink rounded transition-colors"
        >
          <X size={14} strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}