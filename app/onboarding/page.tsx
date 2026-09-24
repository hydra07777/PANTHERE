"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, GraduationCap } from "lucide-react";
import { Button, Logo, Input, Select } from "@/components/ui";
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
  const langueActive = LANGUES.find((l) => l.value === langue);

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
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="px-6 sm:px-10 py-5">
        <Logo />
      </header>

      {/* Contenu */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-xl bg-surface border border-border rounded-xl shadow-xs p-7 animate-fade-up"
        >
          <header className="mb-6">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-forest-soft text-forest mb-3">
              <GraduationCap size={18} strokeWidth={1.75} />
            </div>
            <h1 className="font-display text-2xl font-medium tracking-tight text-ink">
              Bienvenue.
            </h1>
            <p className="text-[14px] text-muted mt-1">
              Quelques infos pour personnaliser ton apprentissage.
            </p>
          </header>

          <div className="space-y-4">
            <Input
              label="Comment t'appelles-tu ?"
              name="prenom"
              value={prenom}
              onChange={(e) => setPrenom(e.target.value)}
              placeholder="Ex : Aïcha, Joseph, Grâce…"
              required
            />

            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Pays"
                name="pays"
                value={pays}
                onChange={(e) => {
                  setPays(e.target.value as Pays);
                  setVille("");
                }}
              >
                {Object.keys(PAYS).map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </Select>

              <Select
                label="Ville"
                name="ville"
                value={ville}
                onChange={(e) => setVille(e.target.value)}
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
              </Select>
            </div>

            <Select
              label="Niveau scolaire"
              name="niveau"
              value={niveau}
              onChange={(e) => setNiveau(e.target.value as Niveau)}
            >
              {NIVEAUX.map((n) => (
                <option key={n.value} value={n.value}>
                  {n.label}
                </option>
              ))}
            </Select>

            <Select
              label="Langue de travail"
              name="langue"
              value={langue}
              onChange={(e) => setLangue(e.target.value as Langue)}
              hint={langueActive?.description}
            >
              {LANGUES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </Select>

            <Select
              label="Matière principale"
              name="matiere"
              value={matiere}
              onChange={(e) => setMatiere(e.target.value)}
            >
              <option value="mathematiques">Mathématiques</option>
              <option value="physique">Physique-Chimie</option>
              <option value="svt">Sciences de la Vie et de la Terre</option>
              <option value="francais">Français</option>
              <option value="anglais">Anglais</option>
            </Select>
          </div>

          <Button
            type="submit"
            size="lg"
            fullWidth
            className="mt-7"
            disabled={submitting || !prenom.trim()}
          >
            {submitting ? "Préparation…" : "Commencer à apprendre"}
            <ArrowRight size={16} strokeWidth={2.25} />
          </Button>
        </form>
      </div>
    </main>
  );
}