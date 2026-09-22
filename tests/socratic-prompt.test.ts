// ──────────────────────────────────────────────
// Tests — Panthère
// Vérifie que le system prompt respecte les principes
// socratiques et que la couche RAG nettoie/indexe correctement.
// ──────────────────────────────────────────────

import { describe, it, expect } from "vitest";
import { SOCRATIC_SYSTEM_PROMPT } from "../lib/prompts/socratic";
import { __test__ as ragTest, searchRelevantContext } from "../lib/rag/search";
import { extractTopics, stripTopics } from "../lib/store";

describe("System prompt socratique", () => {
  it("contient la règle absolue de ne jamais donner la réponse", () => {
    expect(SOCRATIC_SYSTEM_PROMPT).toContain("RÈGLE ABSOLUE");
    expect(SOCRATIC_SYSTEM_PROMPT.toLowerCase()).toContain("jamais");
    expect(SOCRATIC_SYSTEM_PROMPT).toContain("réponse finale");
  });

  it("définit les 4 étapes obligatoires", () => {
    expect(SOCRATIC_SYSTEM_PROMPT).toContain("ACCUSÉ");
    expect(SOCRATIC_SYSTEM_PROMPT).toContain("DIAGNOSTIC");
    expect(SOCRATIC_SYSTEM_PROMPT).toContain("INDICE");
    expect(SOCRATIC_SYSTEM_PROMPT).toContain("VÉRIFICATION");
  });

  it("définit 3 niveaux d'indices progressifs", () => {
    expect(SOCRATIC_SYSTEM_PROMPT).toMatch(/Niveau 1/);
    expect(SOCRATIC_SYSTEM_PROMPT).toMatch(/Niveau 2/);
    expect(SOCRATIC_SYSTEM_PROMPT).toMatch(/Niveau 3/);
  });

  it("contient des réponses aux contournements", () => {
    expect(SOCRATIC_SYSTEM_PROMPT).toContain("Donne-moi juste la réponse");
    expect(SOCRATIC_SYSTEM_PROMPT).toContain("déjà essayé");
    expect(SOCRATIC_SYSTEM_PROMPT).toContain("Vérifie ma réponse");
  });

  it("est bienveillant, francophone et contextualisé africain", () => {
    const lower = SOCRATIC_SYSTEM_PROMPT.toLowerCase();
    expect(lower).toContain("bienveillant");
    expect(lower).toContain("africain");
    expect(SOCRATIC_SYSTEM_PROMPT).toContain("mobile");
    expect(SOCRATIC_SYSTEM_PROMPT).toContain("connexion");
  });

  it("gère le contexte RAG via la balise <contexte_rag>", () => {
    expect(SOCRATIC_SYSTEM_PROMPT).toContain("contexte_rag");
  });
});

describe("Tokenizer RAG", () => {
  it("retire les accents et normalise la casse", () => {
    expect(ragTest.normalize("Équation")).toBe("equation");
    expect(ragTest.normalize("second DÉGRÉ")).toBe("second degre");
  });

  it("filtre les stop words français", () => {
    const tokens = ragTest.tokenize("Comment résoudre une équation du jour ?");
    expect(tokens).not.toContain("une");
    expect(tokens).not.toContain("du");
    expect(tokens).toContain("equation");
    expect(tokens).toContain("resoudre");
  });

  it("découpe un texte en chunks avec chevauchement", () => {
    const text = Array.from({ length: 200 }, (_, i) => `mot${i}`).join(" ");
    const chunks = ragTest.chunkBody(text);
    expect(chunks.length).toBeGreaterThan(1);
    // Vérifie qu'il y a bien un chevauchement entre 2 chunks consécutifs
    const overlap = chunks[0].split(" ").slice(-15).join(" ");
    expect(chunks[1]).toContain(overlap.slice(0, 30));
  });
});

describe("Recherche RAG en mémoire", () => {
  it("retourne des passages pertinents pour une question sur les équations", () => {
    const ctx = searchRelevantContext(
      "Comment résoudre une équation du second degré ?",
      { matiere: "mathematiques", pays: "Cote d'Ivoire" }
    );
    expect(ctx.passages.length).toBeGreaterThan(0);
    expect(ctx.sources.length).toBeGreaterThan(0);
    expect(ctx.passages.join(" ").toLowerCase()).toMatch(
      /discriminant|second degre|equation/
    );
  });

  it("retourne un contexte vide pour une question hors sujet", () => {
    const ctx = searchRelevantContext("Quelle est la capitale du Burkina ?");
    expect(ctx.passages.length).toBe(0);
  });
});

describe("Parseur de topics", () => {
  it("extrait une liste de topics depuis une réponse", () => {
    const response = "Voici ton explication.\n<topics>discriminant, delta, second degre</topics>";
    expect(extractTopics(response)).toEqual([
      "discriminant",
      "delta",
      "second degre",
    ]);
  });

  it("retire la ligne topics du contenu affiché", () => {
    const response = "Voici ton explication.\n<topics>factorisation</topics>";
    const cleaned = stripTopics(response);
    expect(cleaned).not.toContain("<topics>");
    expect(cleaned).toContain("Voici ton explication.");
  });

  it("retourne un tableau vide si pas de balise topics", () => {
    expect(extractTopics("Réponse sans topics")).toEqual([]);
  });
});