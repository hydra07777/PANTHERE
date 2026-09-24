"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Compass,
  ListChecks,
  TrendingUp,
  Trash2,
} from "lucide-react";
import { Badge, Card, CardBody, Logo, Skeleton } from "@/components/ui";
import {
  useProfil,
  getProgression,
  listLearningPlans,
  deleteLearningPlan,
  type Progression,
} from "@/lib/store";
import type { LearningPlan } from "@/lib/learning-plan/types";
import { planProgressPct } from "@/lib/learning-plan/types";

// Familles de topics pour grouper l'affichage.
const FAMILLES: { titre: string; topics: string[] }[] = [
  {
    titre: "Équations du second degré",
    topics: [
      "discriminant",
      "delta",
      "second degre",
      "solutions",
      "solutions reelles",
      "solutions complexes",
      "solution double",
      "pas de solution",
    ],
  },
  {
    titre: "Factorisation",
    topics: [
      "factorisation",
      "identites remarquables",
      "developpement",
      "developpement factorisation",
    ],
  },
  {
    titre: "Somme et produit des racines",
    topics: [
      "somme des racines",
      "produit des racines",
      "viete",
      "relations viete",
    ],
  },
  {
    titre: "Fonctions usuelles",
    topics: [
      "fonction lineaire",
      "fonction affine",
      "fonction polynome",
      "parabole",
    ],
  },
  {
    titre: "Géométrie",
    topics: ["thales", "pythagore", "trigonometrie", "aires", "volumes"],
  },
];

