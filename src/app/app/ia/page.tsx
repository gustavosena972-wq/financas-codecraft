"use client";

import { useEffect, useRef, useState } from "react";
import { PageHead } from "@/components/shell";
import { requireSession, setAutopilot, type Snapshot } from "@/lib/store";
import { replyTo, runAutopilot } from "@/lib/pilot";
import { useLive } from "@/lib/live";
import { go } from "@/lib/types";

type Msg = { from: "you" | "ia"; body: string };

export default function IaPage() {
  const live = useLive();
  const [data, setData] = useState<Snapshot | null>(null);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      from: "ia",
      body: "Eu sou a IA do Finanças CodeCraft. Olho pessoas, venda, projeto, caixa e estoque. 95% eu resolvo com tarefa. Os 5% — pagar e demitir — você confirma.",
    },
  ]);
  const log = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void (async () => {
      const session = await requireSession();
      if (!session) {
        go("/login");
        return;
      }
      setData(session);
      await runAutopilot(session);
    })();
  }, [live]);

  useEffect(() => {
    log.current?.scrollTo({ top: log.current.scrollHeight, behavior: "smooth" });
  }, [msgs]);

  if (!data) return null;

  return (
    <div className="space-y-6">
      <PageHead
        kicker="Cérebro"
        title="IA autônoma"
        subtitle="Pergunta em português. Ela lê a empresa de verdade. Dinheiro não sai daqui."
        extra={
          <button className="pilot" type="button" onClick={() => void setAutopilot(!data.org.autopilot)}>
            <i className="dot" />
            {data.org.autopilot ? "95% no automático" : "Pausada"}
          </button>
        }
      />
      <div className="card overflow-hidden">
        <div ref={log} className="p-5 space-y-3 max-h-[480px] overflow-auto">
          {msgs.map((msg, i) => (
            <div
              key={i}
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                msg.from === "you" ? "ml-auto bg-ink text-white" : "bg-bg-2"
              }`}
            >
              {msg.body}
            </div>
          ))}
        </div>
        <form
          className="flex gap-2 p-4 border-t border-line"
          onSubmit={(event) => {
            event.preventDefault();
            const text = input.trim();
            if (!text) return;
            setMsgs((current) => [...current, { from: "you", body: text }, { from: "ia", body: replyTo(text, data) }]);
            setInput("");
          }}
        >
          <input
            className="flex-1 rounded-xl border border-line px-3 py-2"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Como está a empresa hoje?"
          />
          <button className="btn btn-primary">Enviar</button>
        </form>
      </div>
      <ul className="space-y-2">
        {data.logs.slice(0, 8).map((item) => (
          <li key={item.id} className="card p-4">
            <span className={`chip ${item.kind === "done" ? "ok" : item.kind === "ask" ? "warn" : ""}`}>
              {item.kind === "done" ? "fez sozinha" : item.kind === "ask" ? "precisa de você" : "observou"}
            </span>
            <strong className="ml-2 text-sm">{item.title}</strong>
            <p className="text-sm text-muted mt-1">{item.body}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
