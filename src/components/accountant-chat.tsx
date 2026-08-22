"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Clock, Eraser, Paperclip, PanelLeft, Plus, Search, SendHorizontal, Shield, Sparkles, Trash2 } from "lucide-react";
import { accountantReply, financePulse, type FinancePulse, type TxCite } from "@/lib/accountant";
import { jarvisCompanyReply } from "@/lib/jarvis";
import { addChatSpendsAction } from "@/app/actions/transactions";
import { saveChatBudgetAction } from "@/app/actions/budgets";
import { applyOrganizeAction } from "@/app/actions/import";
import { organizeWorkbook, type OrganizeResult } from "@/lib/organize";
import { analyzeImported, importedSheetView } from "@/lib/import-sheet";
import { analyzeCompany, analyzeCompanyFile, COMPANY_SIZES, inferCompanySize, parseCompanySize, saveCompanySize } from "@/lib/company-biz";
import { buildChatWorkbook } from "@/lib/workbooks";
import { clearAuditLogs, listAccounts, listCategories, requireSession } from "@/lib/store";
import { planById, planChatAskLabel, planChatChars, planForecastMonths, planHasAi, type PlanId, workspaceToolsPaid } from "@/lib/plans";
import { runChatTool, toolsForChat, wantsApply, wantsReject, wantsSheetCreate } from "@/lib/chat-tools";
import {
  bumpChatAsk,
  chatFileIssue,
  chatLimitLines,
  chatMessageIssue,
  clearChatPack,
  freshThread,
  loadChatPack,
  readChatAsks,
  saveChatPack,
  THINKING_LINES,
  threadTitleFrom,
  type ChatAskState,
  type ChatThread,
} from "@/lib/chat-guard";
import { nowIso } from "@/lib/types";
import { clearSearches, listSearches, pushSearch, wipePlatformHistory, type SearchHit } from "@/lib/history";
import { useLive } from "@/lib/live";
import { brl } from "@/lib/money";
import { TransactionForm } from "@/components/transaction-form";
import { MoneySheet } from "@/components/money-sheet";
import { buildMoneySheet } from "@/lib/coach";

type Msg = { from: "user" | "bot"; body: string; evidence?: TxCite[] };

function welcomeBot(isCompany: boolean) {
  return isCompany
    ? "Este chat é o caixa da empresa — do autônomo e do MEI até empresa grande. Diz o porte, manda a planilha ou preenche o orçamento. Eu analiso receita, imposto, folha e o que sobra. Só mudo se você gostar."
    : "Este chat é da casa. Manda a planilha (uma aba por mês) ou pergunta quanto saiu no cartão. Eu mostro a linha. Só aplico se você gostar. Sem senha. Sem PIX.";
}

