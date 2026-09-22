"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  type Conversation,
  type Message,
} from "@/lib/store";

export default function ChatPage() {
  const router = useRouter();
  const { profil, ready, clearProfil } = useProfil();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ── Redirect si pas de profil ──
  useEffect(() => {
    if (ready && !profil) router.push("/onboarding");
  }, [ready, profil, router]);

  // ── Charger les conversations au montage ──
  const refreshConversations = useCallback(async () => {
    const list = await listConversations();
    setConversations(list);
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
  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
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
              }
            } catch {
              /* ignore */
            }
          }
        }
      }

      const assistantMessage: Message = {
              id: makeId(),
              role: "assistant",
              content: stripTopics(fullContent),
              createdAt: new Date().toISOString(),
              topics: extractTopics(fullContent),
            };
            setMessages([...updatedMessages, assistantMessage]);
            setStreamingContent("");

            // Mise à jour de la progression (silencieuse, ne bloque pas l'UI)
            if (assistantMessage.topics && assistantMessage.topics.length > 0) {
              recordTopics(profil.matierePreferee, assistantMessage.topics).catch(
                (e) => console.error("Progression non mise à jour:", e)
              );
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

  return (
    <main className="flex h-screen">
      {/* ── Sidebar conversations ── */}
      <aside className="w-64 border-r border-gray-200 bg-white flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <a href="/" className="text-lg font-bold text-panthere-dark">
            🐆 Panthère
          </a>
          <p className="text-xs text-gray-500 mt-1 truncate">
                      {profil.prenom} · {profil.pays}
                    </p>
        </div>

        <button
          onClick={handleNewConversation}
          className="m-3 px-3 py-2 bg-panthere-green text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors"
        >
          + Nouvelle conversation
        </button>

        <div className="flex-1 overflow-y-auto px-2">
          {conversations.length === 0 ? (
            <p className="text-xs text-gray-400 text-center mt-8 px-2">
              Aucune conversation. Clique sur "Nouvelle conversation" pour commencer.
            </p>
          ) : (
            conversations.map((c) => (
              <div
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className={`group flex items-center justify-between px-3 py-2 mb-1 rounded-lg cursor-pointer text-sm ${
                  c.id === activeId
                    ? "bg-panthere-gold/10 text-panthere-dark font-medium"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
              >
                <span className="truncate flex-1">{c.titre}</span>
                <button
                  onClick={(e) => handleDelete(c.id, e)}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity ml-2"
                  title="Supprimer"
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>

        <div className="p-3 border-t border-gray-200 text-xs space-y-2">
                  <Link
                    href="/progress"
                    className="block text-panthere-dark hover:text-panthere-green transition-colors"
                  >
                    📈 Voir ma progression
                  </Link>
                  <button
                    onClick={handleResetProfil}
                    className="block text-gray-400 hover:text-red-500 transition-colors"
                  >
                    ↺ Recommencer (changer profil)
                  </button>
                </div>
      </aside>

      {/* ── Zone principale ── */}
      <section className="flex-1 flex flex-col max-w-4xl">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-panthere-dark truncate">
                          {conversations.find((c) => c.id === activeId)?.titre ??
                            "Nouvelle conversation"}
                        </span>
            <span className="text-xs bg-panthere-gold/20 text-panthere-gold px-2 py-0.5 rounded-full font-medium">
              socratique
            </span>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 chat-scroll">
          {messages.length === 0 && !streamingContent && (
            <div className="text-center text-gray-400 mt-12">
              <p className="text-lg mb-2">🐆 Bienvenue {profil.prenom}</p>
              <p className="text-sm">
                Pose une question sur un exercice ou un concept.
                <br />
                Je te guiderai sans te donner la réponse toute faite.
              </p>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-3 whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-panthere-green text-white"
                    : "bg-white border border-gray-200 text-gray-800"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {streamingContent && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-lg px-4 py-3 bg-white border border-gray-200 text-gray-800 whitespace-pre-wrap">
                {streamingContent}
                <span className="cursor-blink">▊</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-gray-200 bg-white p-4">
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pose ta question ici..."
              className="flex-1 resize-none rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:border-panthere-gold transition-colors"
              rows={1}
              disabled={isLoading || !activeId}
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !input.trim() || !activeId}
              className="bg-panthere-gold text-white px-4 py-3 rounded-lg font-semibold hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors self-end"
            >
              {isLoading ? "..." : "Envoyer"}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">
            Panthère ne donne jamais la réponse directe — il te guide pour apprendre.
          </p>
        </div>
      </section>
    </main>
  );
}