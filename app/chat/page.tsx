"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Send,
  TrendingUp,
  RotateCcw,
  LogOut,
} from "lucide-react";
import {
  Badge,
  Button,
  ConversationItem,
  IconButton,
  Logo,
  MessageBubble,
  PlanProposal,
  Skeleton,
  ThinkingIndicator,
} from "@/components/ui";
import {
  useProfil,
  makeId,
  listConversations,
  getConversation,
  saveConversation,
  deleteConversation,
  extractTopics,
  stripTopics,
  recordTopics,
  listActiveLearningPlans,
  createLearningPlan,
  saveLearningPlan,
  type Conversation,
  type Message,
} from "@/lib/store";
import type {
  LearningPlan,
  LearningPlanDraft,
} from "@/lib/learning-plan/types";
import {
  extractPlanProposal,
  extractProgressMark,
  stripPlanMarkers,
} from "@/lib/learning-plan/markers";

export default function ChatPage() {
  const router = useRouter();
  const { profil, ready, clearProfil } = useProfil();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [streamingStartedAt, setStreamingStartedAt] = useState<number | null>(null);
  const [firstTokenAt, setFirstTokenAt] = useState<number | null>(null);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [activePlans, setActivePlans] = useState<LearningPlan[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ── Redirect si pas de profil ──
  useEffect(() => {
    if (ready && !profil) router.push("/onboarding");
  }, [ready, profil, router]);

  // ── Charger les plans actifs ──
  const refreshActivePlans = useCallback(async () => {
    const list = await listActiveLearningPlans();
    setActivePlans(list);
    return list;
  }, []);

  useEffect(() => {
    if (!profil) return;
    refreshActivePlans();
  }, [profil, refreshActivePlans]);

  // ── Charger les conversations au montage ──
  const refreshConversations = useCallback(async () => {
    const list = await listConversations();
    setConversations(list);
    setConversationsLoading(false);
    return list;
  }, []);

  useEffect(() => {
    if (!profil) return;
    refreshConversations().then((list) => {
      if (list.length > 0 && !activeId) {
        setActiveId(list[0].id);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profil]);

  // ── Charger la conversation active ──
  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }
    getConversation(activeId).then((c) => {
      if (c) setMessages(c.messages);
    });
  }, [activeId]);

  // ── Sauvegarder après chaque modif de messages ──
  useEffect(() => {
    if (!activeId || messages.length === 0) return;
    const conv = conversations.find((c) => c.id === activeId);
    if (!conv) return;
    saveConversation({ ...conv, messages });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, activeId]);

  // ── Scroll auto ──
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);
  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, scrollToBottom]);

  // ── Auto-resize textarea ──
  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = `${Math.min(
      textareaRef.current.scrollHeight,
      160
    )}px`;
  }, [input]);

  // ── Nouvelle conversation ──
  const handleNewConversation = async () => {
    if (!profil) return;
    const newConv: Conversation = {
      id: makeId(),
      titre: "Nouvelle conversation",
      matiere: profil.matierePreferee,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    };
    await saveConversation(newConv);
    const list = await refreshConversations();
    setConversations(list);
    setActiveId(newConv.id);
    setMessages([]);
  };

  // ── Supprimer une conversation ──
  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirm("Supprimer cette conversation ?")) return;
    await deleteConversation(id);
    const list = await refreshConversations();
    setConversations(list);
    if (activeId === id) {
      setActiveId(list[0]?.id ?? null);
      setMessages([]);
    }
  };

  // ── Titre auto depuis le 1er message ──
  const updateTitleIfNeeded = useCallback(
    async (firstUserMsg: string) => {
      if (!activeId) return;
      const conv = conversations.find((c) => c.id === activeId);
      if (!conv || conv.titre !== "Nouvelle conversation") return;
      const title = firstUserMsg.slice(0, 40).trim();
      await saveConversation({ ...conv, titre: title });
      const list = await refreshConversations();
      setConversations(list);
    },
    [activeId, conversations, refreshConversations]
  );

  // ── Accepter une proposition de plan ──
  const handleAcceptPlan = async (
    pseudo: LearningPlan & { draft?: LearningPlanDraft }
  ) => {
    if (!pseudo.draft) return;
    const plan = await createLearningPlan(pseudo.draft, activeId ?? undefined);
    await refreshActivePlans();
    const systemMsg: Message = {
      id: makeId(),
      role: "assistant",
      content: `Plan créé pour « ${plan.concept} ». Tu le retrouveras dans ta progression, et on l'avancera ensemble au fil de la discussion.`,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, systemMsg]);
    setMessages((prev) =>
      prev.map((m) =>
        m.planProposal === pseudo.concept
          ? { ...m, planProposal: undefined, content: m.content + " [✓]" }
          : m
      )
    );
  };

  // ── Refuser une proposition ──
  const handleDismissPlan = (concept: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.planProposal === concept
          ? { ...m, planProposal: undefined, content: m.content + " [✕]" }
          : m
      )
    );
  };

  // ── Envoyer un message ──
  const sendMessage = async () => {
    if (!input.trim() || isLoading || !profil || !activeId) return;

    const userMessage: Message = {
      id: makeId(),
      role: "user",
      content: input,
      createdAt: new Date().toISOString(),
    };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);
    setStreamingContent("");
    setStreamingStartedAt(Date.now());
    setFirstTokenAt(null);
    updateTitleIfNeeded(userMessage.content);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          history: updatedMessages.slice(-20).map((m) => ({
            role: m.role,
            content: m.content,
          })),
          profile: {
            prenom: profil.prenom,
            pays: profil.pays,
            ville: profil.ville,
            niveau: profil.niveau,
            langue: profil.langue,
            matierePreferee: profil.matierePreferee,
          },
          activePlans: activePlans.map((p) => ({
            id: p.id,
            concept: p.concept,
            points: p.points,
          })),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la requête");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("Pas de flux de réponse");

      const decoder = new TextDecoder();
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.type === "text" && parsed.content) {
                fullContent += parsed.content;
                setStreamingContent(fullContent);
                // 1er token arrivé : on masque le thinking.
                if (firstTokenAt === null) {
                  setFirstTokenAt(Date.now());
                }
              }
            } catch {
              /* ignore */
            }
          }
        }
      }

      // ── Extraction des marqueurs ──
      const displayContent = stripPlanMarkers(fullContent);
      const planProposal = extractPlanProposal(fullContent);
      const progressMark = extractProgressMark(fullContent);
      const topics = extractTopics(fullContent);

      const assistantMessage: Message = {
        id: makeId(),
        role: "assistant",
        content: displayContent,
        createdAt: new Date().toISOString(),
        topics: topics.length ? topics : undefined,
        planProposal: planProposal ?? undefined,
        progress: progressMark ?? undefined,
      };
      setMessages([...updatedMessages, assistantMessage]);
      setStreamingContent("");
      setStreamingStartedAt(null);
      setFirstTokenAt(null);

      // ── Mise à jour progression (topics) ──
      if (topics.length > 0) {
        recordTopics(profil.matierePreferee, topics).catch((e) =>
          console.error("Progression non mise à jour:", e)
        );
      }

      // ── Application du marqueur [PROGRESS:] ──
      if (progressMark) {
        const targetPlan = activePlans.find((p) => p.id === progressMark.planId);
        if (targetPlan) {
          const newPlan: LearningPlan = {
            ...targetPlan,
            points: targetPlan.points.map((p) => ({
              ...p,
              sousPoints: p.sousPoints.map((sp) =>
                sp.id === progressMark.sousPointId
                  ? {
                      ...sp,
                      statut: "termine" as const,
                      termineAt: new Date().toISOString(),
                    }
                  : sp
              ),
            })),
          };
          const allDone = newPlan.points.every((p) =>
            p.sousPoints.every((sp) => sp.statut === "termine")
          );
          if (allDone) {
            newPlan.statut = "complete";
          }
          await saveLearningPlan(newPlan);
          await refreshActivePlans();
        }
      }
    } catch (error) {
      console.error("Erreur chat:", error);
      const errorMessage: Message = {
        id: makeId(),
        role: "assistant",
        content:
          "Désolé, une erreur s'est produite. Vérifie ta connexion et réessaie.",
        createdAt: new Date().toISOString(),
      };
      setMessages([...updatedMessages, errorMessage]);
    } finally {
      setIsLoading(false);
      setStreamingStartedAt(null);
      setFirstTokenAt(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleResetProfil = async () => {
    if (!confirm("Effacer ton profil ? Toutes tes conversations seront perdues."))
      return;
    await clearProfil();
    router.push("/onboarding");
  };

  if (!profil) return null;

  const activeConv = conversations.find((c) => c.id === activeId);
  const canSend = !isLoading && input.trim().length > 0 && !!activeId;

  const recentContext = messages
    .slice(-6)
    .map((m) => `${m.role === "user" ? "Étudiant" : "Panthère"}: ${m.content}`)
    .join("\n");

  return (
    <main className="flex h-screen overflow-hidden">
      {/* ── Sidebar ── */}
      <aside className="w-72 shrink-0 border-r border-border-warm bg-surface-sunk flex flex-col">
        <div className="px-5 pt-5 pb-4 border-b border-border-warm">
          <Link href="/" className="inline-block">
            <Logo />
          </Link>
          <div className="mt-3 flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-forest text-white text-[10px] font-semibold flex items-center justify-center">
              {profil.prenom.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-medium text-ink truncate">
                {profil.prenom}
              </div>
              <div className="text-[11px] text-muted truncate">
                {profil.ville || profil.pays}
              </div>
            </div>
          </div>
        </div>

        {activePlans.length > 0 && (
          <div className="px-3 pt-3">
            <Link
              href="/progress"
              className="block bg-forest-soft border border-forest/15 rounded-md px-3 py-2 hover:border-forest/30 transition-colors"
            >
              <div className="flex items-center gap-1.5 text-[11px] text-forest font-medium mb-1">
                <TrendingUp size={11} strokeWidth={2} />
                {activePlans.length} plan{activePlans.length > 1 ? "s" : ""} actif{activePlans.length > 1 ? "s" : ""}
              </div>
              <div className="text-[11.5px] text-ink truncate capitalize">
                {activePlans[0].concept}
              </div>
            </Link>
          </div>
        )}

        <div className="p-3">
          <Button
            variant="secondary"
            fullWidth
            size="md"
            onClick={handleNewConversation}
          >
            <Plus size={14} strokeWidth={2.25} />
            Nouvelle conversation
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto chat-scroll px-2 pb-2">
          {conversationsLoading ? (
            <div className="space-y-1.5 px-1">
              <Skeleton className="h-8" />
              <Skeleton className="h-8" />
              <Skeleton className="h-8" />
            </div>
          ) : conversations.length === 0 ? (
            <p className="text-[12px] text-muted text-center mt-8 px-3 leading-relaxed">
              Aucune conversation. Crée-en une pour commencer.
            </p>
          ) : (
            <div className="space-y-0.5 stagger">
              {conversations.map((c) => (
                <ConversationItem
                  key={c.id}
                  titre={c.titre}
                  active={c.id === activeId}
                  onClick={() => setActiveId(c.id)}
                  onDelete={() => handleDelete(c.id)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="px-3 py-3 border-t border-border-warm space-y-0.5">
          <Link
            href="/progress"
            className="flex items-center gap-2 px-3 py-2 rounded-md text-[13px] text-muted hover:bg-surface hover:text-ink transition-colors"
          >
            <TrendingUp size={14} strokeWidth={1.75} />
            Ma progression
          </Link>
          <button
            onClick={handleResetProfil}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-[13px] text-muted hover:bg-surface hover:text-ink transition-colors text-left"
          >
            <RotateCcw size={14} strokeWidth={1.75} />
            Changer de profil
          </button>
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 rounded-md text-[13px] text-muted hover:bg-surface hover:text-ink transition-colors"
          >
            <LogOut size={14} strokeWidth={1.75} />
            Accueil
          </Link>
        </div>
      </aside>

      {/* ── Zone principale ── */}
      <section className="flex-1 flex flex-col min-w-0 bg-bg">
        <header className="px-6 py-4 border-b border-border-warm bg-surface flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="font-display text-[16px] font-medium text-ink truncate">
                {activeConv?.titre ?? "Nouvelle conversation"}
              </h2>
              <Badge tone="gold">socratique</Badge>
            </div>
            {activeConv && messages.length > 0 && (
              <p className="text-[11px] text-muted-soft mt-0.5">
                {messages.length} message{messages.length > 1 ? "s" : ""}
              </p>
            )}
          </div>
          <IconButton
            onClick={() => router.push("/")}
            aria-label="Retour à l'accueil"
          >
            <ArrowLeft size={16} strokeWidth={1.75} />
          </IconButton>
        </header>

        <div className="flex-1 overflow-y-auto chat-scroll px-4 sm:px-6 py-6">
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.length === 0 && !streamingContent && (
              <EmptyChat prenom={profil.prenom} />
            )}

            <div className="space-y-4 stagger">
              {messages.map((msg) => (
                <div key={msg.id}>
                  <MessageBubble role={msg.role} content={msg.content} />
                  {msg.role === "assistant" && msg.planProposal && (
                    <PlanProposal
                      concept={msg.planProposal}
                      profil={{
                        prenom: profil.prenom,
                        pays: profil.pays,
                        niveau: profil.niveau,
                        matierePreferee: profil.matierePreferee,
                      }}
                      recentContext={recentContext}
                      onAccept={handleAcceptPlan}
                      onDismiss={() => handleDismissPlan(msg.planProposal!)}
                    />
                  )}
                </div>
              ))}
            </div>

            {streamingContent && (
              <MessageBubble
                role="assistant"
                content={stripPlanMarkers(streamingContent)}
                streaming
              />
            )}

            {isLoading && !streamingContent && (
              <ThinkingIndicator
                streamingStartedAt={streamingStartedAt}
                firstTokenAt={firstTokenAt}
              />
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="border-t border-border-warm bg-surface px-4 sm:px-6 py-4">
          <div className="max-w-3xl mx-auto">
            <div
              className={`flex items-end gap-2 bg-surface border rounded-lg transition-all duration-200 ease-out-soft ${
                input ? "border-ink/20 shadow-sm" : "border-border"
              }`}
            >
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Pose ta question ici…"
                rows={1}
                disabled={isLoading || !activeId}
                className="flex-1 resize-none bg-transparent text-ink placeholder:text-muted-soft text-[14.5px] leading-relaxed px-4 py-3 focus:outline-none disabled:opacity-50"
              />
              <button
                onClick={sendMessage}
                disabled={!canSend}
                aria-label="Envoyer"
                className={`shrink-0 m-1.5 h-9 w-9 rounded-md flex items-center justify-center transition-all duration-200 ease-out-soft ${
                  canSend
                    ? "bg-forest text-white hover:bg-forest-hover shadow-xs"
                    : "bg-bg text-muted-soft cursor-not-allowed"
                }`}
              >
                {isLoading ? (
                  <span className="block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send size={15} strokeWidth={2.25} />
                )}
              </button>
            </div>
            <p className="text-[11.5px] text-muted-soft text-center mt-2">
              Panthère ne donne jamais la réponse — il te guide pour apprendre.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

function EmptyChat({ prenom }: { prenom: string }) {
  const EXEMPLES = [
    "Explique-moi le théorème de Thalès",
    "Comment résoudre une équation du second degré ?",
    "Aide-moi à factoriser x² − 5x + 6",
  ];
  return (
    <div className="text-center pt-12 pb-4 animate-fade-in">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-surface border border-border mb-4">
        <Logo variant="compact" />
      </div>
      <h3 className="font-display text-xl font-medium text-ink">
        Bienvenue {prenom}.
      </h3>
      <p className="text-[14px] text-muted mt-1.5 max-w-sm mx-auto leading-relaxed">
        Pose une question sur un exercice ou un concept. Je te guiderai sans te
        donner la réponse toute faite.
      </p>

      <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
        {EXEMPLES.map((ex) => (
          <span
            key={ex}
            className="text-[12.5px] text-muted bg-surface border border-border rounded-full px-3 py-1.5"
          >
            {ex}
          </span>
        ))}
      </div>
    </div>
  );
}