import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="text-center max-w-lg">
        {/* Logo / Titre */}
        <h1 className="text-5xl font-bold text-panthere-dark mb-2">
          Panthère
        </h1>
        <p className="text-xl text-panthere-gold font-semibold mb-8">
          ⚡ Assistant éducatif socratique
        </p>

        {/* Description */}
        <p className="text-gray-600 mb-8 leading-relaxed">
          Panthère ne donne jamais la réponse toute faite.
          Il te guide par des questions et des indices progressifs
          pour que tu trouves la solution par toi-même.
        </p>

        {/* Bouton */}
        <Link
          href="/chat"
          className="inline-block bg-panthere-green text-white px-8 py-3 rounded-lg font-semibold text-lg hover:bg-green-700 transition-colors"
        >
          Commencer à apprendre
        </Link>

        {/* Piliers */}
        <div className="mt-12 grid grid-cols-3 gap-4 text-sm text-gray-500">
          <div className="p-3">
            <div className="font-semibold text-panthere-dark mb-1">
              🧠 Socratique
            </div>
            Jamais la réponse directe
          </div>
          <div className="p-3">
            <div className="font-semibold text-panthere-dark mb-1">
              📚 Contexte africain
            </div>
            Programmes et exemples locaux
          </div>
          <div className="p-3">
            <div className="font-semibold text-panthere-dark mb-1">
              📈 Adaptatif
            </div>
            Indices progressifs
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-xs text-gray-400">
          Phase 1 — Prototype · Développeur solo · Afrique
        </footer>
      </div>
    </main>
  );
}