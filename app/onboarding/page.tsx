"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  PAYS,
  VILLES_RDC,
  NIVEAUX,
  LANGUES,
  type ProfilEtudiant,
  type Pays,
  type Niveau,
  type Langue,
} from "@/lib/profil";
import { useProfil } from "@/lib/store";

export default function OnboardingPage() {
  const router = useRouter();
  const { setProfil } = useProfil();
  const [prenom, setPrenom] = useState("");
  const [pays, setPays] = useState<Pays>("République Démocratique du Congo");
  const [ville, setVille] = useState("");
  const [niveau, setNiveau] = useState<Niveau>("lycee_terminale");
  const [langue, setLangue] = useState<Langue>("fr");
  const [matiere, setMatiere] = useState("mathematiques");
  const [submitting, setSubmitting] = useState(false);

  const villes = PAYS[pays].villes;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prenom.trim()) return;
    setSubmitting(true);
    const profil: ProfilEtudiant = {
      prenom: prenom.trim(),
      pays,
      ville,
      niveau,
      langue,
      matierePreferee: matiere,
      creeLe: new Date().toISOString(),
    };
    await setProfil(profil);
    router.push("/chat");
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg bg-white rounded-2xl shadow-lg p-8 space-y-5"
      >
        <header className="text-center mb-2">
          <h1 className="text-3xl font-bold text-panthere-dark">🐆 Bienvenue</h1>
          <p className="text-gray-500 mt-1">
            Quelques infos pour personnaliser ton apprentissage.
          </p>
        </header>

        <Field label="Comment t'appelles-tu ?">
          <input
            type="text"
            value={prenom}
            onChange={(e) => setPrenom(e.target.value)}
            placeholder="Ex : Aïcha, Joseph, Grâce..."
            required
            className="input"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Pays">
            <select
              value={pays}
              onChange={(e) => {
                setPays(e.target.value as Pays);
                setVille("");
              }}
              className="input"
            >
              {Object.keys(PAYS).map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Ville">
            <select
              value={ville}
              onChange={(e) => setVille(e.target.value)}
              className="input"
            >
              <option value="">— Choisir —</option>
              {(pays === "République Démocratique du Congo"
                ? VILLES_RDC
                : villes
              ).map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Niveau scolaire">
          <select
            value={niveau}
            onChange={(e) => setNiveau(e.target.value as Niveau)}
            className="input"
          >
            {NIVEAUX.map((n) => (
              <option key={n.value} value={n.value}>
                {n.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Langue de travail">
          <select
            value={langue}
            onChange={(e) => setLangue(e.target.value as Langue)}
            className="input"
          >
            {LANGUES.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            {
              LANGUES.find((l) => l.value === langue)?.description
            }
          </p>
        </Field>

        <Field label="Matière principale">
          <select
            value={matiere}
            onChange={(e) => setMatiere(e.target.value)}
            className="input"
          >
            <option value="mathematiques">Mathématiques</option>
            <option value="physique">Physique-Chimie</option>
            <option value="svt">Sciences de la Vie et de la Terre</option>
            <option value="francais">Français</option>
            <option value="anglais">Anglais</option>
          </select>
        </Field>

        <button
          type="submit"
          disabled={submitting || !prenom.trim()}
          className="w-full bg-panthere-green text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {submitting ? "..." : "Commencer à apprendre →"}
        </button>

        <style>{`
          .input {
            width: 100%;
            border: 1px solid #d1d5db;
            border-radius: 0.5rem;
            padding: 0.625rem 0.75rem;
            background: white;
            transition: border-color 0.15s;
          }
          .input:focus {
            outline: none;
            border-color: var(--color-panthere-gold);
          }
        `}</style>
      </form>
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-700 mb-1 block">
        {label}
      </span>
      {children}
    </label>
  );
}