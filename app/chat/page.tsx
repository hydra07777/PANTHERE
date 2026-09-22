"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useLocalStorage } from "@/lib/hooks/use-local-storage";
import type { ChatMessage } from "@/lib/rag/types";

export default function ChatPage() {
  const [messages, setMessages] = useLocalStorage<ChatMessage[]>(
    "panthere_chat_history",
    []
  );
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll automatique vers le bas
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, scrollToBottom]);
const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: "user", content: input };
    const updatedHistory = [...messages, userMessage];
    setMessages(updatedHistory);
    setInput("");
    setIsLoading(true);
    setStreamingContent("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          history: updatedHistory.slice(-20),
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
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.type === "text" && parsed.content) {
                fullContent += parsed.content;
                setStreamingContent(fullContent);
              }
            } catch { /* ignore */ }
          }
        }
      }

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: fullContent,
      };
      setMessages([...updatedHistory, assistantMessage]);
      setStreamingContent("");
    } catch (error) {
      console.error("Erreur chat:", error);
      const errorMessage: ChatMessage = {
        role: "assistant",
        content: "Désolé, une erreur s'est produite. Vérifie ta connexion et réessaie.",
      };
      setMessages([...updatedHistory, errorMessage]);
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

  const clearHistory = () => {
    setMessages([]);
    setStreamingContent("");
  };

  return (
    <main className="flex h-screen flex-col max-w-3xl mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-2">
          <a href="/" className="text-lg font-bold text-panthere-dark">
            Panthère
          </a>
          <span className="text-xs bg-panthere-gold/20 text-panthere-gold px-2 py-0.5 rounded-full font-medium">
            socratique
          </span>
        </div>
        <button
          onClick={clearHistory}
          className="text-sm text-gray-400 hover:text-red-500 transition-colors"
          title="Effacer l'historique"
        >
          ↺ Nouvelle conversation
        </button>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 chat-scroll">
        {messages.length === 0 && !streamingContent && (
          <div className="text-center text-gray-400 mt-12">
            <p className="text-lg mb-2">🐆 Bienvenue sur Panthère</p>
            <p className="text-sm">
              Pose une question sur un exercice ou un concept.
              <br />
              Je te guiderai sans te donner la réponse toute faite.
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
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

        {/* Streaming en cours */}
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
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="bg-panthere-gold text-white px-4 py-3 rounded-lg font-semibold hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors self-end"
          >
            {isLoading ? "..." : "Envoyer"}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center">
          Panthère ne donne jamais la réponse directe — il te guide pour apprendre.
        </p>
      </div>
    </main>
  );
}