function welcomeMsgs(isCompany: boolean): Msg[] {
  return [{ from: "bot", body: welcomeBot(isCompany) }];
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

function isConfirm(raw: string) {
  const n = raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  return wantsApply(n) || wantsReject(n);
}

export function AccountantChat({ compact = false, studio = false }: { compact?: boolean; studio?: boolean }) {
  const live = useLive();
  const [workspaceId, setWorkspaceId] = useState("");
  const [userId, setUserId] = useState("");
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
  const [asks, setAsks] = useState<ChatAskState>({ used: 0, limit: 8, remaining: 8, infinite: false });
  const [threads, setThreads] = useState<ChatThread<Msg>[]>([]);
  const [openId, setOpenId] = useState("");
  const [thinkLine, setThinkLine] = useState(THINKING_LINES[0]);
  const [pop, setPop] = useState(false);
  const [searches, setSearches] = useState<SearchHit[]>([]);
  const [historyQ, setHistoryQ] = useState("");
  const [historyOpen, setHistoryOpen] = useState(true);
  const logRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const loadedFor = useRef("");
  const hydrating = useRef(true);

  function refreshSheet(id: string, nextPlan: PlanId, isCompany: boolean) {
    const months = planForecastMonths(nextPlan, isCompany);
    const nextPaid = workspaceToolsPaid(nextPlan, isCompany);
    setPaid(nextPaid);
    setSheet(buildMoneySheet(id, nextPaid, months, { company: isCompany, plan: nextPlan }));
  }

  function persistThreads(next: ChatThread<Msg>[], nextOpen: string) {
    setThreads(next);
    setOpenId(nextOpen);
    if (workspaceId) saveChatPack(workspaceId, next, nextOpen);
  }

  useEffect(() => {
    void (async () => {
      const session = await requireSession();
      if (!session) return;
      const id = session.workspace.id;
      setWorkspaceId(id);
      setUserId(session.user.id);
      const isCompany = session.workspace.type === "BUSINESS";
      setCompany(isCompany);
      setPlan(session.user.plan);
      setPulse(financePulse(id));
      setAccounts(listAccounts(id));
      setCategories(listCategories(id));
      setAiEnabled(planHasAi(session.user.plan));
      setAsks(readChatAsks(session.user.id, session.user.plan));
      setSearches(listSearches(session.user.id, id));
      if (isCompany) {
        try {
          const pendingSize = localStorage.getItem("fc-pending-company-size");
          if (pendingSize === "autonomo" || pendingSize === "mei" || pendingSize === "pequena" || pendingSize === "grande") {
            saveCompanySize(id, pendingSize);
            localStorage.removeItem("fc-pending-company-size");
          }
        } catch {
          /* ignore */
        }
      }
      refreshSheet(id, session.user.plan, isCompany);
    })();
  }, [live]);

  useEffect(() => {
    if (!workspaceId) return;
    hydrating.current = true;
    loadedFor.current = "";
    const pack = loadChatPack<Msg>(workspaceId, welcomeMsgs(company));
    const open = pack.threads.find((t) => t.id === pack.openId) ?? pack.threads[0];
    setThreads(pack.threads);
    setOpenId(pack.openId);
    setMessages(open?.messages?.length ? open.messages : welcomeMsgs(company));
    setShowSheet(open ? Boolean(open.showSheet) : true);
    if (userId) {
      const saved = listSearches(userId, workspaceId);
      if (saved.length) {
        setSearches(saved);
      } else {
        for (const thread of pack.threads) {
          for (const msg of thread.messages) {
            if (msg.from === "user" && !isConfirm(msg.body)) pushSearch(userId, { text: msg.body, threadId: thread.id, workspaceId });
          }
        }
        setSearches(listSearches(userId, workspaceId));
      }
    }
  }, [workspaceId, company, userId]);

  useEffect(() => {
    if (hydrating.current) {
      hydrating.current = false;
      loadedFor.current = workspaceId;
      return;
    }
    if (!workspaceId || loadedFor.current !== workspaceId || !openId) return;
    setThreads((prev) => {
      const next = prev.map((thread) =>
        thread.id === openId
          ? { ...thread, messages, showSheet, title: threadTitleFrom(messages), updatedAt: nowIso() }
          : thread,
      );
      saveChatPack(workspaceId, next, openId);
      return next;
    });
  }, [messages, showSheet, openId, workspaceId]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  useEffect(() => {
    if (!busy) return;
    setThinkLine(THINKING_LINES[0]);
    let i = 0;
    const timer = window.setInterval(() => {
      i = (i + 1) % THINKING_LINES.length;
      setThinkLine(THINKING_LINES[i]);
    }, 1500);
    return () => window.clearInterval(timer);
  }, [busy]);

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

  function resetExtras() {
    setPending(null);
    setImported(null);
    setInput("");
    setHand(false);
    setBusy(false);
    setWantTab(null);
  }

  function startNewChat() {
    const created = freshThread(welcomeMsgs(company));
    const kept = threads.map((thread) =>
      thread.id === openId ? { ...thread, messages, showSheet, title: threadTitleFrom(messages), updatedAt: nowIso() } : thread,
    );
    persistThreads([created, ...kept.filter((thread) => thread.messages.some((msg) => msg.from === "user"))].slice(0, 12), created.id);
    setMessages(created.messages);
    setShowSheet(false);
    resetExtras();
  }

  function deleteChat() {
    if (!window.confirm("Apagar esta conversa? O dinheiro lançado continua. Só some este chat.")) return;
    const rest = threads.filter((thread) => thread.id !== openId);
    const next = rest.length ? rest : [freshThread(welcomeMsgs(company))];
    persistThreads(next, next[0].id);
    setMessages(next[0].messages);
    setShowSheet(Boolean(next[0].showSheet));
    resetExtras();
  }

  function deleteHistory() {
    if (!window.confirm("Apagar o histórico? Todas as conversas deste espaço somem. O dinheiro lançado continua.")) return;
    if (workspaceId) clearChatPack(workspaceId);
    if (userId) {
      const rest = listSearches(userId).filter((row) => row.workspaceId !== workspaceId);
      try {
        localStorage.setItem(`fc-searches-${userId}`, JSON.stringify(rest));
      } catch {
        /* ignore */
      }
      setSearches([]);
    }
    const created = freshThread(welcomeMsgs(company));
    persistThreads([created], created.id);
    setMessages(created.messages);
    setShowSheet(false);
    resetExtras();
  }

  async function wipePlatform() {
    if (!window.confirm("Apagar o histórico de tudo? Conversas, pesquisas e a auditoria deste login somem. Contas e lançamentos continuam.")) return;
    if (userId) {
      wipePlatformHistory(userId);
      try {
        await clearAuditLogs(userId);
      } catch {
        /* local already cleared */
      }
      clearSearches(userId);
    } else {
      wipePlatformHistory();
    }
    setSearches([]);
    const created = freshThread(welcomeMsgs(company));
    persistThreads([created], created.id);
    setMessages(created.messages);
    setShowSheet(false);
    resetExtras();
  }

  function openSearch(hit: SearchHit) {
    const thread = threads.find((item) => item.id === hit.threadId);
    if (thread) openThread(thread.id);
    else setInput(hit.text);
  }

  function openThread(id: string) {
    const thread = threads.find((item) => item.id === id);
    if (!thread) return;
    persistThreads(
      threads.map((item) =>
        item.id === openId ? { ...item, messages, showSheet, title: threadTitleFrom(messages), updatedAt: nowIso() } : item,
      ),
      id,
    );
    setMessages(thread.messages);
    setShowSheet(Boolean(thread.showSheet));
    resetExtras();
  }

  function quotaReply() {
    const name = planById(plan).name;
    return `A IA deste plano (${name}) já usou as ${asks.limit} perguntas de hoje. Amanhã zera. No Casa sobem para 40, no Casa Plus para 80, no Empresa para 120, no Completo não tem teto.`;
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
      return company ? analyzeCompanyFile(pending, inferCompanySize(workspaceId)) : analyzeImported(pending);
    }

    const porte = parseCompanySize(raw);
    if (company && porte) {
      saveCompanySize(workspaceId, porte);
      setShowSheet(true);
      setWantTab("analise");
      refreshSheet(workspaceId, plan, company);
      return analyzeCompany(workspaceId, porte);
    }

    if (company && /(analis|diagnost|como esta a empresa|como está a empresa|saude da empresa|saúde da empresa)/.test(n)) {
      setShowSheet(true);
      setWantTab("analise");
      refreshSheet(workspaceId, plan, company);
      return analyzeCompany(workspaceId);
    }

    if (wantsSheetCreate(n)) return makeSheet();

    const tool = toolsForChat(plan, company).find((item) => n.includes(item.id) || n.includes(item.label.toLowerCase()));
    if (tool) {
      if (tool.id !== "analise" && !workspaceToolsPaid(plan, company)) {
        return company
          ? "Giro, DRE e preço entram no plano Empresa (R$ 305). Análise do porte, planilha e o mês de agora já vêm no Experimentar."
          : "Simuladores entram no Casa Plus (R$ 200). No Experimentar eu só leio a planilha e o mês de agora.";
      }
      if (tool.id === "analise") {
        setShowSheet(true);
        setWantTab("analise");
        refreshSheet(workspaceId, plan, company);
      }
      return runChatTool(tool.id, workspaceId, company);
    }

    let reply: { body: string; spends?: { type: "INCOME" | "EXPENSE"; description: string; amount: number }[]; budget?: { categoryName: string; amount: number }; evidence?: TxCite[] };
    if (company) {
      const spendTry = accountantReply(raw, workspaceId);
      if (spendTry.spends?.length || spendTry.budget || spendTry.evidence?.length) {
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
    return { body: reply.body, evidence: reply.evidence };
  }

  async function send(text = input) {
    const raw = text.trim();
    if (!raw || busy || !workspaceId) return;
    const issue = chatMessageIssue(raw, plan);
    if (issue) {
      setInput("");
      setMessages((current) => [...current, { from: "user", body: raw }, { from: "bot", body: issue }]);
      return;
    }
    if (!isConfirm(raw) && !asks.infinite && asks.remaining <= 0) {
      setInput("");
      setMessages((current) => [...current, { from: "user", body: raw }, { from: "bot", body: quotaReply() }]);
      return;
    }
    setInput("");
    setBusy(true);
    setPop(true);
    window.setTimeout(() => setPop(false), 420);
    setMessages((current) => [...current, { from: "user", body: raw }]);
    if (!isConfirm(raw) && userId) {
      setAsks(bumpChatAsk(userId, plan));
      pushSearch(userId, { text: raw, threadId: openId || "open", workspaceId });
      setSearches(listSearches(userId, workspaceId));
    }
    const next = await answer(raw);
    const payload = typeof next === "string" ? { body: next, evidence: undefined as TxCite[] | undefined } : { body: next.body, evidence: "evidence" in next ? next.evidence : undefined };
    setMessages((current) => [...current, { from: "bot", body: payload.body, evidence: payload.evidence }]);
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
    const fileIssue = chatFileIssue(file);
    if (fileIssue) {
      setMessages((current) => [...current, { from: "bot", body: fileIssue }]);
      return;
    }
    if (!asks.infinite && asks.remaining <= 0) {
      setMessages((current) => [...current, { from: "bot", body: quotaReply() }]);
      return;
    }
    setBusy(true);
    setPop(true);
    window.setTimeout(() => setPop(false), 420);
    if (userId) setAsks(bumpChatAsk(userId, plan));
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
      setWantTab(company ? "analise" : "graficos");
      setMessages((current) => [
        ...current,
        { from: "bot", body: company ? analyzeCompanyFile(organized, inferCompanySize(workspaceId)) : analyzeImported(organized) },
      ]);
    } catch {
      setMessages((current) => [...current, { from: "bot", body: "Não consegui abrir esse arquivo. Manda Excel ou CSV." }]);
    }
    setBusy(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  const toolHint = Object.fromEntries(toolsForChat(plan, company).map((item) => [item.label, item.does]));
  const chips = company
    ? [
        "Faz a análise da empresa",
        "Sou autônomo",
        "Sou MEI",
        "Empresa pequena",
        "Empresa grande",
        "Montar orçamento mês a mês",
        "Como está o caixa?",
        ...toolsForChat(plan, company)
          .filter((item) => item.id !== "analise")
          .map((item) => item.label),
      ]
    : [
        "Montar orçamento mês a mês",
        "Quanto vou pagar este mês?",
        "Quanto de dinheiro livre no próximo mês?",
        "Como desapertar o orçamento?",
        "Como está minha situação?",
        "Faz uma planilha",
        "O que cortar?",
        ...toolsForChat(plan, company).map((item) => item.label),
      ];
  const empty = messages.length <= 1;
  const maxChars = planChatChars(plan);
  const atLimit = !asks.infinite && asks.remaining <= 0;
  const quotaPct = asks.infinite ? 100 : Math.min(100, Math.round((asks.used / Math.max(1, asks.limit)) * 100));
  const limits = chatLimitLines(plan);
  const recent = threads.filter((thread) => thread.messages.some((msg) => msg.from === "user")).slice(0, 6);
  const shownSearches = searches.filter((row) => !historyQ.trim() || row.text.toLowerCase().includes(historyQ.trim().toLowerCase()));

  const historyPanel = (
    <aside className="search-history">
      <div className="search-history-head">
        <div>
          <p className="page-kicker">Histórico</p>
          <h3>Pesquisas</h3>
        </div>
        <button type="button" className="acct-icon" title="Esconder histórico" onClick={() => setHistoryOpen(false)}>
          <PanelLeft size={16} />
        </button>
      </div>
      <label className="history-search">
        <Search size={14} />
        <input value={historyQ} placeholder="Buscar no histórico" onChange={(e) => setHistoryQ(e.target.value)} />
      </label>
      <ul className="history-list">
        {shownSearches.map((hit) => (
          <li key={hit.id}>
            <button type="button" onClick={() => openSearch(hit)}>
              <Clock size={13} />
              <span>
                <strong>{hit.text}</strong>
                <em>{new Date(hit.at).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</em>
              </span>
            </button>
          </li>
        ))}
        {!shownSearches.length ? <li className="history-empty">Ainda não tem pesquisa neste espaço.</li> : null}
      </ul>
      <div className="history-actions">
        <button type="button" className="tool-btn" onClick={startNewChat}>
          <Plus size={14} />
          Nova conversa
        </button>
        <button type="button" className="tool-btn danger" onClick={deleteHistory}>
          <Eraser size={14} />
          Excluir histórico
        </button>
        <button type="button" className="tool-btn danger" onClick={() => void wipePlatform()}>
          <Trash2 size={14} />
          Excluir tudo da plataforma
        </button>
        <Link href="/app/configuracoes" className="history-link">
          Também em Ajustes
        </Link>
      </div>
    </aside>
  );

  const composer = (
    <div className={`chat-composer ${atLimit ? "locked" : ""} ${pop ? "pop" : ""}`}>
      {recent.length > 1 ? (
        <div className="thread-pills">
          {recent.map((thread) => (
            <button
              key={thread.id}
              type="button"
              className={`thread-pill ${thread.id === openId ? "on" : ""}`}
              onClick={() => openThread(thread.id)}
            >
              {thread.title}
            </button>
          ))}
        </div>
      ) : null}
      <div className="quota-row">
        <Sparkles size={14} />
        <div className="quota-track" aria-hidden="true">
          <span className={`quota-fill ${asks.remaining <= 2 && !asks.infinite ? "low" : ""}`} style={{ width: `${quotaPct}%` }} />
        </div>
        <p>
          {asks.infinite
            ? "Perguntas livres hoje"
            : `${asks.remaining} de ${asks.limit} perguntas hoje · ${planById(plan).name}`}
        </p>
      </div>
      <div className="composer-box">
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
            <button type="button" className="acct-icon" title="Anexar planilha" disabled={busy || atLimit} onClick={() => fileRef.current?.click()}>
              <Paperclip size={18} />
            </button>
          </>
        ) : null}
        <input
          value={input}
          maxLength={maxChars}
          disabled={atLimit}
          placeholder={
            atLimit
              ? "Acabaram as perguntas de hoje"
              : company
                ? "Pergunta do caixa, porte ou planilha"
                : "Pergunta, solta o Excel, ou pede a planilha"
          }
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
        />
        <button className="btn btn-primary send-btn" type="button" disabled={busy || atLimit || !input.trim()} onClick={() => void send()}>
          <SendHorizontal size={16} />
          Enviar
        </button>
      </div>
      <div className="composer-meta">
        <span>
          {input.length}/{maxChars}
        </span>
        {atLimit ? (
          <Link href="/app/planos" className="quota-up">
            Quero mais perguntas
          </Link>
        ) : (
          <span>{planChatAskLabel(plan)}</span>
        )}
      </div>
      <div className="composer-tools">
        <button type="button" className="tool-btn" onClick={startNewChat}>
          <Plus size={15} />
          Nova conversa
        </button>
        <button type="button" className="tool-btn danger" onClick={deleteChat}>
          <Trash2 size={15} />
          Excluir
        </button>
        <button type="button" className="tool-btn danger" onClick={deleteHistory}>
          <Eraser size={15} />
          Excluir histórico
        </button>
        <button type="button" className="tool-btn danger" onClick={() => void wipePlatform()}>
          <Trash2 size={15} />
          Excluir tudo da plataforma
        </button>
        {studio ? (
          <>
            <button type="button" className="tool-btn" disabled={busy || atLimit} onClick={() => void send("Montar orçamento mês a mês")}>
              Mês a mês
            </button>
            <button type="button" className="tool-btn" disabled={busy} onClick={() => setHand((v) => !v)}>
              {hand ? "Esconder mão" : "Colocar na mão"}
            </button>
          </>
        ) : null}
      </div>
      <ul className="chat-limits">
        {limits.map((line) => (
          <li key={line}>
            <Shield size={12} />
            {line}
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <section
      className={`acct-chat ${studio ? "studio" : "card"} ${compact ? "compact" : ""} ${hand ? "with-hand" : ""} ${dragOver ? "drop-on" : ""} ${studio && historyOpen ? "with-hist" : ""}`}
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
      {studio && historyOpen ? historyPanel : null}
      <div className="chat-col">
      {studio ? (
        <header className="claude-top">
          <div className="chat-abas">
            {!historyOpen ? (
              <button type="button" className="chat-aba-btn" onClick={() => setHistoryOpen(true)}>
                Histórico
              </button>
            ) : null}
            <div className="chat-aba on">{company ? "IA da empresa" : "IA da pessoa"}</div>
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
          <h2 className="font-semibold mt-1">{company ? "IA da empresa" : "IA da pessoa"}</h2>
        </header>
      ) : (
        <div className="font-semibold px-4 pt-4">{company ? "IA da empresa" : "IA da pessoa"}</div>
      )}

      <div className="claude-stage">
        <div className="acct-log" ref={logRef}>
          {studio && empty ? (
            <div className="claude-empty">
              <div className="empty-spark" aria-hidden="true">
                <i />
                <i />
                <i />
              </div>
              <div className="empty-mark">FC</div>
              <h2>{company ? "De autônomo a empresa grande." : "Como posso olhar suas finanças hoje?"}</h2>
              <p>
                {company
                  ? "Escolhe o porte. Eu analiso receita, DAS, folha, giro e o dinheiro livre do mês que vem. Sem arquivo, preenche o orçamento aqui."
                  : "Solta o Excel da pessoa, ou se ainda não tiver arquivo preenche o orçamento de cada mês aqui."}
              </p>
              {company ? (
                <div className="flex flex-wrap gap-2 justify-center mt-4">
                  {COMPANY_SIZES.map((item) => (
                    <button key={item.id} type="button" className="btn btn-ghost bounce-in" onClick={() => void send(item.id === "mei" ? "Sou MEI" : item.id === "autonomo" ? "Sou autônomo" : item.name)}>
                      {item.name}
                    </button>
                  ))}
                </div>
              ) : null}
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
                <div className="acct-bubble">
                  {msg.body}
                  {msg.evidence?.length ? (
                    <ul className="tx-cite">
                      {msg.evidence.map((row) => (
                        <li key={row.id}>
                          <span>{row.date}</span>
                          <span>{row.description}</span>
                          <strong>
                            {row.type === "EXPENSE" ? "−" : "+"}
                            {brl(row.amount)}
                          </strong>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
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
                {thinkLine}
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
                  No Experimentar eu mostro este mês. No Casa (R$ 107) o chat prevê o ano e avalia o cartão todo dia. Empresa (R$ 305) é tesouraria.{" "}
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
            <button key={item} type="button" className="acct-chip" title={toolHint[item]} onClick={() => void send(item)} disabled={busy || atLimit}>
              {item}
            </button>
          ))}
        </div>
      ) : null}

      {composer}
      </div>
    </section>
  );
}
