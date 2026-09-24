// ──────────────────────────────────────────────
// Store navigateur (IndexedDB) — Panthère
// Remplace localStorage : +persistant, +espace, asynchrone.
// Stocke profil, conversations (multi), progression par concept.
// Zéro serveur, zéro config, fonctionne sur Vercel gratuit.
// ──────────────────────────────────────────────

"use client";

import { useEffect, useState, useCallback } from "react";
import type { ProfilEtudiant } from "./profil";
import type { LearningPlan, LearningPlanDraft } from "./learning-plan/types";

// ─── Types ───
export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  topics?: string[]; // concepts détectés (Phase B)
  /** Marqueur [PROGRESS:] parsé si présent. */
  progress?: { planId: string; sousPointId: string };
  /** Marqueur [PLAN_PROPOSAL:] parsé si présent. */
  planProposal?: string;
  /** Bloc de raisonnement <think>...</think> extrait de la réponse. */
  think?: string;
}

export interface Conversation {
  id: string;
  titre: string;
  matiere: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
}

export interface Progression {
  matiere: string;
  concepts: Record<string, "non_vu" | "en_cours" | "acquis">;
  derniereActivite: string;
}

// ─── Wrapper IndexedDB minimaliste ───
const DB_NAME = "panthere";
const DB_VERSION = 2;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("profil")) {
        db.createObjectStore("profil", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("conversations")) {
        const store = db.createObjectStore("conversations", { keyPath: "id" });
        store.createIndex("updatedAt", "updatedAt");
      }
      if (!db.objectStoreNames.contains("progression")) {
        db.createObjectStore("progression", { keyPath: "matiere" });
      }
      if (!db.objectStoreNames.contains("learning_plans")) {
        const planStore = db.createObjectStore("learning_plans", {
          keyPath: "id",
        });
        planStore.createIndex("createdAt", "createdAt");
        planStore.createIndex("concept", "concept", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function dbGet<T>(store: string, key: string): Promise<T | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readonly");
    const req = tx.objectStore(store).get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  });
}

async function dbPut(store: string, value: unknown): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).put(value);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function dbDelete(store: string, key: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function dbAll<T>(store: string): Promise<T[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readonly");
    const req = tx.objectStore(store).getAll();
    req.onsuccess = () => resolve(req.result as T[]);
    req.onerror = () => reject(req.error);
  });
}

// ─── Helpers IDs ───
export function makeId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// ─── API publique ───
const PROFIL_ID = "me";

export async function getProfil(): Promise<ProfilEtudiant | undefined> {
  const r = await dbGet<{ id: string } & ProfilEtudiant>("profil", PROFIL_ID);
  if (!r) return undefined;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: _id, ...rest } = r;
  return rest;
}

export async function setProfil(p: ProfilEtudiant): Promise<void> {
  await dbPut("profil", { id: PROFIL_ID, ...p });
}

export async function clearProfil(): Promise<void> {
  await dbDelete("profil", PROFIL_ID);
}

export async function listConversations(): Promise<Conversation[]> {
  const all = await dbAll<Conversation>("conversations");
  return all.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getConversation(id: string): Promise<Conversation | undefined> {
  return dbGet<Conversation>("conversations", id);
}

export async function saveConversation(c: Conversation): Promise<void> {
  await dbPut("conversations", { ...c, updatedAt: new Date().toISOString() });
}

export async function deleteConversation(id: string): Promise<void> {
  await dbDelete("conversations", id);
}

export async function getProgression(matiere: string): Promise<Progression | undefined> {
  return dbGet<Progression>("progression", matiere);
}

export async function updateProgression(p: Progression): Promise<void> {
  await dbPut("progression", { ...p, derniereActivite: new Date().toISOString() });
}

// ─── Parseur <topics>...</topics> ───
// L'IA ajoute une ligne discrète <topics>c1,c2,c3</topics> à la fin de
// chaque réponse. On l'extrait ici pour alimenter la progression.
const TOPICS_REGEX = /<topics>([\s\S]*?)<\/topics>/i;

export function extractTopics(content: string): string[] {
  const match = content.match(TOPICS_REGEX);
  if (!match) return [];
  return match[1]
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t.length > 0 && t.length < 40);
}

