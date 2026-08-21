"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Paperclip } from "lucide-react";
import { accountantReply, financePulse, type FinancePulse } from "@/lib/accountant";
import { jarvisCompanyReply } from "@/lib/jarvis";
import { addChatSpendsAction } from "@/app/actions/transactions";
import { saveChatBudgetAction } from "@/app/actions/budgets";
import { applyOrganizeAction } from "@/app/actions/import";
import { organizeWorkbook, type OrganizeResult } from "@/lib/organize";
import { analyzeImported, importedSheetView } from "@/lib/import-sheet";
import { buildChatWorkbook } from "@/lib/workbooks";
import { listAccounts, listCategories, requireSession } from "@/lib/store";
import { planForecastMonths, planHasAi, type PlanId, workspaceToolsPaid } from "@/lib/plans";
import { runChatTool, toolsForChat, wantsApply, wantsReject, wantsSheetCreate } from "@/lib/chat-tools";
import { useLive } from "@/lib/live";
import { TransactionForm } from "@/components/transaction-form";
import { MoneySheet } from "@/components/money-sheet";
import { buildMoneySheet } from "@/lib/coach";

type Msg = { from: "user" | "bot"; body: string };

function welcomeBot(isCompany: boolean) {
  return isCompany
    ? "Este chat é só da empresa. Manda a planilha, ou se ainda não tiver arquivo abre a aba Orçamento e vai colocando entra e teto de cada mês. Eu sugiro; só mudo se você gostar."
    : "Este chat é só da pessoa. Manda a planilha, ou se ainda não tiver arquivo abre a aba Orçamento e preenche mês a mês. Eu sugiro; só aplico se você gostar.";
}

