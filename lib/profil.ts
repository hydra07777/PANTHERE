// ──────────────────────────────────────────────
// Profil utilisateur — Panthère
// Public cible : RDC (République Démocratique du Congo)
// Stocké dans IndexedDB (côté navigateur).
// ──────────────────────────────────────────────

export type Niveau =
  | "college_6e"
  | "college_5e"
  | "college_4e"
  | "college_3e"
  | "lycee_2nde"
  | "lycee_1ere"
  | "lycee_terminale"
  | "superieur";

/** Langues de travail proposées. Le lingala, swahili, kikongo et tshiluba
 * sont les quatre langues nationales de la RDC selon la constitution. */
export type Langue =
  | "fr"
  | "fr_lingala"
  | "fr_swahili"
  | "fr_kikongo"
  | "fr_tshiluba";

export const PAYS = {
  "République Démocratique du Congo": {
    code: "CD",
    villes: [
      "Kinshasa",
      "Lubumbashi",
      "Mbuji-Mayi",
      "Kisangani",
      "Goma",
      "Bukavu",
      "Kananga",
      "Likasi",
      "Kolwezi",
      "Matadi",
    ],
  },
} as const;

export type Pays = keyof typeof PAYS;

/** Liste des villes de RDC (extraite de PAYS pour usages type-safe). */
export const VILLES_RDC = PAYS["République Démocratique du Congo"].villes;

export const NIVEAUX: { value: Niveau; label: string }[] = [
  { value: "college_6e", label: "Collège — 6ème" },
  { value: "college_5e", label: "Collège — 5ème" },
  { value: "college_4e", label: "Collège — 4ème" },
  { value: "college_3e", label: "Collège — 3ème" },
  { value: "lycee_2nde", label: "Lycée — 2nde" },
  { value: "lycee_1ere", label: "Lycée — 1ère" },
  { value: "lycee_terminale", label: "Lycée — Terminale" },
  { value: "superieur", label: "Supérieur (Université / Institut)" },
];

export const LANGUES: { value: Langue; label: string; description: string }[] = [
  {
    value: "fr",
    label: "Français uniquement",
    description: "Langue officielle d'enseignement",
  },
  {
    value: "fr_lingala",
    label: "Français + Lingala",
    description: "Lingála — parlé à Kinshasa, Équateur, nord du pays",
  },
  {
    value: "fr_swahili",
    label: "Français + Swahili",
    description: "Kiswahíli — parlé à l'est (Kivu), Katanga, Nord-Kivu",
  },
  {
    value: "fr_kikongo",
    label: "Français + Kikongo",
    description: "Kikóngo — parlé à l'ouest (Bas-Congo, Kongo Central)",
  },
  {
    value: "fr_tshiluba",
    label: "Français + Tshiluba",
    description: "Tshilúba — parlé au centre-sud (Kasaï)",
  },
];

export interface ProfilEtudiant {
  prenom: string;
  pays: Pays;
  ville: string;
  niveau: Niveau;
  langue: Langue;
  matierePreferee: string;
  creeLe: string;
}

/** Convertit le profil en ligne pour injection dans le system prompt. */
export function profilToContext(p: ProfilEtudiant): string {
  const niveauLabel =
    NIVEAUX.find((n) => n.value === p.niveau)?.label ?? p.niveau;
  const langueLabel =
    LANGUES.find((l) => l.value === p.langue)?.label ?? p.langue;
  return [
    `Prénom: ${p.prenom || "(non renseigné)"}`,
    `Pays: ${p.pays}`,
    `Ville: ${p.ville || "(non renseignée)"}`,
    `Niveau: ${niveauLabel}`,
    `Langue de travail: ${langueLabel}`,
    `Matière principale: ${p.matierePreferee || "mathematiques"}`,
  ].join(" | ");
}