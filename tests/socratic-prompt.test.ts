// ──────────────────────────────────────────────
// Tests automatisés du comportement socratique
// Vérifie que le system prompt refuse de donner
// les réponses directes et adopte le bon comportement.
// ──────────────────────────────────────────────

import { describe, it, expect } from "vitest";
import { SOCRATIC_SYSTEM_PROMPT } from "../lib/prompts/socratic";

describe("System prompt socratique", () => {
  // --- Structure du prompt ---
  it("contient la règle absolue de ne jamais donner la réponse", () => {
    expect(SOCRATIC_SYSTEM_PROMPT).toContain("jamais");
    expect(SOCRATIC_SYSTEM_PROMPT).toContain("réponse finale");
    expect(SOCRATIC_SYSTEM_PROMPT).toContain("RÈGLE ABSOLUE");
  });

  it("définit les 4 étapes obligatoires", () => {
    expect(SOCRATIC_SYSTEM_PROMPT).toContain("ACCUSÉ");
    expect(SOCRATIC_SYSTEM_PROMPT).toContain("DIAGNOSTIC");
    expect(SOCRATIC_SYSTEM_PROMPT).toContain("INDICE");
    expect(SOCRATIC_SYSTEM_PROMPT).toContain("VÉRIFICATION");
  });

  it("définit 3 niveaux d'indices progressifs", () => {
    const niveau1 = SOCRATIC_SYSTEM_PROMPT.match(/Niveau 1/g);
    const niveau2 = SOCRATIC_SYSTEM_PROMPT.match(/Niveau 2/g);
    const niveau3 = SOCRATIC_SYSTEM_PROMPT.match(/Niveau 3/g);
    expect(niveau1).toBeTruthy();
    expect(niveau2).toBeTruthy();
    expect(niveau3).toBeTruthy();
  });

  // --- Refus des contournements ---
  it("contient des réponses pour 'donne-moi juste la réponse'", () => {
    expect(SOCRATIC_SYSTEM_PROMPT).toContain("Donne-moi juste la réponse");
  });

  it("contient une réponse pour 'fais comme si j'avais déjà essayé'", () => {
    expect(SOCRATIC_SYSTEM_PROMPT).toContain("déjà essayé");
  });

  it("contient une réponse pour 'vérifie ma réponse'", () => {
    expect(SOCRATIC_SYSTEM_PROMPT).toContain("Vérifie ma réponse");
  });

  // --- Ton et posture ---
  it("est en français", () => {
    // Vérifie que le prompt est majoritairement en français
    const frenchWords = ["tu", "es", "pour", "dans", "avec", "sur", "ne", "pas"];
    for (const word of frenchWords) {
      expect(SOCRATIC_SYSTEM_PROMPT.toLowerCase()).toContain(word);
    }
  });

  it("est bienveillant et encourageant", () => {
    expect(SOCRATIC_SYSTEM_PROMPT.toLowerCase()).toContain("bienveillant");
    expect(SOCRATIC_SYSTEM_PROMPT.toLowerCase()).toContain("encourageant");
  });

  it("mentionne le contexte africain", () => {
    expect(SOCRATIC_SYSTEM_PROMPT.toLowerCase()).toContain("africain");
  });

  it("mentionne les contraintes mobile/connectivité", () => {
    expect(SOCRATIC_SYSTEM_PROMPT).toContain("mobile");
    expect(SOCRATIC_SYSTEM_PROMPT).toContain("connexion");
  });

  // --- RAG ---
  it("gère le contexte RAG via la balise <contexte_rag>", () => {
    expect(SOCRATIC_SYSTEM_PROMPT).toContain("contexte_rag");
  });

  it("demande de citer les sources RAG", () => {
    expect(SOCRATIC_SYSTEM_PROMPT).toContain("source");
  });
});

describe("Structure du projet", () => {
  it("existe en tant que module exporté", () => {
    expect(SOCRATIC_SYSTEM_PROMPT).toBeDefined();
    expect(typeof SOCRATIC_SYSTEM_PROMPT).toBe("string");
  });
});