function downloadBuffer(buffer: ArrayBuffer, filename: string) {
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function AccountantChat({ compact = false, studio = false }: { compact?: boolean; studio?: boolean }) {
  const live = useLive();
  const [workspaceId, setWorkspaceId] = useState("");
  const [company, setCompany] = useState(false);
  const [plan, setPlan] = useState<PlanId>("FREE");
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [pulse, setPulse] = useState<FinancePulse | null>(null);
  const [hand, setHand] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [paid, setPaid] = useState(false);
  const [sheet, setSheet] = useState<ReturnType<typeof buildMoneySheet> | null>(null);
  const [imported, setImported] = useState<ReturnType<typeof importedSheetView> | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [pending, setPending] = useState<OrganizeResult | null>(null);
  const [showSheet, setShowSheet] = useState(true);
  const [wantTab, setWantTab] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<{ id: string; name: string }[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string; kind: string }[]>([]);
  const logRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const loadedFor = useRef("");

  function refreshSheet(id: string, nextPlan: PlanId, isCompany: boolean) {
    const months = planForecastMonths(nextPlan, isCompany);
    const nextPaid = workspaceToolsPaid(nextPlan, isCompany);
    setPaid(nextPaid);
    setSheet(buildMoneySheet(id, nextPaid, months, { company: isCompany, plan: nextPlan }));
  }

  useEffect(() => {
    void (async () => {
      const session = await requireSession();
      if (!session) return;
      const id = session.workspace.id;
      setWorkspaceId(id);
      const isCompany = session.workspace.type === "BUSINESS";
      setCompany(isCompany);
      setPlan(session.user.plan);
      setPulse(financePulse(id));
      setAccounts(listAccounts(id));
      setCategories(listCategories(id));
      setAiEnabled(planHasAi(session.user.plan));
      refreshSheet(id, session.user.plan, isCompany);
    })();
  }, [live]);

  useEffect(() => {
    if (!workspaceId) return;
    loadedFor.current = "";
    try {
      const raw = localStorage.getItem(`fc-chat-${workspaceId}`);
      if (raw) {
        const saved = JSON.parse(raw) as { messages?: Msg[]; showSheet?: boolean };
        if (saved.messages?.length) {
          setMessages(saved.messages);
          setShowSheet(Boolean(saved.showSheet));
          loadedFor.current = workspaceId;
          return;
        }
      }
    } catch {
      /* ignore */
    }
    setMessages([{ from: "bot", body: welcomeBot(company) }]);
    setShowSheet(true);
    loadedFor.current = workspaceId;
  }, [workspaceId, company]);

  useEffect(() => {
    if (!workspaceId || loadedFor.current !== workspaceId) return;
    localStorage.setItem(`fc-chat-${workspaceId}`, JSON.stringify({ messages, showSheet }));
  }, [workspaceId, messages, showSheet]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  async function applyPending() {
    if (!pending) return "Não tem sugestão esperando.";
    const applied = await applyOrganizeAction(JSON.stringify(pending));
    setPending(null);
    if ("error" in applied && applied.error) return applied.error;
    refreshSheet(workspaceId, plan, company);
    setPulse(financePulse(workspaceId));
    setShowSheet(true);
    return ("ok" in applied ? applied.ok : "Apliquei a planilha.") + " Os números já estão no controle. A aba Gráficos mostra o dinheiro livre do próximo mês.";
  }

  async function makeSheet() {
    const buffer = await buildChatWorkbook(company, plan);
    const name = company
      ? paid
        ? "Tesouraria-Empresa.xlsx"
        : "planilha-empresa.xlsx"
      : paid
        ? "Financas-Pessoal.xlsx"
        : "planilha-pessoa.xlsx";
    downloadBuffer(buffer as ArrayBuffer, name);
    return paid
      ? "Baixei a planilha completa do plano pago: várias abas e fórmulas (DRE, caixa, giro, indicadores). Preenche os dados; as contas se fazem sozinhas. Manda de volta que eu sugiro; só mudo se você gostar."
      : "Montei uma planilha modelo e baixei no seu computador. Preenche com os seus números e manda de volta aqui. Eu sugiro; só mudo se você gostar.";
  }

  function startNewChat() {
    setMessages([{ from: "bot", body: welcomeBot(company) }]);
    setPending(null);
    setImported(null);
    setInput("");
    setHand(false);
    setBusy(false);
    setShowSheet(false);
    setWantTab(null);
    if (workspaceId) localStorage.setItem(`fc-chat-${workspaceId}`, JSON.stringify({ messages: [{ from: "bot", body: welcomeBot(company) }], showSheet: false }));
  }

  function deleteChat() {
    if (!window.confirm("Apagar esta conversa? O dinheiro lançado continua. Só some o chat.")) return;
    if (workspaceId) localStorage.removeItem(`fc-chat-${workspaceId}`);
    startNewChat();
  }

  async function answer(raw: string) {
    const t = raw.trim();
    const n = t
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

    if (pending && wantsApply(n)) return applyPending();
    if (pending && wantsReject(n)) {
      setPending(null);
      setImported(null);
      return "Deixei como estava. A planilha do computador não entrou no controle.";
    }

    if (/(montar orcamento|montar orçamento|mes a mes|mês a mês|nao tenho planilha|não tenho planilha|preencher orcamento|preencher orçamento)/.test(n)) {
      setImported(null);
      setShowSheet(true);
      setWantTab("orcamento");
      refreshSheet(workspaceId, plan, company);
      return "Abri a aba Orçamento. Cada linha é um mês: Entra e o teto que você planeja gastar. O Livre e o gráfico do mês que vem saem daí. Se tiver Excel, manda no clipe.";
    }

    if (pending && /(pagar|desapert|apert|orcamento|orçamento|analis|estrateg|estratég|quanto (vou|vai)|este mes|este mês|situacao|situação|livre|grafico|gráfico|proximo|próximo)/.test(n)) {
      return analyzeImported(pending);
    }

    if (wantsSheetCreate(n)) return makeSheet();

    const tool = toolsForChat(plan, company).find((item) => n.includes(item.id) || n.includes(item.label.toLowerCase()));
    if (tool) {
      if (!workspaceToolsPaid(plan, company)) {
        return company
          ? "Giro, DRE e preço entram no Empresa 100 ou 200. No grátis eu só leio a planilha e o mês de agora."
          : "Corte, 50-30-20 e reserva entram no Pessoa 100 ou 200. No grátis eu só leio a planilha e o mês de agora.";
      }
      return runChatTool(tool.id, workspaceId, company);
    }

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
    refreshSheet(workspaceId, plan, company);
    setShowSheet(true);
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
    const pendingAsk = sessionStorage.getItem("fc-ask");
    if (!pendingAsk) return;
    askedRef.current = true;
    sessionStorage.removeItem("fc-ask");
    void send(pendingAsk);
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
      setPending(organized);
      setImported(importedSheetView(organized));
      setShowSheet(true);
      setWantTab("graficos");
      setMessages((current) => [...current, { from: "bot", body: analyzeImported(organized) }]);
    } catch {
      setMessages((current) => [...current, { from: "bot", body: "Não consegui abrir esse arquivo. Manda Excel ou CSV." }]);
    }
    setBusy(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  const chips = [
    "Montar orçamento mês a mês",
    "Quanto vou pagar este mês?",
    "Quanto de dinheiro livre no próximo mês?",
    "Como desapertar o orçamento?",
    "Como está minha situação?",
    "Faz uma planilha",
    company ? "Como está o caixa?" : "O que cortar?",
    ...toolsForChat(plan, company).map((item) => item.label),
  ];
  const empty = messages.length <= 1;

  return (
    <section
      className={`acct-chat ${studio ? "studio" : "card"} ${compact ? "compact" : ""} ${hand ? "with-hand" : ""} ${dragOver ? "drop-on" : ""}`}
      onDragOver={(e) => {
        if (!studio) return;
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        if (!studio) return;
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) void onFile(file);
      }}
    >
      {studio ? (
        <header className="claude-top">
          <div className="chat-abas">
            <div className="chat-aba on">{company ? "Chat do caixa" : "Chat da pessoa"}</div>
            <button type="button" className="chat-aba-btn" onClick={startNewChat}>
              Nova conversa
            </button>
            <button type="button" className="chat-aba-btn danger" onClick={deleteChat}>
              Excluir
            </button>
          </div>
          <div className="claude-actions">
            {pulse ? (
              <span className={`health-pill ${pulse.level}`} title={pulse.hint}>
                {pulse.label}
              </span>
            ) : null}
          </div>
        </header>
      ) : !compact ? (
        <header className="acct-head">
          <p className="text-[11px] uppercase tracking-wide text-gold font-semibold">Chat</p>
          <h2 className="font-semibold mt-1">{company ? "Empresa" : "Pessoa"}</h2>
        </header>
      ) : (
        <div className="font-semibold px-4 pt-4">{company ? "Empresa" : "Pessoa"}</div>
      )}

      <div className="claude-stage">
        <div className="acct-log" ref={logRef}>
          {studio && empty ? (
            <div className="claude-empty">
              <h2>{company ? "Como está o caixa hoje?" : "Como posso olhar suas finanças hoje?"}</h2>
              <p>
                {company
                  ? "Solta a planilha da empresa, ou se ainda não tiver arquivo preenche o orçamento mês a mês aqui."
                  : "Solta o Excel da pessoa, ou se ainda não tiver arquivo preenche o orçamento de cada mês aqui."}
              </p>
              <div className="flex flex-wrap gap-2 justify-center mt-4">
                <button type="button" className="btn btn-primary" onClick={() => fileRef.current?.click()}>
                  Abrir planilha
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => void send("Montar orçamento mês a mês")}>
                  Preencher mês a mês
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => void send("Faz uma planilha")}>
                  Fazer planilha
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setHand(true)}>
                  Colocar na mão
                </button>
              </div>
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
              <div className="acct-bubble thinking">
                <span className="think-dots" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
                Pensando
              </div>
            </div>
          ) : null}
          {pending ? (
            <div className="flex flex-wrap gap-2 px-1 py-2">
              <button type="button" className="btn btn-primary" disabled={busy} onClick={() => void send("pode aplicar")}>
                Gostei, aplica
              </button>
              <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => void send("não muda")}>
                Não muda
              </button>
            </div>
          ) : null}
          {studio && (imported || sheet) && showSheet ? (
            <div className="chat-sheet">
              <MoneySheet
                sheet={{ ...(imported ?? sheet!), openTab: wantTab ?? (imported ?? sheet)!.openTab }}
                workspaceId={workspaceId}
              />
              {!paid && !imported ? (
                <p className="text-sm text-muted px-1 pt-2">
                  No grátis eu mostro este mês. Nos planos de R$ 100 e R$ 200 o chat prevê os próximos meses e libera as ferramentas.{" "}
                  <Link href="/app/planos" className="underline">
                    Ver planos
                  </Link>
                </p>
              ) : null}
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
              <p className="text-sm text-muted">Crie uma conta em Configurações depois, ou manda a planilha.</p>
            )}
          </aside>
        ) : null}
      </div>

      {!compact ? (
        <div className="acct-chips">
          {chips.map((item) => (
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
            <button type="button" className="btn btn-ink" title="Abrir planilha" disabled={busy} onClick={() => fileRef.current?.click()}>
              Abrir planilha
            </button>
            <button type="button" className="acct-icon" title="Anexar arquivo" disabled={busy} onClick={() => fileRef.current?.click()}>
              <Paperclip size={18} />
            </button>
            <button type="button" className="acct-chip" disabled={busy} onClick={() => void send("Montar orçamento mês a mês")}>
              Preencher mês a mês
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
              ? "Pergunta de caixa, manda a planilha, ou pede para eu fazer uma"
              : "Pergunta, solta o Excel, ou pede para eu montar a planilha"
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
