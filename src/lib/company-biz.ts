import { brl, formatMonthLabel, monthKey, shiftMonth } from "./money";
import { billsOverview, buildDre } from "./ops";
import { accountBalances, categorySpend, monthSummary } from "./queries";
import { loadMonthPlan } from "./month-plan";
import { listTeam } from "./store";
import { split503020 } from "./tools";
import type { OrganizeResult } from "./organize";

export type CompanySize = "autonomo" | "mei" | "pequena" | "grande";

export const COMPANY_SIZES: { id: CompanySize; name: string; hint: string }[] = [
  { id: "autonomo", name: "Autônomo", hint: "Cobra serviço no CPF ou no CNPJ de um. Sem folha." },
  { id: "mei", name: "MEI", hint: "CNPJ simples, DAS todo mês, teto de faturamento." },
  { id: "pequena", name: "Empresa pequena", hint: "Simples, poucos sócios, às vezes folha." },
  { id: "grande", name: "Empresa grande", hint: "Equipe, centros, DRE, fechamento e conciliação." },
];

function storageKey(workspaceId: string) {
  return `fc-company-size-${workspaceId}`;
}

export function loadCompanySize(workspaceId: string): CompanySize | null {
  if (typeof window === "undefined" || !workspaceId) return null;
  try {
    const raw = localStorage.getItem(storageKey(workspaceId));
    if (raw === "autonomo" || raw === "mei" || raw === "pequena" || raw === "grande") return raw;
    return null;
  } catch {
    return null;
  }
}

export function saveCompanySize(workspaceId: string, size: CompanySize) {
  if (typeof window === "undefined" || !workspaceId) return;
  localStorage.setItem(storageKey(workspaceId), size);
}

export function parseCompanySize(text: string): CompanySize | null {
  const t = text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  if (/\bmei\b|microempreendedor/.test(t)) return "mei";
  if (/autonomo|freelancer|pj (de )?um|trabalh(o|a) sozinh/.test(t)) return "autonomo";
  if (/empresa grande|corporativ|tesouraria cheia|muita equipe|varios centros/.test(t)) return "grande";
  if (/empresa pequena|pequena empresa|simples nacional|tenho (um )?socio|folha (de )?pagamento/.test(t)) return "pequena";
  return null;
}

export function inferCompanySize(workspaceId: string): CompanySize {
  const saved = loadCompanySize(workspaceId);
  if (saved) return saved;
  const month = monthKey();
  const spend = categorySpend(workspaceId, month);
  const team = listTeam(workspaceId);
  const payroll = spend.filter((item) => /folha|salario|pro.?labore|clt/i.test(item.name)).reduce((s, item) => s + item.amount, 0);
  if (team.length > 2) return "grande";
  if (payroll > 0) return "pequena";
  const summary = monthSummary(workspaceId, month);
  if (summary.income > 2500000) return "pequena";
  return "autonomo";
}

export function sizeLabel(size: CompanySize) {
  return COMPANY_SIZES.find((item) => item.id === size)?.name ?? "Empresa";
}

function moneyCell(cents: number) {
  return brl(cents);
}

export type CompanyDiagnosis = {
  size: CompanySize;
  sizeName: string;
  month: string;
  income: number;
  expense: number;
  net: number;
  margin: number;
  balance: number;
  payables: number;
  receivables: number;
  overduePay: number;
  overdueRec: number;
  payroll: number;
  tax: number;
  nextFree: number;
  dasHint: number;
  prolabore: number;
  lines: string[][];
};

