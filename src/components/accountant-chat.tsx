"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Paperclip } from "lucide-react";
import { accountantReply, financePulse, type FinancePulse } from "@/lib/accountant";
import { jarvisCompanyReply } from "@/lib/jarvis";
import { addChatSpendsAction } from "@/app/actions/transactions";
import { saveChatBudgetAction } from "@/app/actions/budgets";
import { applyOrganizeAction } from "@/app/actions/import";
import { organizeWorkbook } from "@/lib/organize";
import { listAccounts, listCategories, requireSession } from "@/lib/store";
import { planHasAi } from "@/lib/plans";
import { useLive } from "@/lib/live";
import { TransactionForm } from "@/components/transaction-form";

type Msg = { from: "user" | "bot"; body: string };

const PERSON_STARTERS = [
  "Como está minha situação?",
  "Como foram os meses passados?",
  "Planeja o próximo trimestre",
  "O que cortar?",
];
const COMPANY_STARTERS = ["Como está o caixa?", "DRE do mês", "Títulos em atraso", "Planeja o próximo trimestre"];

export function AccountantChat({ compact = false, studio = false }: { compact?: boolean; studio?: boolean }) {
  const live = useLive();
  const [workspaceId, setWorkspaceId] = useState("");
  const [company, setCompany] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [pulse, setPulse] = useState<FinancePulse | null>(null);
  const [hand, setHand] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [accounts, setAccounts] = useState<{ id: string; name: string }[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string; kind: string }[]>([]);
  const logRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void (async () => {
      const session = await requireSession();
      if (!session) return;
      const id = session.workspace.id;
      setWorkspaceId(id);
      const isCompany = session.workspace.type === "BUSINESS";
      setCompany(isCompany);
      setPulse(financePulse(id));
      setAccounts(listAccounts(id));
      setCategories(listCategories(id));
      setAiEnabled(planHasAi(session.user.plan));
      setMessages((current) =>
        current.length
          ? current
          : [
              {
                from: "bot",
                body: isCompany
                  ? "Contador deste espaço Empresa. Manda a planilha, lança na mão ou pergunta de caixa, DRE e título. Jarvis é no site da CodeCraft. Eu não peço senha."
                  : "Pode mandar a planilha do computador, colocar o mês na mão se ainda não tem nada salvo, ou perguntar qualquer coisa de dinheiro. Eu olho o passado, o próximo trimestre e se a situação está crítica, média ou boa.",
              },
            ],
      );
    })();
  }, [live]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  async function answer(raw: string) {
    let reply: { body: string; spends?: { type: "INCOME" | "EXPENSE"; description: string; amount: number }[]; budget?: { categoryName: string; amount: number } };
    if (company) {
      const spendTry = accountantReply(raw, workspaceId);
      if (spendTry.spends?.length || spendTry.budget) {
        reply = spendTry;
      } else {
        let market: { usd?: number; usdPct?: string; selic?: string } | undefined;
        try {
          const [fx, selic] = await Promise.all([
            fetch("https://economia.awesomeapi.com.br/json/last/USD-BRL").then((r) => r.json()),
            fetch("https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/1?formato=json").then((r) => r.json()),
          ]);
          market = {
            usd: fx?.USDBRL ? Number(fx.USDBRL.bid) : undefined,
            usdPct: fx?.USDBRL?.pctChange,
            selic: selic?.[0]?.valor,
          };
        } catch {
          market = undefined;
        }
        reply = jarvisCompanyReply(raw, workspaceId, market);
      }
    } else {
      reply = accountantReply(raw, workspaceId);
    }
    if (reply.spends?.length) {
      const saved = await addChatSpendsAction(JSON.stringify(reply.spends));
      if (saved.error) return saved.error;
    }
    if (reply.budget) {
      const saved = await saveChatBudgetAction(reply.budget.categoryName, reply.budget.amount);
      if (saved.error) return saved.error;
    }
    setPulse(financePulse(workspaceId));
    return reply.body;
  }

  async function send(text = input) {
    const raw = text.trim();
    if (!raw || busy || !workspaceId) return;
    setInput("");
    setBusy(true);
    setMessages((current) => [...current, { from: "user", body: raw }]);
    const body = await answer(raw);
    setMessages((current) => [...current, { from: "bot", body }]);
    setBusy(false);
  }

  const askedRef = useRef(false);
  useEffect(() => {
    if (!workspaceId || askedRef.current) return;
    const pending = sessionStorage.getItem("fc-ask");
    if (!pending) return;
    askedRef.current = true;
    sessionStorage.removeItem("fc-ask");
    void send(pending);
  }, [workspaceId]);

  async function onFile(file: File) {
    if (!workspaceId || busy) return;
    setBusy(true);
    setMessages((current) => [...current, { from: "user", body: `Mandei a planilha ${file.name}` }]);
    try {
      const organized = await organizeWorkbook(await file.arrayBuffer(), file.name);
      if (organized.error) {
        setMessages((current) => [...current, { from: "bot", body: organized.error ?? "Não consegui ler esse arquivo." }]);
        setBusy(false);
        return;
      }
      const applied = await applyOrganizeAction(JSON.stringify(organized));
      if ("error" in applied && applied.error) {
        setMessages((current) => [...current, { from: "bot", body: applied.error ?? "A planilha não entrou no controle." }]);
        setBusy(false);
        return;
      }
      const body = await answer("Analisa o que entrou, revisa os meses passados, diz se a situação está crítica média ou boa e planeja o próximo trimestre para baixar gasto.");
      const saved = "ok" in applied ? applied.ok : "Planilha no controle.";
      setMessages((current) => [...current, { from: "bot", body: `${saved} ${body}` }]);
    } catch {
      setMessages((current) => [...current, { from: "bot", body: "Não consegui abrir esse arquivo. Manda Excel ou CSV." }]);
    }
    setBusy(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  const starters = company ? COMPANY_STARTERS : PERSON_STARTERS;
  const empty = messages.length <= 1;

  return (
    <section className={`acct-chat ${studio ? "studio" : "card"} ${compact ? "compact" : ""} ${hand ? "with-hand" : ""}`}>
      {studio ? (
        <header className="claude-top">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-gold font-semibold">{company ? "Empresa" : "Contador"}</p>
            <h1 className="font-semibold text-lg mt-0.5">Finanças</h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <Link href="/app/ferramentas" className="text-sm text-muted">
              Ferramentas
            </Link>
            <Link href="/app/educacao" className="text-sm text-muted">
              Educação
            </Link>
            {pulse ? (
              <span className={`health-pill ${pulse.level}`} title={pulse.hint}>
                {pulse.label}
              </span>
            ) : null}
          </div>
        </header>
      ) : !compact ? (
        <header className="acct-head">
          <p className="text-[11px] uppercase tracking-wide text-gold font-semibold">Chat principal</p>
          <h2 className="font-semibold mt-1">{company ? "Contador da empresa" : "Contador"}</h2>
        </header>
      ) : (
        <div className="font-semibold px-4 pt-4">{company ? "Contador da empresa" : "Contador"}</div>
      )}

      <div className="claude-stage">
        <div className="acct-log" ref={logRef}>
          {studio && empty ? (
            <div className="claude-empty">
              <h2>{company ? "Como está o caixa hoje?" : "Como posso olhar suas finanças hoje?"}</h2>
              <p>
                {company
                  ? "Manda a planilha, lança na mão ou pergunta de DRE e título. Jarvis (projeto e cliente) fica no site da CodeCraft."
                  : "Manda a tabela salva no computador, coloca o mês na mão se ainda não tem nada, ou pergunta. Eu reviso o passado, planejo o futuro e aviso se está crítica, média ou boa."}
              </p>
            </div>
          ) : null}
          {messages.map((msg, i) => {
            if (studio && empty && i === 0 && msg.from === "bot") return null;
            return (
              <div key={`${msg.from}-${i}`} className={`acct-row ${msg.from}`}>
                <div className="acct-bubble">{msg.body}</div>
              </div>
            );
          })}
          {busy ? (
            <div className="acct-row bot">
              <div className="acct-bubble thinking">Pensando…</div>
            </div>
          ) : null}
        </div>

        {studio && hand ? (
          <aside className="hand-panel">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-gold font-semibold">Colocar na mão</p>
                <p className="text-sm text-muted mt-1">Se não tem planilha, lança o que entrou e saiu neste mês.</p>
              </div>
              <button type="button" className="btn btn-ghost" onClick={() => setHand(false)}>
                Fechar
              </button>
            </div>
            {accounts.length ? (
              <TransactionForm accounts={accounts} categories={categories} aiEnabled={aiEnabled} />
            ) : (
              <p className="text-sm text-muted">Crie uma conta em Contas antes de lançar na mão.</p>
            )}
          </aside>
        ) : null}
      </div>

      {!compact ? (
        <div className="acct-chips">
          {starters.map((item) => (
            <button key={item} type="button" className="acct-chip" onClick={() => void send(item)} disabled={busy}>
              {item}
            </button>
          ))}
        </div>
      ) : null}

      <div className="acct-bar">
        {studio ? (
          <>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv,.xlsm"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void onFile(file);
              }}
            />
            <button type="button" className="acct-icon" title="Mandar planilha" disabled={busy} onClick={() => fileRef.current?.click()}>
              <Paperclip size={18} />
            </button>
            <button type="button" className="acct-chip" disabled={busy} onClick={() => setHand((v) => !v)}>
              {hand ? "Esconder mão" : "Colocar na mão"}
            </button>
          </>
        ) : null}
        <input
          value={input}
          placeholder={
            company
              ? "Pergunta de caixa, DRE, ou fala um gasto"
              : "Pergunta, fala um gasto, ou manda a planilha no clipe"
          }
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
        />
        <button className="btn btn-primary" type="button" disabled={busy || !input.trim()} onClick={() => void send()}>
          Enviar
        </button>
      </div>
    </section>
  );
}
