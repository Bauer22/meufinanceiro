"use client";
import { useEffect, useRef, useState } from "react";
import { Send, Bot, User } from "lucide-react";

type Msg = { sender: "bot" | "user"; text: string };

export default function ChatExpense() {
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { sender: "bot", text: "Olá! Digite seu gasto ou receita de forma natural (ex: “Gastei 45 no mercado hoje”)." },
  ]);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;
    setMessages((m) => [...m, { sender: "user", text }]);
    setInput("");
    setSending(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      setMessages((m) => [...m, { sender: "bot", text: data.reply ?? "Erro ao salvar. Tente novamente." }]);
    } catch {
      setMessages((m) => [...m, { sender: "bot", text: "Erro de conexão. Tente novamente." }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-[calc(100vh-60px)] max-w-2xl flex-col p-4">
      <h1 className="mb-4 flex items-center gap-2 text-xl font-bold">
        <Bot className="text-emerald-500" /> Assistente de lançamentos
      </h1>

      <div className="mb-4 max-h-[70vh] flex-1 space-y-4 overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 p-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
            {msg.sender === "bot" && <Bot className="h-8 w-8 shrink-0 rounded-full bg-slate-800 p-1 text-emerald-400" />}
            <div className={`max-w-[80%] rounded-2xl p-3 ${msg.sender === "user" ? "bg-emerald-700 text-white" : "bg-slate-800 text-slate-200"}`}>
              {msg.text}
            </div>
            {msg.sender === "user" && <User className="h-8 w-8 shrink-0 rounded-full bg-slate-800 p-1 text-blue-400" />}
          </div>
        ))}
        <div ref={bottom} />
      </div>

      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ex: Gastei 120 em combustível, ou Comprei tênis 300 em 3x"
          aria-label="Mensagem"
          className="flex-1 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-slate-100 focus:border-emerald-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={sending}
          aria-label="Enviar"
          className="flex items-center justify-center rounded-xl bg-emerald-600 px-5 transition hover:bg-emerald-500 disabled:opacity-50"
        >
          <Send className="h-5 w-5 text-white" />
        </button>
      </form>
    </main>
  );
}
