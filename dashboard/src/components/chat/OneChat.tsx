"use client";

import React, { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface OneChatProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function OneChat({ isOpen, onClose }: OneChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "👋 Welcome to **OneChat AI**! I am your Small Business Growth Expert.\n\nAsk me anything about **how to grow a small business from scratch**, acquiring your first 10 clients, cold outreach scripts, local SEO, or scaling monthly revenue!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const quickPrompts = [
    "💡 How to get first 10 clients from scratch?",
    "📈 Best zero-budget local marketing strategies?",
    "🚀 How to convert Google Maps leads into $500/mo retainers?",
    "📲 Cold WhatsApp script for local business outreach",
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    const newMessages: Message[] = [...messages, { role: "user", content: text.trim() }];
    setMessages(newMessages);
    if (!textToSend) setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/onechat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await res.json();
      if (data.reply) {
        setMessages([...newMessages, { role: "assistant", content: data.reply }]);
      } else {
        setMessages([
          ...newMessages,
          { role: "assistant", content: "Apologies, I encountered a temporary connection issue. Please try again!" },
        ]);
      }
    } catch (err) {
      console.error("OneChat error:", err);
      setMessages([
        ...newMessages,
        { role: "assistant", content: "Error connecting to OneChat AI. Please check your internet connection." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-lg h-[90vh] border border-outline-variant shadow-2xl flex flex-col overflow-hidden relative">
        
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-primary text-white flex items-center justify-between border-b border-emerald-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center font-bold text-xl shadow-xs">
              🚀
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-base text-white">OneChat AI</h3>
                <span className="px-2 py-0.2 rounded-full bg-white/20 text-[9px] font-bold uppercase tracking-wider">
                  Growth Expert
                </span>
              </div>
              <p className="text-[11px] text-emerald-100 font-medium">
                How to grow small businesses from scratch
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Quick Suggestion Pills */}
        <div className="p-3 bg-slate-50 border-b border-outline-variant/60 flex items-center gap-2 overflow-x-auto text-[11px] font-semibold">
          {quickPrompts.map((qp, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(qp)}
              disabled={loading}
              className="px-3 py-1.5 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-outline-variant rounded-full whitespace-nowrap shadow-2xs transition-all cursor-pointer disabled:opacity-50"
            >
              {qp}
            </button>
          ))}
        </div>

        {/* Messages Body */}
        <div className="p-4 flex-1 overflow-y-auto space-y-4 bg-surface-container-low/40 text-xs">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[85%] p-3.5 rounded-2xl space-y-1 shadow-xs leading-relaxed whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-primary text-white font-medium rounded-br-none"
                    : "bg-white text-on-surface border border-outline-variant/80 rounded-bl-none"
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1 font-bold text-[10px] uppercase opacity-75">
                  <span className="material-symbols-outlined text-xs">
                    {m.role === "user" ? "person" : "forum"}
                  </span>
                  <span>{m.role === "user" ? "You" : "OneChat AI"}</span>
                </div>
                <div>{m.content}</div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-start">
              <div className="p-3 bg-white border border-outline-variant rounded-2xl rounded-bl-none text-xs font-bold text-emerald-700 flex items-center gap-2 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                OneChat is thinking growth strategies...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-3 bg-white border-t border-outline-variant flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask OneChat how to grow your small business..."
            disabled={loading}
            className="flex-1 bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="p-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-lg">send</span>
          </button>
        </form>

      </div>
    </div>
  );
}
