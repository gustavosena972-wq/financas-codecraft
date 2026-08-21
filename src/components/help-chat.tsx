"use client";

import { useState } from "react";
import { helpReply } from "@/lib/help-bot";
import { PIX_KEY, whatsappLink } from "@/lib/pix";

type Msg = { from: "user" | "bot"; body: string; human?: boolean };

export function HelpChat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([
    {
      from: "bot",
      body: "Oi. Eu respondo o básico: planilha, planos e PIX. Pagamento, comprovante e caso estranho vai para uma pessoa da CodeCraft.",
    },
  ]);

  function send() {
    const text = input.trim();
    if (!text) return;
    const reply = helpReply(text);
    setMessages((current) => [
      ...current,
      { from: "user", body: text },
      { from: "bot", body: reply.body, human: reply.human },
    ]);
    setInput("");
  }

  return (
    <div className="card p-5 space-y-4">
      <div className="space-y-3 max-h-[420px] overflow-y-auto">
        {messages.map((msg, i) => (
          <div key={`${msg.from}-${i}`} className={msg.from === "user" ? "text-right" : ""}>
            <div
              className={`inline-block max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                msg.from === "user" ? "bg-panel text-white" : "bg-bg-2"
              }`}
            >
              {msg.body}
            </div>
            {msg.human ? (
              <div className="text-xs text-muted mt-1">
                <a className="underline" href={whatsappLink(messages.filter((m) => m.from === "user").at(-1)?.body)}>
                  Continuar com uma pessoa no WhatsApp
                </a>
              </div>
            ) : null}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 rounded-lg border border-line bg-white px-3 py-2 text-sm"
          value={input}
          placeholder="Pergunte aqui. Não envie senha."
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") send();
          }}
        />
        <button className="btn btn-primary" type="button" onClick={send}>
          Enviar
        </button>
      </div>
      <p className="text-xs text-muted">PIX da compra: {PIX_KEY}. O chat não muda plano nem saldo sozinho.</p>
    </div>
  );
}