export default function ProgressPage() {
  const { profil, ready } = useProfil();
  const [progressions, setProgressions] = useState<Progression[]>([]);
  const [plans, setPlans] = useState<LearningPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshPlans = async () => {
    const p = await listLearningPlans();
    setPlans(p);
  };

  useEffect(() => {
    if (!ready) return;
    if (!profil) {
      window.location.href = "/onboarding";
      return;
    }
    const matieres = ["mathematiques", "physique", "svt", "francais", "anglais"];
    Promise.all(matieres.map((m) => getProgression(m)))
      .then((results) => {
        setProgressions(results.filter((r): r is Progression => !!r));
      })
      .finally(() => setLoading(false));
    refreshPlans();
  }, [ready, profil]);

  if (!profil) return null;

  const tous = progressions.flatMap((p) =>
    Object.entries(p.concepts).map(([topic, statut]) => ({
      topic,
      statut,
    }))
  );
  const nbAcquis = tous.filter((t) => t.statut === "acquis").length;
  const nbEnCours = tous.filter((t) => t.statut === "en_cours").length;
  const nbTotal = tous.length;
  const plansActifs = plans.filter((p) => p.statut === "actif");
  const plansTermines = plans.filter((p) => p.statut === "complete");

  const handleDeletePlan = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Supprimer ce plan d'apprentissage ?")) return;
    await deleteLearningPlan(id);
    refreshPlans();
  };

  return (
    <main className="min-h-screen">
      {/* ── Header ── */}
      <header className="px-6 sm:px-10 py-5 border-b border-border-warm flex items-center justify-between">
        <Logo />
        <Link
          href="/chat"
          className="inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-ink transition-colors"
        >
          <ArrowLeft size={14} strokeWidth={2} />
          Retour au chat
        </Link>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8 animate-fade-up">
        {/* Titre */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={18} strokeWidth={1.75} className="text-ink" />
            <h1 className="font-display text-2xl font-medium tracking-tight text-ink">
              Ma progression
            </h1>
          </div>
          <p className="text-[13px] text-muted">
            {profil.prenom} · {profil.ville || profil.pays}
          </p>
        </div>

        {loading ? (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
            </div>
            <Skeleton className="h-32 mt-4" />
          </div>
        ) : nbTotal === 0 && plans.length === 0 ? (
          <EmptyState prenom={profil.prenom} />
        ) : (
          <>
            {/* Stats */}
            <section className="grid grid-cols-3 gap-3 mb-8">
              <StatCard
                label="Concepts acquis"
                value={nbAcquis}
                tone="terracotta"
              />
              <StatCard label="En cours" value={nbEnCours} tone="gold" />
              <StatCard label="Total vus" value={nbTotal} tone="neutral" />
            </section>

            {/* Plans d'apprentissage */}
            {plans.length > 0 && (
              <section className="mb-8">
                <header className="flex items-center gap-2 mb-3">
                  <Compass size={16} strokeWidth={1.75} className="text-ink" />
                  <h2 className="text-[15px] font-semibold text-ink">
                    Plans d'apprentissage
                  </h2>
                  <Badge tone="muted">{plans.length}</Badge>
                </header>
                <div className="space-y-2">
                  {plansActifs.length > 0 &&
                    plansActifs.map((plan) => (
                      <PlanRow
                        key={plan.id}
                        plan={plan}
                        onDelete={handleDeletePlan}
                      />
                    ))}
                  {plansTermines.length > 0 && (
                    <details className="mt-2">
                      <summary className="text-[12.5px] text-muted hover:text-ink cursor-pointer select-none px-1 py-1.5">
                        {plansTermines.length} plan{plansTermines.length > 1 ? "s" : ""} terminé{plansTermines.length > 1 ? "s" : ""}
                      </summary>
                      <div className="space-y-2 mt-2">
                        {plansTermines.map((plan) => (
                          <PlanRow
                            key={plan.id}
                            plan={plan}
                            onDelete={handleDeletePlan}
                          />
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              </section>
            )}

            {/* Familles de topics */}
            <section className="space-y-4">
              {FAMILLES.map((famille) => {
                const topicsFamille = tous.filter((t) =>
                  famille.topics.includes(t.topic)
                );
                if (topicsFamille.length === 0) return null;
                const acquisFamille = topicsFamille.filter(
                  (t) => t.statut === "acquis"
                ).length;
                const pct = Math.round(
                  (acquisFamille / famille.topics.length) * 100
                );
                return (
                  <Card key={famille.titre}>
                    <CardBody className="!p-5">
                      <header className="flex items-center justify-between mb-3">
                        <h2 className="font-semibold text-[14px] text-ink">
                          {famille.titre}
                        </h2>
                        <span className="text-[12px] text-muted tabular-nums">
                          {acquisFamille}/{famille.topics.length} · {pct}%
                        </span>
                      </header>
                      <ProgressBar pct={pct} />
                      <ul className="mt-4 space-y-1.5 text-[13.5px]">
                        {famille.topics.map((topic) => {
                          const found = topicsFamille.find(
                            (t) => t.topic === topic
                          );
                          const statut = found?.statut;
                          return (
                            <li
                              key={topic}
                              className="flex items-center gap-2.5"
                            >
                              <StatusBadge statut={statut} />
                              <span
                                className={
                                  statut ? "text-ink" : "text-muted-soft"
                                }
                              >
                                {topic}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </CardBody>
                  </Card>
                );
              })}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

// ─── Ligne d'un plan d'apprentissage ───
function PlanRow({
  plan,
  onDelete,
}: {
  plan: LearningPlan;
  onDelete: (id: string, e: React.MouseEvent) => void;
}) {
  const pct = planProgressPct(plan);
  const isComplete = plan.statut === "complete";
  const totalSousPoints = plan.points.flatMap((p) => p.sousPoints).length;
  const termines = plan.points
    .flatMap((p) => p.sousPoints)
    .filter((sp) => sp.statut === "termine").length;

  return (
    <Link
      href={`/progress/${plan.id}`}
      className="group block bg-surface border border-border rounded-lg p-4 hover:border-ink/20 hover:shadow-sm transition-all duration-200 ease-out-soft"
    >
      <div className="flex items-start gap-3">
        <div
          className={`shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-full ${
            isComplete ? "bg-forest-soft text-forest" : "bg-gold-soft text-ink"
          }`}
        >
          {isComplete ? (
            <ListChecks size={16} strokeWidth={1.75} />
          ) : (
            <Compass size={16} strokeWidth={1.75} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <h3 className="text-[14px] font-semibold text-ink capitalize truncate">
              {plan.concept}
            </h3>
            <Badge tone={isComplete ? "forest" : "gold"}>
              {isComplete ? "Terminé" : `${pct}%`}
            </Badge>
          </div>
          <p className="text-[12.5px] text-muted line-clamp-1">
            {plan.objectif}
          </p>
          <div className="flex items-center gap-3 mt-2.5">
            <div className="flex-1 h-1 bg-bg rounded-full overflow-hidden">
              <div
                className="h-full bg-forest transition-[width] duration-500 ease-out-soft"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-[11px] text-muted-soft tabular-nums shrink-0">
              {termines}/{totalSousPoints}
            </span>
          </div>
        </div>
        <button
          onClick={(e) => onDelete(plan.id, e)}
          aria-label="Supprimer le plan"
          className="shrink-0 -mt-1 -mr-1 p-1 text-muted-soft hover:text-terracotta opacity-0 group-hover:opacity-100 transition-all"
        >
          <Trash2 size={13} strokeWidth={1.75} />
        </button>
      </div>
    </Link>
  );
}

// ─── Sous-composants ───

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "forest" | "gold" | "terracotta" | "neutral";
}) {
  const toneClasses: Record<typeof tone, string> = {
    forest: "bg-forest-soft border-forest/15",
    gold: "bg-gold-soft border-gold/20",
    terracotta: "bg-terracotta/10 border-terracotta/20",
    neutral: "bg-surface-sunk border-border",
  };
  const valueClasses: Record<typeof tone, string> = {
    forest: "text-forest",
    gold: "text-ink",
    terracotta: "text-terracotta",
    neutral: "text-ink",
  };
  return (
    <div className={`rounded-lg border p-4 ${toneClasses[tone]}`}>
      <div
        className={`text-2xl font-semibold tabular-nums ${valueClasses[tone]}`}
      >
        {value}
      </div>
      <div className="text-[12px] text-muted mt-0.5">{label}</div>
    </div>
  );
}

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="w-full h-1.5 bg-bg rounded-full overflow-hidden">
      <div
        className="h-full bg-forest transition-[width] duration-500 ease-out-soft"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function StatusBadge({
  statut,
}: {
  statut: "acquis" | "en_cours" | "non_vu" | undefined;
}) {
  if (statut === "acquis")
    return (
      <span
        className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-terracotta/10 text-terracotta"
        aria-label="Acquis"
      >
        <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
          <path
            d="M1.5 5L4 7.5L8.5 2.5"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    );
  if (statut === "en_cours")
    return (
      <span
        className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-gold-soft text-ink"
        aria-label="En cours"
      >
        <span className="block w-1.5 h-1.5 rounded-full bg-gold" />
      </span>
    );
  return (
    <span
      className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-bg border border-border"
      aria-label="Non vu"
    />
  );
}

function EmptyState({ prenom }: { prenom: string }) {
  return (
    <Card>
      <CardBody className="!py-14 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-forest-soft text-forest mb-4">
          <TrendingUp size={20} strokeWidth={1.75} />
        </div>
        <p className="text-[15px] font-medium text-ink mb-1.5">
          Pas encore de progression
        </p>
        <p className="text-[13.5px] text-muted mb-6 max-w-sm mx-auto leading-relaxed">
          Commence à discuter avec Panthère sur un sujet de maths, {prenom}.
          Tes concepts acquis apparaîtront ici au fur et à mesure.
        </p>
        <Link
          href="/chat"
          className="inline-flex items-center gap-1.5 bg-forest text-white px-5 h-10 rounded-md font-medium text-[14px] hover:bg-forest-hover transition-colors duration-200 ease-out-soft shadow-xs"
        >
          Démarrer une conversation
          <ArrowLeft size={14} strokeWidth={2.25} className="rotate-180" />
        </Link>
      </CardBody>
    </Card>
  );
}