export function diagnoseCompany(workspaceId: string, size = inferCompanySize(workspaceId)): CompanyDiagnosis {
  const month = monthKey();
  const summary = monthSummary(workspaceId, month);
  const dre = buildDre(workspaceId, month);
  const bills = billsOverview(workspaceId);
  const balance = accountBalances(workspaceId).reduce((s, a) => s + a.balance, 0);
  const spend = categorySpend(workspaceId, month);
  const payroll = spend.filter((item) => /folha|salario|pro.?labore|clt/i.test(item.name)).reduce((s, item) => s + item.amount, 0);
  const tax = spend.filter((item) => /imposto|das|inss|iss/i.test(item.name)).reduce((s, item) => s + item.amount, 0);
  const plan = loadMonthPlan(workspaceId);
  const nextKey = shiftMonth(month, 1);
  const nextPlan = plan.find((item) => item.month === nextKey);
  const nextFree = nextPlan ? nextPlan.income - nextPlan.expense : summary.income - summary.expense;
  const dasHint = Math.round(summary.income * 0.06);
  const prolabore = spend.find((item) => /pro.?labore/i.test(item.name))?.amount ?? 0;
  const margin = dre.margin;
  const lines: string[][] = [
    ["Porte", sizeLabel(size), ""],
    ["Mês", formatMonthLabel(month), ""],
    ["Receita", moneyCell(summary.income), "O que entrou no caixa"],
    ["Despesa", moneyCell(summary.expense), "O que saiu"],
    ["Resultado", moneyCell(summary.net), summary.net >= 0 ? "No azul" : "No vermelho"],
    ["Margem", `${margin}%`, margin >= 20 ? "Saudável para serviço" : margin >= 8 ? "Apertada" : "Crítica"],
    ["Caixa", moneyCell(balance), ""],
    ["A receber", moneyCell(bills.receivables), bills.overdueRec ? "Tem atraso" : "Em dia"],
    ["A pagar", moneyCell(bills.payables), bills.overduePay ? "Tem atraso" : "Em dia"],
    ["Folha / pró-labore", moneyCell(payroll || prolabore), payroll || prolabore ? "" : "Ainda não lançou"],
    ["Imposto / DAS", moneyCell(tax || dasHint), tax ? "Lançado" : "Estimativa 6% da receita"],
    ["Livre no próximo mês", moneyCell(nextFree), nextFree >= 0 ? "Cabe o mês" : "Vai apertar"],
  ];
  return {
    size,
    sizeName: sizeLabel(size),
    month,
    income: summary.income,
    expense: summary.expense,
    net: summary.net,
    margin,
    balance,
    payables: bills.payables,
    receivables: bills.receivables,
    overduePay: bills.overduePay,
    overdueRec: bills.overdueRec,
    payroll,
    tax,
    nextFree,
    dasHint,
    prolabore,
    lines,
  };
}

function sizeAdvice(d: CompanyDiagnosis) {
  if (d.size === "autonomo") {
    return [
      "Autônomo: o dinheiro do serviço e o da casa não se misturam. Este espaço é só do trabalho.",
      d.income
        ? `Este mês o serviço trouxe ${brl(d.income)}. Guarda imposto (cerca de ${brl(d.dasHint)} se for um DAS/simples de 6%) antes de gastar o resto.`
        : "Ainda não tem receita lançada. Fala o que cada cliente pagou, ou preenche a aba Orçamento.",
      d.prolabore || d.payroll
        ? `Você já tirou ${brl(d.prolabore || d.payroll)} para si. Só tira de novo se o caixa do mês que vem continuar positivo (${brl(d.nextFree)}).`
        : "Defina um pró-labore fixo. O que sobrar é lucro, não padaria do fim de semana.",
      "Preço: custo do trabalho + imposto + margem. Se cobrar só o que o cliente quer, você trabalha de graça.",
    ];
  }
  if (d.size === "mei") {
    return [
      "MEI: DAS todo mês, mesmo sem faturar. Não deixa atrasar — o CNPJ trava.",
      d.income
        ? `Faturamento do mês ${brl(d.income)}. Multiplica por 12 na cabeça: se passar do teto anual, planeja migrar para ME antes da Receita te empurrar.`
        : "Lança as notas e o PIX dos clientes. Sem isso eu não sei se o teto do MEI está perto.",
      `Reserva de imposto: ${brl(d.tax || d.dasHint)} este mês. O DAS é custo fixo; o resto do tributo sobe com a nota.`,
      "MEI não tem folha CLT de verdade. Prestador e sócio misturado no mesmo PIX vira confusão no Imposto de Renda.",
    ];
  }
  if (d.size === "pequena") {
    return [
      "Empresa pequena: o caixa morre em folha, DAS e fornecedor — nessa ordem.",
      d.payroll
        ? `Folha ${brl(d.payroll)}. Se passar de 40% da receita (${brl(d.income)}), a margem some. Congela contratação.`
        : "Ainda não vi folha. Se tem CLT ou pró-labore, lança. Senão o DRE mente.",
      d.receivables > d.balance
        ? `Tem ${brl(d.receivables)} a receber e só ${brl(d.balance)} no caixa. Não gaste o que o cliente ainda não pagou.`
        : `Giro: a receber ${brl(d.receivables)}, a pagar ${brl(d.payables)}.`,
      "Simples Nacional: fecha a guia no vencimento. Atraso vira multa e o banco some quando você mais precisa.",
    ];
  }
  return [
    "Empresa grande: DRE, centros, equipe e conciliação. Lucro no papel e caixa vazio é o erro clássico.",
    `Receita ${brl(d.income)}, despesa ${brl(d.expense)}, margem ${d.margin}%. Alvo de serviço saudável: 20%+.`,
    d.overduePay
      ? `Atraso a pagar ${brl(d.overduePay)}. Tesouraria trata isso hoje, não na reunião de sexta.`
      : `Títulos em dia no atraso a pagar. A receber ${brl(d.receivables)}.`,
    d.net < 0
      ? "Burn no mês. Corta marketing e ferramenta antes de folha. Feche o mês só quando o banco bater com o livro."
      : `Caixa ${brl(d.balance)}. Roda conciliação e trava o mês quando a DRE fechar.`,
  ];
}

