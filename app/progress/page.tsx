"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useProfil, getProgression, type Progression } from "@/lib/store";

/** Regroupement des topics en grandes familles pour l'affichage. */
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready) return;
    if (!profil) {
      window.location.href = "/onboarding";
      return;
    }
    // Récupère la progression pour la matière principale + quelques autres.
    const matieres = ["mathematiques", "physique", "svt", "francais", "anglais"];
    Promise.all(matieres.map((m) => getProgression(m)))
      .then((results) => {
        setProgressions(results.filter((r): r is Progression => !!r));
      })
      .finally(() => setLoading(false));
  }, [ready, profil]);

  if (!profil) return null;

  // Calcule les stats globales
  const tous = progressions.flatMap((p) =>
    Object.entries(p.concepts).map(([topic, statut]) => ({ topic, statut, matiere: p.matiere }))
  );
  const nbAcquis = tous.filter((t) => t.statut === "acquis").length;
  const nbEnCours = tous.filter((t) => t.statut === "en_cours").length;
  const nbTotal = tous.length;

  return (
    <main className="min-h-screen max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-panthere-dark">📈 Ma progression</h1>
          <p className="text-sm text-gray-500 mt-1">
            {profil.prenom} · {profil.pays} · {profil.ville}
          </p>
        </div>
        <Link
          href="/chat"
          className="text-sm bg-panthere-green text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          ← Retour au chat
        </Link>
      </header>

      {loading ? (
        <p className="text-gray-400 text-center py-12">Chargement…</p>
      ) : nbTotal === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* Stats globales */}
          <section className="grid grid-cols-3 gap-3 mb-8">
            <StatCard
              label="Concepts acquis"
              value={nbAcquis}
              color="green"
              icon="✓"
            />
            <StatCard
              label="En cours"
              value={nbEnCours}
              color="amber"
              icon="◐"
            />
            <StatCard label="Total vus" value={nbTotal} color="gray" icon="≡" />
          </section>

          {/* Par famille */}
          <section className="space-y-5">
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
                <div
                  key={famille.titre}
                  className="bg-white rounded-xl border border-gray-200 p-5"
                >
                  <header className="flex items-center justify-between mb-3">
                    <h2 className="font-semibold text-panthere-dark">
                      {famille.titre}
                    </h2>
                    <span className="text-xs text-gray-500">
                      {acquisFamille}/{famille.topics.length} · {pct}%
                    </span>
                  </header>
                  <ProgressBar pct={pct} />
                  <ul className="mt-3 space-y-1 text-sm">
                      {famille.topics.map((topic) => {
                        const found = topicsFamille.find(
                          (t) => t.topic === topic
                        );
                        const statut = found?.statut;
                        return (
                          <li
                            key={topic}
                            className="flex items-center gap-2 text-gray-700"
                          >
                            <StatusBadge statut={statut} />
                            <span className={statut ? "" : "text-gray-400"}>
                              {topic}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                </div>
              );
            })}
          </section>
        </>
      )}
    </main>
  );
}

function StatCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number;
  color: "green" | "amber" | "gray";
  icon: string;
}) {
  const colors = {
    green: "bg-green-50 text-green-700 border-green-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    gray: "bg-gray-50 text-gray-700 border-gray-200",
  };
  return (
    <div className={`rounded-xl border p-4 text-center ${colors[color]}`}>
      <div className="text-2xl font-bold">{icon} {value}</div>
      <div className="text-xs mt-1">{label}</div>
    </div>
  );
}

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
      <div
        className="h-full bg-panthere-green transition-all"
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
    return <span className="text-green-600">✓</span>;
  if (statut === "en_cours")
    return <span className="text-amber-500">◐</span>;
  return <span className="text-gray-300">✗</span>;
}

function EmptyState() {
  return (
    <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
      <p className="text-4xl mb-4">🌱</p>
      <p className="text-gray-700 font-medium mb-2">Pas encore de progression</p>
      <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
        Commence à discuter avec Panthère sur un sujet de maths : tes concepts
        acquis apparaîtront ici au fur et à mesure.
      </p>
      <Link
        href="/chat"
        className="inline-block bg-panthere-green text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700"
      >
        Démarrer une conversation
      </Link>
    </div>
  );
}