import { brl, formatMonthLabel, monthKey, shiftMonth } from "./money";
import { accountBalances, categorySpend, monthSummary } from "./queries";
import {
  listBills,
  listBudgets,
  listCategories,
  listGoals,
  listLockedMonths,
  listReconciledIds,
  listRecurring,
  listTeam,
  listTransactions,
} from "./store";
import { billsOverview, spendByCostCenter } from "./ops";
import { bucketSpend, reserveMonths, split503020 } from "./tools";
import type { PlanId } from "./plans";
import { buildOrcamentoTab, loadMonthPlan, planYearMonths } from "./month-plan";
import { diagnoseCompany, inferCompanySize, sizeLabel } from "./company-biz";

export type SheetRow = {
  month: string;
  label: string;
  income: number;
  expense: number;
  net: number;
  balance: number;
  kind: "past" | "now" | "future";
};

export type CutTip = {
  title: string;
  body: string;
  save: number;
};

export type SheetTab = {
  id: string;
  name: string;
  headers: string[];
  rows: string[][];
  nowRow?: number;
  monthKeys?: string[];
  editableCols?: number[];
};

export type SheetCharts = {
  thisFree: number;
  nextFree: number;
  nextFreeIfCut: number;
  nextIncome: number;
  nextPay: number;
  nextPayIfCut: number;
  thisLabel: string;
  nextLabel: string;
  series: { month: string; income: number; expense: number; net: number }[];
  slices: { name: string; color: string; amount: number }[];
};

export const SHEET_SLICE_COLORS = ["#c4a35a", "#1f8a62", "#b94a3c", "#3d6f8c", "#7a5a12", "#5a6a76"];

