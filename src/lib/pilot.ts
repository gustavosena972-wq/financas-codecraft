import type { Snapshot } from "./store";
import { addAiLog, addTask, cashBalance, pipelineValue } from "./store";
import { brl } from "./money";
import { today } from "./types";

export type PilotAction = {
  kind: "done" | "ask" | "watch";
  title: string;
  body: string;
};

function hasTask(data: Snapshot, title: string) {
  return data.tasks.some((task) => task.title === title && task.status !== "DONE");
}

export function scanCompany(data: Snapshot): PilotAction[] {
  const actions: PilotAction[] = [];
  const openPay = data.bills.filter((bill) => bill.kind === "PAY" && bill.status === "OPEN");
  const overdue = openPay.filter((bill) => bill.due < today());
  const openGet = data.bills.filter((bill) => bill.kind === "GET" && bill.status === "OPEN");
  const lateGet = openGet.filter((bill) => bill.due < today());
  const stalled = data.deals.filter((deal) => deal.stage === "LEAD" && daysAgo(deal.createdAt) >= 7);
  const blocked = data.works.filter((work) => work.status === "BLOCKED");
  const low = data.stock.filter((item) => item.qty <= item.minQty);
  const cash = cashBalance(data);
  const pipe = pipelineValue(data);

  if (!data.people.length) {
    actions.push({
      kind: "watch",
      title: "Empresa sem gente",
      body: "Cadastre a primeira pessoa em Pessoas. A IA não inventa folha.",
    });
  }

  if (overdue.length) {
    const total = overdue.reduce((sum, bill) => sum + bill.amount, 0);
    actions.push({
      kind: "done",
      title: `Cobrar atenção: ${overdue.length} boleto(s) atrasado(s)`,
      body: `A pagar atrasado: ${brl(total)}. Eu abri uma tarefa. Pagar ainda é com você — dinheiro não sai sozinho.`,
    });
  }

  if (lateGet.length) {
    const total = lateGet.reduce((sum, bill) => sum + bill.amount, 0);
    actions.push({
      kind: "done",
      title: `Cobrar cliente: ${lateGet.length} a receber atrasado`,
      body: `${brl(total)} ainda não caiu. Tarefa de cobrança criada.`,
    });
  }

  for (const deal of stalled.slice(0, 3)) {
    actions.push({
      kind: "done",
      title: `Lead parado: ${deal.customer}`,
      body: `${deal.name} está em lead há ${daysAgo(deal.createdAt)} dias. Tarefa de follow-up criada.`,
    });
  }

  for (const work of blocked) {
    actions.push({
      kind: "done",
      title: `Projeto travado: ${work.name}`,
      body: "Marquei uma tarefa para destravar. Quem puxa é o dono do projeto.",
    });
  }

  for (const item of low) {
    actions.push({
      kind: "done",
      title: `Estoque baixo: ${item.name}`,
      body: `Tem ${item.qty}, mínimo ${item.minQty}. Tarefa de reposição criada.`,
    });
  }

  if (cash < 0) {
    actions.push({
      kind: "ask",
      title: "Caixa negativo",
      body: `Saldo ${brl(cash)}. Eu não pago nada sozinho. Confirme o que cortar ou o que cobrar primeiro.`,
    });
  } else if (pipe > cash * 2 && cash > 0) {
    actions.push({
      kind: "watch",
      title: "Pipeline maior que o caixa",
      body: `Vendas abertas ${brl(pipe)}, caixa ${brl(cash)}. Não gaste o que ainda não caiu.`,
    });
  }

  if (!actions.length) {
    actions.push({
      kind: "watch",
      title: "Empresa em ritmo",
      body: "Nada urgente agora. Eu continuo olhando pessoas, venda, projeto, caixa e estoque.",
    });
  }

  return actions.slice(0, 8);
}

export async function runAutopilot(data: Snapshot) {
  if (!data.org.autopilot) return { applied: 0, actions: [] as PilotAction[] };
  const actions = scanCompany(data);
  let applied = 0;
  for (const action of actions) {
    if (action.kind !== "done") continue;
    if (hasTask(data, action.title)) continue;
    await addTask({
      title: action.title,
      area: areaFrom(action.title),
      status: "TODO",
      assignee: "IA Finanças",
      auto: true,
    });
    await addAiLog({ kind: "done", title: action.title, body: action.body });
    applied += 1;
  }
  for (const action of actions.filter((item) => item.kind !== "done").slice(0, 2)) {
    const exists = data.logs.some((log) => log.title === action.title);
    if (!exists) await addAiLog(action);
  }
  return { applied, actions };
}

export function replyTo(message: string, data: Snapshot) {
  const t = message
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const cash = cashBalance(data);
  const pipe = pipelineValue(data);
  const openPay = data.bills.filter((bill) => bill.kind === "PAY" && bill.status === "OPEN").reduce((sum, bill) => sum + bill.amount, 0);
  const openGet = data.bills.filter((bill) => bill.kind === "GET" && bill.status === "OPEN").reduce((sum, bill) => sum + bill.amount, 0);

  if (/(pagar|pix|transfer|boleto|quitar)/.test(t)) {
    return "Isso mexe dinheiro. Eu não pago sozinho — é o 5%. Você confirma em Caixa, eu só organizo a fila.";
  }
  if (/(demit|mandar embora|excluir pessoa|apagar gente)/.test(t)) {
    return "Gente também é o 5%. Eu não demito. Você remove em Pessoas.";
  }
  if (/(caixa|saldo|dinheiro)/.test(t)) {
    return `Caixa agora: ${brl(cash)}. A pagar ${brl(openPay)}. A receber ${brl(openGet)}.`;
  }
  if (/(venda|pipeline|cliente|lead)/.test(t)) {
    return `Pipeline aberto ${brl(pipe)}. ${data.deals.filter((d) => d.stage === "WON").length} ganho(s). ${data.deals.filter((d) => d.stage === "LEAD").length} lead(s).`;
  }
  if (/(equipe|pessoa|folha|gente)/.test(t)) {
    return `${data.people.length} pessoa(s) na empresa. ${data.people.filter((p) => p.status === "ACTIVE").length} ativas.`;
  }
  if (/(projeto|trav|tarefa)/.test(t)) {
    return `${data.works.filter((w) => w.status === "RUN").length} projeto(s) andando. ${data.tasks.filter((t0) => t0.status !== "DONE").length} tarefa(s) aberta(s).`;
  }
  if (/(estoque)/.test(t)) {
    const low = data.stock.filter((item) => item.qty <= item.minQty);
    return low.length ? `Falta repor: ${low.map((item) => item.name).join(", ")}.` : `Estoque ok. ${data.stock.length} item(ns).`;
  }
  if (/(o que fazer|hoje|prioridade|ajuda)/.test(t)) {
    const first = scanCompany(data)[0];
    return first ? `${first.title}. ${first.body}` : "Nada urgente. Cadastra gente, uma venda e o caixa — eu puxo o resto.";
  }
  return `Eu olho a empresa toda. Caixa ${brl(cash)}, pipeline ${brl(pipe)}, ${data.people.length} pessoa(s). Pergunta de um setor, ou deixa a IA autônoma ligada no painel.`;
}

function areaFrom(title: string) {
  if (/boleto|caixa|pagar|receber/i.test(title)) return "CAIXA";
  if (/lead|cliente/i.test(title)) return "VENDAS";
  if (/projeto/i.test(title)) return "OPS";
  if (/estoque/i.test(title)) return "ESTOQUE";
  return "DIRECAO";
}

function daysAgo(iso: string) {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return 0;
  return Math.floor((Date.now() - t) / 86400000);
}