/** Retire la ligne <topics>...</topics> du contenu avant affichage. */
export function stripTopics(content: string): string {
  return content.replace(TOPICS_REGEX, "").trimEnd();
}

/**
 * Met à jour la progression d'une matière à partir des topics détectés.
 * - Un topic nouveau → "en_cours"
 * - Un topic déjà vu → "acquis"
 */
export async function recordTopics(
  matiere: string,
  topics: string[]
): Promise<Progression | undefined> {
  if (topics.length === 0) return undefined;
  const existing =
    (await getProgression(matiere)) ?? {
      matiere,
      concepts: {},
      derniereActivite: new Date().toISOString(),
    };
  const concepts = { ...existing.concepts };
  for (const t of topics) {
    if (concepts[t] === "acquis") continue;
    concepts[t] = concepts[t] === "en_cours" ? "acquis" : "en_cours";
  }
  const updated: Progression = { ...existing, concepts };
  await updateProgression(updated);
  return updated;
}

// ─── Plans d'apprentissage (store "learning_plans") ───

/** Liste tous les plans d'apprentissage, triés du plus récent au plus ancien. */
export async function listLearningPlans(): Promise<LearningPlan[]> {
  const all = await dbAll<LearningPlan>("learning_plans");
  return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Récupère un plan par son id. */
export async function getLearningPlan(
  id: string
): Promise<LearningPlan | undefined> {
  return dbGet<LearningPlan>("learning_plans", id);
}

/** Crée un plan à partir d'un LearningPlanDraft généré par l'IA.
 *  Attribue les IDs p1.sous1, etc., et enregistre en IndexedDB. */
export async function createLearningPlan(
  draft: LearningPlanDraft,
  conversationId?: string
): Promise<LearningPlan> {
  const now = new Date().toISOString();
  const points = draft.points.map((p, i) => ({
    id: `p${i + 1}`,
    titre: p.titre,
    description: p.description,
    sousPoints: p.sousPoints.map((sp, j) => ({
      id: `p${i + 1}.${j + 1}`,
      titre: sp.titre,
      questionInitiale: sp.questionInitiale,
      statut: "a_venir" as const,
    })),
  }));
  const plan: LearningPlan = {
    id: makeId(),
    concept: draft.concept,
    matiere: draft.matiere,
    objectif: draft.objectif,
    points,
    statut: "actif",
    conversationId,
    createdAt: now,
    updatedAt: now,
  };
  await dbPut("learning_plans", plan);
  return plan;
}

/** Met à jour un plan (utilisé pour les statuts de sous-points). */
export async function saveLearningPlan(plan: LearningPlan): Promise<void> {
  const updated = { ...plan, updatedAt: new Date().toISOString() };
  await dbPut("learning_plans", updated);
}

/** Supprime un plan. */
export async function deleteLearningPlan(id: string): Promise<void> {
  await dbDelete("learning_plans", id);
}

/** Récupère tous les plans actifs (non terminés). */
export async function listActiveLearningPlans(): Promise<LearningPlan[]> {
  const all = await listLearningPlans();
  return all.filter((p) => p.statut !== "complete");
}

// ─── Hooks React ───
export function useProfil(): {
  profil: ProfilEtudiant | undefined;
  setProfil: (p: ProfilEtudiant) => Promise<void>;
  clearProfil: () => Promise<void>;
  ready: boolean;
} {
  const [profil, setProfilState] = useState<ProfilEtudiant | undefined>();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    getProfil().then((p) => {
      setProfilState(p);
      setReady(true);
    });
  }, []);

  const setProfilFn = useCallback(async (p: ProfilEtudiant) => {
    await setProfil(p);
    setProfilState(p);
  }, []);

  const clearProfilFn = useCallback(async () => {
    await clearProfil();
    setProfilState(undefined);
  }, []);

  return { profil, setProfil: setProfilFn, clearProfil: clearProfilFn, ready };
}