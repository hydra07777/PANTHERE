"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useProfil } from "@/lib/store";

export default function HomePage() {
  const router = useRouter();
  const { profil, ready } = useProfil();
  const [checking, setChecked] = useState(false);

  useEffect(() => {
    if (!ready) return;
    setChecked(true);
  }, [ready]);

  const handleStart = () => {
    if (profil) router.push("/chat");
    else router.push("/onboarding");
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="text-center max-w-lg">
        <h1 className="text-5xl font-bold text-panthere-dark mb-2">
          Panthère
        </h1>
        <p className="text-xl text-panthere-gold font-semibold mb-8">
          ⚡ Assistant éducatif socratique
        </p>

        <p className="text-gray-600 mb-8 leading-relaxed">
          Panthère ne donne jamais la réponse toute faite.
          Il te guide par des questions et des indices progressifs
          pour que tu trouves la solution par toi-même.
        </p>

        <button
          onClick={handleStart}
          disabled={!checking}
          className="inline-block bg-panthere-green text-white px-8 py-3 rounded-lg font-semibold text-lg hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          {checking
            ? "..."
            : profil
              ? `Reprendre (${profil.prenom})`
              : "Commencer à apprendre"}
        </button>

        {profil && (
          <p className="text-xs text-gray-400 mt-3">
            <Link href="/onboarding" className="underline">
              Modifier mon profil
            </Link>
          </p>
        )}

        <div className="mt-12 grid grid-cols-3 gap-4 text-sm text-gray-500">
          <div className="p-3">
            <div className="font-semibold text-panthere-dark mb-1">🧠 Socratique</div>
            Jamais la réponse directe
          </div>
          <div className="p-3">
            <div className="font-semibold text-panthere-dark mb-1">📚 Contexte africain</div>
            Programmes et exemples locaux
          </div>
          <div className="p-3">
            <div className="font-semibold text-panthere-dark mb-1">📈 Adaptatif</div>
            Indices progressifs
          </div>
        </div>

        <footer className="mt-12 text-xs text-gray-400">
          Phase 1 — Prototype · Afrique
        </footer>
      </div>
    </main>
  );
}