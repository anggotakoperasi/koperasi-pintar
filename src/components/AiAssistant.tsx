"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Bot, Send, Loader2, Sparkles, X } from "lucide-react";

const GREETINGS = [
  "Selamat datang, Bapak/Ibu. Ada yang bisa saya bantu mengenai platform Koperasi Pintar?",
  "Salam sejahtera. Silakan ajukan pertanyaan seputar fitur dan layanan Koperasi Pintar.",
  "Selamat bertugas. Saya siap membantu Anda memahami seluruh fitur platform ini.",
  "Halo, terima kasih telah menggunakan Koperasi Pintar. Apa yang ingin Anda ketahui?",
  "Selamat datang kembali. Silakan sampaikan pertanyaan Anda mengenai sistem koperasi.",
  "Salam hormat. Saya Asisten Koperasi Pintar, siap membantu Anda kapan saja.",
  "Selamat pagi/siang/sore. Butuh panduan menggunakan platform? Saya siap membantu.",
  "Apa kabar, Bapak/Ibu? Mari saya bantu menjelajahi fitur Koperasi Pintar.",
];

const SUGGESTIONS = [
  "Apa saja fitur utama Koperasi Pintar?",
  "Bagaimana cara menambah anggota baru?",
  "Jelaskan tentang menu Daftar Potongan",
  "Cara mencetak laporan anggota",
  "Apa itu SHU dan bagaimana cara kerjanya?",
  "Bagaimana sistem keamanan login?",
];

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function AiAssistant() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const greeting = useMemo(() => GREETINGS[Math.floor(Math.random() * GREETINGS.length)], []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;

    setInput("");
    setExpanded(true);
    setMessages((prev) => [...prev, { role: "user", content: msg }]);
    setLoading(true);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply || "Maaf, terjadi kesalahan." }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Maaf, tidak dapat terhubung ke server. Silakan coba lagi." }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatContent = (text: string) => {
    return text.replace(/\*\*(.*?)\*\*/g, '<strong class="text-accent-400">$1</strong>').replace(/\n/g, "<br/>");
  };

  return (
    <div className="bg-navy-900/80 rounded-2xl border border-navy-700/30 overflow-hidden">
      <div className="p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-500/30 to-purple-500/30 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-accent-400" />
          </div>
          <div>
            <p className="text-xs font-semibold text-accent-400 uppercase tracking-wider">Asisten Koperasi Pintar</p>
            <p className="text-sm text-white">{greeting}</p>
          </div>
        </div>

        {!expanded && messages.length === 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {SUGGESTIONS.slice(0, 4).map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => sendMessage(s)}
                className="text-xs bg-navy-800 hover:bg-navy-700 text-navy-200 border border-navy-700/50 rounded-xl px-3 py-1.5 transition-colors cursor-pointer"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {expanded && messages.length > 0 && (
          <div className="mb-3 max-h-[40vh] overflow-y-auto space-y-3 pr-1">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-xl px-4 py-2.5 text-sm ${
                  msg.role === "user"
                    ? "bg-accent-500/20 text-white border border-accent-500/30"
                    : "bg-navy-800/80 text-navy-100 border border-navy-700/30"
                }`}>
                  {msg.role === "assistant" && (
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Bot className="w-3.5 h-3.5 text-accent-400" />
                      <span className="text-[10px] font-semibold text-accent-400 uppercase">Asisten AI</span>
                    </div>
                  )}
                  <div dangerouslySetInnerHTML={{ __html: formatContent(msg.content) }} />
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-navy-800/80 border border-navy-700/30 rounded-xl px-4 py-3 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-accent-400 animate-spin" />
                  <span className="text-xs text-navy-400">Memproses jawaban...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        )}

        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center bg-navy-800 border border-navy-700/50 rounded-xl px-3 py-2.5 gap-2 focus-within:border-accent-500/50 transition-colors">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => { if (messages.length > 0) setExpanded(true); }}
              placeholder="Tanyakan seputar fitur Koperasi Pintar..."
              className="flex-1 bg-transparent text-sm text-white placeholder-navy-500 outline-none"
              disabled={loading}
            />
            {loading && <Loader2 className="w-4 h-4 text-accent-400 animate-spin shrink-0" />}
          </div>
          <button
            type="button"
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="p-2.5 bg-accent-500 hover:bg-accent-600 disabled:bg-navy-700 disabled:text-navy-500 text-white rounded-xl transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
          {expanded && messages.length > 0 && (
            <button
              type="button"
              onClick={() => { setMessages([]); setExpanded(false); }}
              className="p-2.5 bg-navy-700 hover:bg-navy-600 text-navy-300 hover:text-white rounded-xl transition-colors cursor-pointer"
              title="Hapus percakapan"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
