"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Circle,
  Compass,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Badge, Button, Logo, Skeleton } from "@/components/ui";
import {
  useProfil,
  getLearningPlan,
  deleteLearningPlan,
  saveLearningPlan,
} from "@/lib/store";
import type { LearningPlan } from "@/lib/learning-plan/types";
import {
  aggregatePlanStatut,
  pointProgressPct,
} from "@/lib/learning-plan/types";

const STATUT_LABEL: Record<string, { label: string; tone: "forest" | "gold" | "neutral" }> = {
  a_venir: { label: "À venir", tone: "neutral" },
  en_cours: { label: "En cours", tone: "gold" },
  termine: { label: "Acquis", tone: "forest" },
};

export default function PlanDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { profil, ready } = useProfil();
  const [plan, setPlan] = useState<LearningPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready) return;
    if (!profil) {
      router.push("/onboarding");
      return;
    }
    if (!params?.id) return;
    getLearningPlan(params.id).then((p) => {
      setPlan(p ?? null);
      setLoading(false);
    });
  }, [ready, profil, params?.id, router]);

  const handleDelete = async () => {
    if (!plan) return;
    if (!confirm("Supprimer ce plan d'apprentissage ?")) return;
    await deleteLearningPlan(plan.id);
    router.push("/progress");
  };

  const handleToggleSousPoint = async (
    planId: string,
    sousPointId: string
  ) => {
    if (!plan) return;
    const newPlan: LearningPlan = {
      ...plan,
      points: plan.points.map((p) => ({
        ...p,
        sousPoints: p.sousPoints.map((sp) =>
          sp.id === sousPointId
            ? {
                ...sp,
                statut: sp.statut === "termine" ? "a_venir" : "termine",
                termineAt:
                  sp.statut === "termine"
                    ? undefined
                    : new Date().toISOString(),
              }
            : sp
        ),
      })),
    };
    newPlan.statut = aggregatePlanStatut(newPlan);
    setPlan(newPlan);
    await saveLearningPlan(newPlan);
  };

  if (!profil) return null;

  if (loading) {
    return (
      <main className="min-h-screen">
        <header className="px-6 sm:px-10 py-5 border-b border-border-warm flex items-center justify-between">
          <Logo />
          <Link
            href="/progress"
            className="inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-ink transition-colors"
          >
            <ArrowLeft size={14} strokeWidth={2} />
            Retour
          </Link>
        </header>
        <div className="max-w-3xl mx-auto px-6 py-8 space-y-4">
          <Skeleton className="h-12 w-2/3" />
          <Skeleton className="h-24" />
          <Skeleton className="h-40" />
        </div>
      </main>
    );
  }

  if (!plan) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-[15px] text-ink mb-2">Plan introuvable</p>
          <Link
            href="/progress"
            className="text-[13px] text-forest hover:underline"
          >
            ← Retour à la progression
          </Link>
        </div>
      </main>
    );
  }

  const totalSousPoints = plan.points.flatMap((p) => p.sousPoints).length;
  const sousPointsTermines = plan.points
    .flatMap((p) => p.sousPoints)
    .filter((sp) => sp.statut === "termine").length;
  const pct = totalSousPoints
    ? Math.round((sousPointsTermines / totalSousPoints) * 100)
    : 0;

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="px-6 sm:px-10 py-5 border-b border-border-warm flex items-center justify-between">
        <Logo />
        <Link
          href="/progress"
          className="inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-ink transition-colors"
        >
          <ArrowLeft size={14} strokeWidth={2} />
          Retour
        </Link>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8 animate-fade-up">
        {/* Titre */}
        <header className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Compass size={18} strokeWidth={1.75} className="text-ink" />
            <h1 className="font-display text-2xl font-medium tracking-tight text-ink capitalize">
              {plan.concept}
            </h1>
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <Badge tone="muted">{plan.matiere}</Badge>
            <Badge tone={plan.statut === "complete" ? "forest" : "gold"}>
              {plan.statut === "complete" ? "Terminé" : "Actif"}
            </Badge>
          </div>
        </header>

        {/* Carte récap */}
        <section className="bg-surface border border-border rounded-xl shadow-xs p-5 mb-6">
          <div className="flex items-start gap-3">
            <div className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-full bg-forest-soft text-forest">
              <Sparkles size={16} strokeWidth={1.75} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-[14px] font-semibold text-ink mb-1">
                Objectif
              </h2>
              <p className="text-[14px] text-muted leading-relaxed">
                {plan.objectif}
              </p>
            </div>
          </div>

          {/* Barre de progression */}
          <div className="mt-5">
            <div className="flex items-center justify-between mb-2 text-[12px] text-muted">
              <span>Progression</span>
              <span className="tabular-nums">
                {sousPointsTermines}/{totalSousPoints} · {pct}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-bg rounded-full overflow-hidden">
              <div
                className="h-full bg-forest transition-[width] duration-500 ease-out-soft"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </section>

        {/* Points */}
        <section className="space-y-4">
          {plan.points.map((point, pointIdx) => {
            const pointStatut =
              point.sousPoints.every((sp) => sp.statut === "termine")
                ? "termine"
                : point.sousPoints.some(
                      (sp) =>
                        sp.statut === "en_cours" || sp.statut === "termine"
                    )
                  ? "en_cours"
                  : "a_venir";
            const pPct = pointProgressPct(point);
            return (
              <article
                key={point.id}
                className="bg-surface border border-border rounded-xl shadow-xs overflow-hidden"
              >
                <header className="px-5 py-4 border-b border-border-warm flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-mono text-muted-soft">
                        {String(pointIdx + 1).padStart(2, "0")}
                      </span>
                      <h3 className="text-[15px] font-semibold text-ink">
                        {point.titre}
                      </h3>
                    </div>
                    {point.description && (
                      <p className="text-[13px] text-muted leading-relaxed">
                        {point.description}
                      </p>
                    )}
                  </div>
                  <Badge tone={STATUT_LABEL[pointStatut].tone}>
                    {pPct}%
                  </Badge>
                </header>

                {/* Barre fine par point */}
                <div className="px-5 py-2 bg-surface-sunk border-b border-border-warm">
                  <div className="w-full h-1 bg-bg rounded-full overflow-hidden">
                    <div
                      className="h-full bg-forest transition-[width] duration-500 ease-out-soft"
                      style={{ width: `${pPct}%` }}
                    />
                  </div>
                </div>

                {/* Sous-points */}
                <ul className="divide-y divide-border-warm">
                  {point.sousPoints.map((sp) => {
                    const isTermine = sp.statut === "termine";
                    return (
                      <li
                        key={sp.id}
                        className="group flex items-start gap-3 px-5 py-3.5 hover:bg-surface-sunk transition-colors"
                      >
                        <button
                          onClick={() => handleToggleSousPoint(plan.id, sp.id)}
                          aria-label={
                            isTermine
                              ? "Marquer comme non terminé"
                              : "Marquer comme terminé"
                          }
                          className={`shrink-0 mt-0.5 inline-flex items-center justify-center w-5 h-5 rounded-full border transition-all duration-200 ease-out-soft ${
                            isTermine
                              ? "bg-forest border-forest text-white"
                              : "border-border bg-surface group-hover:border-forest/40"
                          }`}
                        >
                          {isTermine ? (
                            <Check size={11} strokeWidth={2.75} />
                          ) : (
                            <Circle
                              size={9}
                              strokeWidth={2}
                              className="text-transparent group-hover:text-muted-soft/50"
                            />
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-[14px] leading-snug ${
                              isTermine
                                ? "text-muted line-through"
                                : "text-ink"
                            }`}
                          >
                            {sp.titre}
                          </p>
                          {sp.questionInitiale && (
                            <p className="text-[12.5px] text-muted mt-1 italic leading-relaxed">
                              « {sp.questionInitiale} »
                            </p>
                          )}
                        </div>
                        <span className="shrink-0 text-[11px] text-muted-soft font-mono">
                          {sp.id}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </article>
            );
          })}
        </section>

        {/* Actions */}
        <section className="mt-8 flex items-center justify-between border-t border-border-warm pt-5">
          <Link
            href="/chat"
            className="inline-flex items-center gap-1.5 text-[13px] text-forest hover:underline"
          >
            Discuter avec Panthère pour avancer →
          </Link>
          <Button variant="danger" size="sm" onClick={handleDelete}>
            <Trash2 size={13} strokeWidth={1.75} />
            Supprimer le plan
          </Button>
        </section>
      </div>
    </main>
  );
}