"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, BookOpen, Sparkles, TrendingUp } from "lucide-react";
import { Button, Logo } from "@/components/ui";
import { useProfil } from "@/lib/store";

// Cartes "valeur" — Dribbble-style : grandes, surface, coins modérés.
const VALUE_CARDS = [
  {
    icon: BookOpen,
    title: "Socratique",
    body: "Aucune réponse directe. Tu trouves par toi-même, guidé.",
  },
  {
    icon: Sparkles,
    title: "Contexte africain",
    body: "Programmes et exemples tirés de la réalité du continent.",
  },
  {
    icon: TrendingUp,
    title: "Adaptatif",
    body: "Des indices progressifs selon ton niveau et tes acquis.",
  },
];

export default function HomePage() {
  const router = useRouter();
  const { profil, ready } = useProfil();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!ready) return;
    setChecked(true);
  }, [ready]);

  const handleStart = () => {
    if (profil) router.push("/chat");
    else router.push("/onboarding");
  };

  return (
    <main className="min-h-screen flex flex-col">
      {/* ── Header minimal ── */}
      <header className="px-6 sm:px-10 py-5 flex items-center justify-between">
        <Logo />
        <Link
          href="/progress"
          className="text-[13px] text-muted hover:text-ink transition-colors"
        >
          Ma progression
        </Link>
      </header>

      {/* ── Hero ── */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 -mt-10 animate-fade-up">
        <div className="text-center max-w-2xl">
          <span className="inline-flex items-center gap-1.5 text-[12px] tracking-wide uppercase text-forest font-medium bg-forest-soft border border-forest/15 rounded-full px-3 py-1">
            <Sparkles size={12} strokeWidth={2.25} />
            Assistant éducatif
          </span>

          <h1 className="font-display text-5xl sm:text-6xl font-light tracking-tight text-ink mt-6 leading-[1.05]">
            Apprends en cherchant.
            <br />
            <span className="italic text-forest">Pas en recopiant.</span>
          </h1>

          <p className="text-[17px] text-muted leading-relaxed mt-5 max-w-md mx-auto">
            Panthère ne donne jamais la réponse. Il pose les bonnes questions
            pour que tu trouves la solution par toi-même.
          </p>

          <div className="mt-8 flex items-center justify-center gap-3">
            <Button
              size="lg"
              onClick={handleStart}
              disabled={!checked}
              className="px-7"
            >
              {!checked
                ? "Chargement…"
                : profil
                  ? `Reprendre · ${profil.prenom}`
                  : "Commencer à apprendre"}
              <ArrowRight size={16} strokeWidth={2.25} />
            </Button>
            {profil && (
              <Link
                href="/onboarding"
                className="text-[13px] text-muted hover:text-ink transition-colors"
              >
                Modifier le profil
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ── Cartes valeur ── */}
      <section className="px-6 sm:px-10 pb-12">
        <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-3 stagger">
          {VALUE_CARDS.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="bg-surface border border-border rounded-lg p-4 hover:shadow-sm transition-shadow duration-200 ease-out-soft"
            >
              <Icon
                size={18}
                strokeWidth={1.75}
                className="text-ink mb-2.5"
              />
              <h3 className="text-[14px] font-semibold text-ink mb-1">
                {title}
              </h3>
              <p className="text-[13px] text-muted leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border-warm py-5 px-6 sm:px-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between text-[12px] text-muted-soft">
          <span>Phase 1 · Prototype · Afrique</span>
          <span>© Panthère</span>
        </div>
      </footer>
    </main>
  );
}