function averagePositive(values: number[]) {
  const usable = values.filter((value) => value > 0);
  if (!usable.length) return 0;
  return Math.round(usable.reduce((sum, value) => sum + value, 0) / usable.length);
}

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function money(cents: number) {
  if (!cents) return "0,00";
  return (cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function pct(value: number) {
  return `${value.toFixed(1)}%`;
}

type Bucket = "cogs" | "payroll" | "tax" | "mkt" | "infra" | "opex";

function bucketOf(name: string): Bucket {
  const n = normalize(name);
  if (/imposto|das|inss|iss|irpj|csll|pis|cofins|iof|tribut/.test(n)) return "tax";
  if (/folha|salario|pro.?labore|clt|ferias|13o|decimo/.test(n)) return "payroll";
  if (/custo|cmv|fornecedor|insumo|terceir/.test(n)) return "cogs";
  if (/market|ads|anuncio|trafego|divulg/.test(n)) return "mkt";
  if (/infra|host|dominio|software|saas|ferramenta|nuvem/.test(n)) return "infra";
  return "opex";
}

function splitExpenses(workspaceId: string, month: string) {
  const summary = monthSummary(workspaceId, month);
  const parts: Record<Bucket, number> = { cogs: 0, payroll: 0, tax: 0, mkt: 0, infra: 0, opex: 0 };
  for (const tx of summary.txs.filter((t) => t.type === "EXPENSE")) {
    parts[bucketOf(tx.category?.name ?? tx.description)] += tx.amount;
  }
  return { ...summary, ...parts };
}

function tab(id: string, name: string, headers: string[], rows: string[][], nowRow?: number): SheetTab {
  return { id, name, headers, rows, nowRow };
}

export function buildMoneySheet(
  workspaceId: string,
  paid = false,
  futureCount = paid ? 11 : 1,
  opts?: { company?: boolean; plan?: PlanId },
) {
  const company = Boolean(opts?.company);
  const plan = opts?.plan ?? (paid ? (company ? "BUSINESS" : "PRO") : "FREE");
  const full = plan === "PLUS" || plan === "ENTERPRISE" || plan === "BUSINESS";
  const now = monthKey();
  const today = new Date().toISOString().slice(0, 10);
  const history = [shiftMonth(now, -2), shiftMonth(now, -1), now].map((month) => ({
    month,
    ...monthSummary(workspaceId, month),
  }));
  const incomeAvg = averagePositive(history.map((row) => row.income));
  const expenseAvg = averagePositive(history.map((row) => row.expense));
  const current = monthSummary(workspaceId, now);
  const currentBalance = accountBalances(workspaceId).reduce((sum, account) => sum + account.balance, 0);

  const past = [shiftMonth(now, -2), shiftMonth(now, -1)].map((month) => {
    const summary = monthSummary(workspaceId, month);
    return {
      month,
      label: formatMonthLabel(month),
      income: summary.income,
      expense: summary.expense,
      net: summary.net,
      balance: 0,
      kind: "past" as const,
    };
  });

  const nowRow: SheetRow = {
    month: now,
    label: formatMonthLabel(now),
    income: current.income,
    expense: current.expense,
    net: current.net,
    balance: currentBalance,
    kind: "now",
  };

  const future: SheetRow[] = [];
  let running = currentBalance;
  for (let i = 1; i <= futureCount; i += 1) {
    const month = shiftMonth(now, i);
    const net = incomeAvg - expenseAvg;
    running += net;
    future.push({
      month,
      label: formatMonthLabel(month),
      income: incomeAvg,
      expense: expenseAvg,
      net,
      balance: running,
      kind: "future",
    });
  }

  const rows = [...past, nowRow, ...future];
  const tips: CutTip[] = [];
  let saveMonth = 0;
  const top = categorySpend(workspaceId, now)[0];
  if (top && current.expense > 0 && top.amount / current.expense >= 0.18) {
    const cut = Math.round(top.amount * 0.2);
    saveMonth += cut;
    tips.push({
      title: `Cortar 20% de ${top.name}`,
      body: `${top.name} levou ${brl(top.amount)} neste mês. Se baixar um quinto, o caixa ganha ${brl(cut)} por mês.`,
      save: cut,
    });
  }

  const bills = listRecurring(workspaceId)
    .filter((item) => item.type === "EXPENSE")
    .sort((a, b) => b.amount - a.amount);
  const named = bills.filter((item) =>
    /(netflix|spotify|disney|prime|assinat|claro|vivo|tim|internet|aluguel|academia|luz|energia|agua)/.test(
      normalize(item.description),
    ),
  );
  for (const bill of (named.length ? named : bills).slice(0, 2)) {
    const cut = Math.round(bill.amount * 0.15);
    if (!cut) continue;
    saveMonth += cut;
    tips.push({
      title: `Baixar a conta ${bill.description}`,
      body: `Todo mês sai ${brl(bill.amount)}. Se negociar 15% ou trocar de plano, você gasta ${brl(cut)} a menos.`,
      save: cut,
    });
  }

  if (current.net < 0) {
    tips.push({
      title: "O mês ainda está no vermelho",
      body: `Faltou ${brl(Math.abs(current.net))}. Comece pelo maior gasto e pelas contas que se repetem.`,
      save: 0,
    });
  } else if (current.income > 0 && current.net / current.income < 0.1 && current.expense > 0) {
    tips.push({
      title: "Sobra pouco",
      body: `Deste mês ficou ${brl(current.net)}. Uma meta simples é guardar 10% do que entra.`,
      save: 0,
    });
  }

  const empty = history.every((row) => !row.txs.length);
  const yearMonths = planYearMonths(now);
  const savedPlan = loadMonthPlan(workspaceId);
  const monthValues = yearMonths.map((month) => {
    const summary = monthSummary(workspaceId, month);
    const planned = savedPlan.find((item) => item.month === month);
    return {
      month,
      income: planned?.income || summary.income,
      expense: planned?.expense || summary.expense,
    };
  });
  const next = monthValues.find((item) => item.month === shiftMonth(now, 1)) ?? {
    month: shiftMonth(now, 1),
    income: incomeAvg,
    expense: expenseAvg,
  };
  const nextPayIfCut = Math.max(0, next.expense - saveMonth);
  const charts: SheetCharts = {
    thisFree: current.net,
    nextFree: next.income - next.expense,
    nextFreeIfCut: next.income - nextPayIfCut,
    nextIncome: next.income,
    nextPay: next.expense,
    nextPayIfCut,
    thisLabel: formatMonthLabel(now),
    nextLabel: formatMonthLabel(next.month),
    series: monthValues.map((item) => ({
      month: item.month,
      income: item.income,
      expense: item.expense,
      net: item.income - item.expense,
    })),
    slices: categorySpend(workspaceId, now)
      .slice(0, 6)
      .map((item, i) => ({ name: item.name, amount: item.amount, color: SHEET_SLICE_COLORS[i % SHEET_SLICE_COLORS.length] })),
  };
  const thisPlan = monthValues.find((item) => item.month === now);
  if (thisPlan) charts.thisFree = thisPlan.income - thisPlan.expense;
  const graficos = tab(
    "graficos",
    "Gráficos",
    ["O que", "Valor"],
    [
      ["Livre neste mês", money(charts.thisFree)],
      [`Livre em ${charts.nextLabel} se nada mudar`, money(charts.nextFree)],
      [`Livre em ${charts.nextLabel} se desapertar`, money(charts.nextFreeIfCut)],
    ],
  );
  const orcamento = buildOrcamentoTab(yearMonths, now, monthValues);
  const analiseEmp = company
    ? tab("analise", "Análise", ["Indicador", "Valor", "Leitura"], diagnoseCompany(workspaceId).lines)
    : null;
  const tabs = paid
    ? company
      ? [graficos, analiseEmp!, orcamento, ...companyTabs(workspaceId, rows, now, today, current, currentBalance, incomeAvg, expenseAvg, full)]
      : [graficos, orcamento, ...personTabs(workspaceId, rows, now, current, currentBalance, full)]
    : company
      ? [graficos, analiseEmp!, orcamento, tab(
          "caixa",
          "Caixa",
          ["Mês", "Entra", "Sai", "Sobra", "Saldo"],
          rows.map((row) => [
            row.label,
            money(row.income),
            money(row.expense),
            money(row.net),
            row.kind === "past" ? "" : money(row.balance),
          ]),
          rows.findIndex((row) => row.kind === "now"),
        )]
      : [
          graficos,
          orcamento,
          tab(
            "caixa",
            "Caixa",
            ["Mês", "Entra", "Sai", "Sobra", "Saldo"],
            rows.map((row) => [
              row.label,
              money(row.income),
              money(row.expense),
              money(row.net),
              row.kind === "past" ? "" : money(row.balance),
            ]),
            rows.findIndex((row) => row.kind === "now"),
          ),
        ];

  return {
    rows,
    incomeAvg,
    expenseAvg,
    saveMonth,
    yearSave: saveMonth * 12,
    tips: paid ? tips.slice(0, 4) : tips.slice(0, 1),
    empty,
    paid,
    company,
    fileName: company
      ? paid
        ? `Tesouraria-${sizeLabel(inferCompanySize(workspaceId)).replace(/\s+/g, "")}.xlsx`
        : "Caixa-Empresa.xlsx"
      : paid
        ? "Financas-Pessoal.xlsx"
        : "Caixa.xlsx",
    tabs,
    openTab: empty ? (company ? "analise" : "orcamento") : company ? "analise" : "graficos",
    charts,
  };
}

function personTabs(
  workspaceId: string,
  rows: SheetRow[],
  now: string,
  current: ReturnType<typeof monthSummary>,
  balance: number,
  full: boolean,
) {
  const spend = categorySpend(workspaceId, now);
  const split = split503020(current.income);
  const used = bucketSpend(spend);
  const essential = spend.filter((s) => /moradia|aluguel|luz|agua|saude|mercado|aliment/.test(normalize(s.name))).reduce((s, r) => s + r.amount, 0) || current.expense;
  const months = reserveMonths(balance, essential);
  const goals = listGoals(workspaceId);
  const budgets = listBudgets(workspaceId, now);
  const cats = listCategories(workspaceId);
  const recurring = listRecurring(workspaceId).filter((item) => item.type === "EXPENSE");
  const nowIdx = rows.findIndex((row) => row.kind === "now");

  const tabs: SheetTab[] = [
    tab(
      "caixa",
      "Caixa",
      ["Mês", "Renda", "Gasto", "Sobra", "Saldo", "Fórmula"],
      rows.map((row, i) => [
        row.label,
        money(row.income),
        money(row.expense),
        money(row.net),
        row.kind === "past" ? "" : money(row.balance),
        i === 0 ? "=B2-C2" : `=B${i + 2}-C${i + 2}`,
      ]),
      nowIdx,
    ),
    tab(
      "categorias",
      "Categorias",
      ["Categoria", "Gasto", "% do mês", "Fórmula"],
      spend.length
        ? spend.map((item, i) => [
            item.name,
            money(item.amount),
            current.expense ? pct((item.amount / current.expense) * 100) : "0,0%",
            `=SE(Caixa!C${nowIdx + 2}=0;0;B${i + 2}/Caixa!C${nowIdx + 2})`,
          ])
        : [["Sem gasto neste mês", "0,00", "0,0%", "=SOMASE(Lancamentos[Categoria];A2;Lancamentos[Valor])"]],
    ),
    tab(
      "503020",
      "50-30-20",
      ["Bloco", "Teto", "Gasto", "Folga", "Fórmula"],
      [
        ["Necessidade 50%", money(split.need), money(used.need), money(split.need - used.need), "=Renda*0,5"],
        ["Lazer 30%", money(split.want), money(used.want), money(split.want - used.want), "=Renda*0,3"],
        ["Guardar 20%", money(split.save), money(used.other), money(split.save - used.other), "=Renda*0,2"],
      ],
    ),
    tab(
      "dividas",
      "Contas fixas",
      ["Conta", "Valor/mês", "Se baixar 15%", "Fórmula"],
      recurring.length
        ? recurring.slice(0, 16).map((item) => [item.description, money(item.amount), money(Math.round(item.amount * 0.15)), "=B2*0,15"])
        : [["Nenhuma conta fixa ainda", "0,00", "0,00", "=B2*0,15"]],
    ),
    tab(
      "reserva",
      "Reserva",
      ["Indicador", "Valor", "Fórmula", "Leitura"],
      [
        ["Saldo", money(balance), "=SOMA(Contas[Saldo])", ""],
        ["Essencial do mês", money(essential), "=SOMASE(Categorias[Bloco];\"necessidade\";Categorias[Gasto])", ""],
        ["Meses de reserva", months == null ? "—" : months.toFixed(1), "=SE(B3=0;0;B2/B3)", months == null ? "Lance o essencial" : months < 3 ? "Abaixo de 3 meses" : "No caminho"],
        ["Alvo 6 meses", money(essential * 6), "=B3*6", ""],
      ],
    ),
    tab(
      "orcamento",
      "Orçado",
      ["Categoria", "Orçado", "Real", "Diferença", "Fórmula"],
      budgets.length
        ? budgets.map((item) => {
            const name = cats.find((c) => c.id === item.categoryId)?.name ?? "Categoria";
            const real = spend.find((s) => s.name === name)?.amount ?? 0;
            return [name, money(item.amount), money(real), money(item.amount - real), "=B2-C2"];
          })
        : spend.slice(0, 8).map((item) => [item.name, "0,00", money(item.amount), money(-item.amount), "=B2-C2"]),
    ),
  ];

  if (full) {
    tabs.push(
      tab(
        "metas",
        "Metas",
        ["Meta", "Alvo", "Prazo", "Falta no caixa", "Fórmula"],
        goals.length
          ? goals.map((goal) => [goal.name, money(goal.target), goal.deadline.slice(0, 10), money(Math.max(0, goal.target - balance)), "=MAX(0;B2-Reserva!B2)"])
          : [["Sem meta ainda", "0,00", "", "0,00", "=MAX(0;B2-Reserva!B2)"]],
      ),
    );
  }

  return tabs;
}

function companyTabs(
  workspaceId: string,
  rows: SheetRow[],
  now: string,
  today: string,
  current: ReturnType<typeof monthSummary>,
  balance: number,
  incomeAvg: number,
  expenseAvg: number,
  full: boolean,
) {
  const nowSplit = splitExpenses(workspaceId, now);
  const bills = billsOverview(workspaceId);
  const openBills = listBills(workspaceId);
  const centers = spendByCostCenter(workspaceId);
  const spend = categorySpend(workspaceId, now);
  const margin = current.income > 0 ? (current.net / current.income) * 100 : 0;
  const burn = current.net < 0 ? Math.abs(current.net) : 0;
  const runway = burn ? balance / burn : 0;
  const giro = bills.receivables - bills.payables;
  const nowIdx = rows.findIndex((row) => row.kind === "now");
  const team = listTeam(workspaceId);
  const locked = listLockedMonths(workspaceId);
  const reconciled = listReconciledIds(workspaceId).length;
  const txs = listTransactions(workspaceId).length;

  const tabs: SheetTab[] = [
    tab("painel", "Painel", ["Indicador", "Valor", "Fórmula", "Leitura"], [
      ["Receita do mês", money(current.income), '=SOMASE(Lancamentos[Tipo];"Receita";Lancamentos[Valor])', ""],
      ["Custos + operação", money(current.expense), '=SOMASE(Lancamentos[Tipo];"Despesa";Lancamentos[Valor])', ""],
      ["Resultado", money(current.net), "=B2-B3", current.net >= 0 ? "No azul" : "No vermelho"],
      ["Margem", pct(margin), "=SE(B2=0;0;B4/B2)", margin >= 20 ? "Saudável" : margin >= 8 ? "Apertada" : "Crítica"],
      ["Caixa", money(balance), "=SOMA(Contas[Saldo])", ""],
      ["A receber", money(bills.receivables), "=SOMASE(Receber[Status];\"Aberto\";Receber[Valor])", bills.overdueRec ? "Tem atraso" : "Em dia"],
      ["A pagar", money(bills.payables), "=SOMASE(Pagar[Status];\"Aberto\";Pagar[Valor])", bills.overduePay ? "Tem atraso" : "Em dia"],
      ["Capital de giro", money(giro), "=B7-B8", giro >= 0 ? "Cobre os títulos" : "Giro negativo"],
      ["Burn", money(burn), "=SE(B4>=0;0;-B4)", burn ? "Caixa caindo" : "Sem burn"],
      ["Runway (meses)", burn ? runway.toFixed(1) : "—", "=SE(B10=0;\"sem burn\";B6/B10)", burn && runway < 3 ? "Abaixo de 3 meses" : ""],
    ]),
    tab(
      "caixa",
      "Caixa",
      ["Mês", "Receita", "Custos", "Folha", "Impostos", "Marketing", "Infra", "OpEx", "Resultado", "Saldo", "Margem", "Fórmula"],
      rows.map((row) => {
        const split = row.kind === "future" ? null : splitExpenses(workspaceId, row.month);
        const cogs = split?.cogs ?? Math.round(row.expense * 0.25);
        const payroll = split?.payroll ?? Math.round(row.expense * 0.2);
        const tax = split?.tax ?? Math.round(row.expense * 0.12);
        const mkt = split?.mkt ?? Math.round(row.expense * 0.08);
        const infra = split?.infra ?? Math.round(row.expense * 0.1);
        const opex = split?.opex ?? Math.max(0, row.expense - cogs - payroll - tax - mkt - infra);
        const m = row.income ? (row.net / row.income) * 100 : 0;
        return [
          row.label,
          money(row.income),
          money(cogs),
          money(payroll),
          money(tax),
          money(mkt),
          money(infra),
          money(opex),
          money(row.net),
          row.kind === "past" ? "" : money(row.balance),
          pct(m),
          "=B2-SOMA(C2:H2)",
        ];
      }),
      nowIdx,
    ),
    tab("dre", "DRE", ["Linha", "Valor", "Fórmula"], [
      ["(=) Receita líquida", money(current.income), '=SOMASE(Lancamentos[Tipo];"Receita";Lancamentos[Valor])'],
      ["(−) Custos do serviço", money(nowSplit.cogs), '=SOMASE(Lancamentos[Grupo];"Custos";Lancamentos[Valor])'],
      ["(=) Lucro bruto", money(current.income - nowSplit.cogs), "=B2-B3"],
      ["(−) Folha", money(nowSplit.payroll), '=SOMASE(Lancamentos[Grupo];"Folha";Lancamentos[Valor])'],
      ["(−) Impostos", money(nowSplit.tax), '=SOMASE(Lancamentos[Grupo];"Impostos";Lancamentos[Valor])'],
      ["(−) Marketing", money(nowSplit.mkt), '=SOMASE(Lancamentos[Grupo];"Marketing";Lancamentos[Valor])'],
      ["(−) Infra / ferramentas", money(nowSplit.infra), '=SOMASE(Lancamentos[Grupo];"Infra";Lancamentos[Valor])'],
      ["(−) Demais despesas", money(nowSplit.opex), '=SOMASE(Lancamentos[Grupo];"OpEx";Lancamentos[Valor])'],
      ["(=) Resultado do período", money(current.net), "=B4-SOMA(B5:B8)"],
      ["Margem", pct(margin), "=SE(B2=0;0;B10/B2)"],
    ]),
    tab(
      "fluxo",
      "Fluxo",
      ["Mês", "Entradas", "Saídas", "Variação", "Saldo", "Fórmula"],
      rows.map((row, i) => [
        row.label,
        money(row.income),
        money(row.expense),
        money(row.net),
        row.kind === "past" ? "" : money(row.balance),
        i === 0 ? "=B2-C2" : `=E${i + 1}+B${i + 2}-C${i + 2}`,
      ]),
      nowIdx,
    ),
    tab(
      "receber",
      "A receber",
      ["Cliente", "Descrição", "Vencimento", "Valor", "Status", "Atraso"],
      openBills.filter((b) => b.kind === "RECEIVABLE").length
        ? openBills
            .filter((b) => b.kind === "RECEIVABLE")
            .slice(0, 20)
            .map((b) => [b.partyName, b.description, b.due, money(b.amount), b.status === "OPEN" ? "Aberto" : "Baixado", b.status === "OPEN" && b.due < today ? "Sim" : ""])
        : [["Sem título a receber", "", "", "0,00", "—", ""]],
    ),
    tab(
      "pagar",
      "A pagar",
      ["Fornecedor", "Descrição", "Vencimento", "Valor", "Status", "Atraso"],
      openBills.filter((b) => b.kind === "PAYABLE").length
        ? openBills
            .filter((b) => b.kind === "PAYABLE")
            .slice(0, 20)
            .map((b) => [b.partyName, b.description, b.due, money(b.amount), b.status === "OPEN" ? "Aberto" : "Baixado", b.status === "OPEN" && b.due < today ? "Sim" : ""])
        : [["Sem título a pagar", "", "", "0,00", "—", ""]],
    ),
    tab(
      "centros",
      "Centros",
      ["Centro de custo", "Gasto", "%", "Fórmula"],
      centers.length
        ? centers.map((c, i) => [c.name, money(c.amount), current.expense ? pct((c.amount / current.expense) * 100) : "0,0%", `=SE(Painel!B3=0;0;B${i + 2}/Painel!B3)`])
        : [["Sem centro cadastrado", "0,00", "0,0%", "=SOMASE(Lancamentos[Centro];A2;Lancamentos[Valor])"]],
    ),
    tab(
      "impostos",
      "Impostos",
      ["Tributo", "Base", "Alíquota", "Valor", "Fórmula"],
      [
        ["DAS / simples (exemplo 6%)", money(current.income), "6%", money(Math.round(current.income * 0.06)), "=B2*C2"],
        ["Impostos lançados no mês", money(current.income), "", money(nowSplit.tax), '=SOMASE(Lancamentos[Grupo];"Impostos";Lancamentos[Valor])'],
        ["Carga efetiva", money(current.income), current.income ? pct((nowSplit.tax / current.income) * 100) : "0,0%", money(nowSplit.tax), "=SE(B2=0;0;D3/B2)"],
      ],
    ),
    tab("giro", "Giro", ["Indicador", "Valor", "Fórmula", "Regra"], [
      ["A receber", money(bills.receivables), "=SOMA(Receber[Valor])", "Não gaste o que ainda não caiu"],
      ["A pagar", money(bills.payables), "=SOMA(Pagar[Valor])", "Pague no vencimento, não antes se o caixa apertar"],
      ["Atraso a receber", money(bills.overdueRec), "=SOMASE(Receber[Atraso];\"Sim\";Receber[Valor])", "Cobrar"],
      ["Atraso a pagar", money(bills.overduePay), "=SOMASE(Pagar[Atraso];\"Sim\";Pagar[Valor])", "Negociar"],
      ["Caixa livre estimado", money(balance - bills.payables + bills.receivables), "=Painel!B6-B3+B2", ""],
    ]),
    tab("indicadores", "Indicadores", ["KPI", "Valor", "Fórmula", "Referência"], [
      ["Ticket médio (mês)", current.income ? money(current.income) : "0,00", "=Receita/Clientes", "Suba preço ou volume, não os dois no escuro"],
      ["Margem", pct(margin), "=Resultado/Receita", "Alvo de serviço: 20%+"],
      ["Burn", money(burn), "=SE(Resultado>=0;0;-Resultado)", "Zero é o alvo"],
      ["Runway", burn ? `${runway.toFixed(1)} meses` : "sem burn", "=Caixa/Burn", "Mínimo 3 meses"],
      ["Receita média", money(incomeAvg), "=MÉDIA(Caixa[Receita])", ""],
      ["Despesa média", money(expenseAvg), "=MÉDIA(Caixa[Custos]:Caixa[OpEx])", ""],
    ]),
  ];

  if (spend.length) {
    tabs.splice(
      4,
      0,
      tab(
        "orcado-real",
        "Orçado x real",
        ["Categoria", "Real", "% receita", "Fórmula"],
        spend.map((item) => [
          item.name,
          money(item.amount),
          current.income ? pct((item.amount / current.income) * 100) : "0,0%",
          "=SE(Painel!B2=0;0;B2/Painel!B2)",
        ]),
      ),
    );
  }

  if (full) {
    tabs.push(
      tab("fechamento", "Fechamento", ["Etapa", "Status", "Fórmula / regra"], [
        ["Lançamentos do mês conferidos", txs ? "Em aberto" : "Sem movimento", "Não fecha com lançamento solto"],
        ["Títulos baixados ou justificados", bills.openCount ? `${bills.openCount} em aberto` : "Limpo", "=CONT.SE(Receber[Status];\"Aberto\")"],
        ["Mês travado", locked.includes(now) ? "Travado" : "Aberto", locked.includes(now) ? "Não mexe mais neste mês" : "Feche quando a DRE bater com o banco"],
        ["Conciliação", reconciled ? `${reconciled} linhas batidas` : "Pendente", "=Banco − Livro = 0"],
      ]),
      tab(
        "equipe",
        "Equipe",
        ["Pessoa", "E-mail", "Papel"],
        team.length ? team.map((seat) => [seat.name, seat.email, seat.role]) : [["Só o dono", "", "ADMIN"]],
      ),
      tab("conciliacao", "Conciliação", ["Conta", "No app", "Regra"], [
        ["Linhas no livro", String(txs), "Cada gasto tem que existir no banco ou no caixa"],
        ["Linhas conciliadas", String(reconciled), "=Livro − Extraído do banco"],
        ["Diferença", String(Math.max(0, txs - reconciled)), "=B2-B3 deve ser 0 no fechamento"],
      ]),
    );
  }

  return tabs;
}