export function analyzeCompany(workspaceId: string, size?: CompanySize) {
  const resolved = size ?? inferCompanySize(workspaceId);
  if (size) saveCompanySize(workspaceId, size);
  const d = diagnoseCompany(workspaceId, resolved);
  const lines: string[] = [];
  lines.push(`Análise ${d.sizeName}. Mês ${formatMonthLabel(d.month)}.`);
  if (!d.income && !d.expense) {
    lines.push("Ainda não tem movimento neste espaço. Manda a planilha, preenche o orçamento mês a mês, ou lança o que cada cliente pagou.");
    lines.push(...sizeAdvice(d).slice(0, 2));
    lines.push("Quando tiver número, eu refaço a análise: receita, imposto, folha, giro e o dinheiro livre do mês que vem.");
    return lines.join(" ");
  }
  lines.push(`Entrou ${brl(d.income)}. Saiu ${brl(d.expense)}. Resultado ${brl(d.net)} (margem ${d.margin}%). Caixa ${brl(d.balance)}.`);
  if (d.net >= 0) lines.push("O mês fecha no azul, se o que está a receber realmente cair.");
  else lines.push(`Falta ${brl(Math.abs(d.net))} para zerar. Isso é prejuízo de caixa, não “investimento” se repetir todo mês.`);
  lines.push(`Livre projetado no próximo mês: ${d.nextFree >= 0 ? brl(d.nextFree) : "falta " + brl(Math.abs(d.nextFree))}. Olha a aba Gráficos e a aba Análise.`);
  if (d.overduePay) lines.push(`Prioridade: atraso a pagar ${brl(d.overduePay)}.`);
  if (d.overdueRec) lines.push(`Cobrar: atraso a receber ${brl(d.overdueRec)}.`);
  lines.push(...sizeAdvice(d));
  if (d.income) {
    const split = split503020(d.income);
    if (d.size === "autonomo" || d.size === "mei") {
      lines.push(
        `Régua simples deste faturamento: até ${brl(split.need)} no custo de viver do CNPJ (DAS, ferramenta, internet), ${brl(split.want)} no que pode esperar, ${brl(split.save)} parado para imposto e mês ruim.`,
      );
    }
  }
  lines.push("Se quiser gravar a planilha no controle, fala “pode aplicar”. Eu não mexo sozinho.");
  return lines.join(" ");
}

export function analyzeCompanyFile(result: OrganizeResult, size: CompanySize) {
  const focus = result.months.filter((item) => item.month !== "sem-data");
  const now = monthKey();
  const month = focus.find((item) => item.month === now) ?? focus[focus.length - 1] ?? result.months[0];
  if (!month) return "Abri o arquivo da empresa, mas não achei mês com valor.";
  const leftover = month.income - month.expense;
  const lines: string[] = [];
  lines.push(`Abri a planilha da ${sizeLabel(size)}${result.filename ? ` (${result.filename})` : ""}.`);
  lines.push(`Mês ${month.month === "sem-data" ? "do arquivo" : formatMonthLabel(month.month)}: entra ${brl(month.income)}, sai ${brl(month.expense)}, ${leftover >= 0 ? "sobra " + brl(leftover) : "falta " + brl(Math.abs(leftover))}.`);
  if (size === "autonomo" || size === "mei") {
    lines.push(`Separa ${brl(Math.round(month.income * 0.06))} para DAS/imposto antes de gastar o que sobrou. Não mistura com a conta da casa.`);
  } else {
    lines.push("Olha folha, imposto e o que está a pagar. Lucro no arquivo não paga boleto se o cliente atrasar.");
  }
  lines.push("A aba Análise e a aba Gráficos estão embaixo. Só gravo no controle se você falar “pode aplicar”.");
  return lines.join(" ");
}

export function wantsCompanyAnalysis(text: string) {
  const t = text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  return /(analis|diagnost|como (esta|está) (a )?(empresa|caixa|mei)|saude da empresa|saúde da empresa|porte|sou (autonomo|mei)|empresa (pequena|grande))/.test(t);
}
