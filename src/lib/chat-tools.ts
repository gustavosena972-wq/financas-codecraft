import { brl, monthKey } from "./money";
import { categorySpend, monthSummary, accountBalances } from "./queries";
import { split503020, bucketSpend, reserveMonths, reserveHint, housingCap, cutSave, sellPrice } from "./tools";
import { billsOverview, buildDre } from "./ops";
import { workspaceToolsPaid, type PlanId } from "./plans";
import { analyzeCompany } from "./company-biz";

export type ChatTool = {
  id: string;
  label: string;
  company?: boolean;
};

export function toolsForChat(plan: PlanId | string | null | undefined, company: boolean): ChatTool[] {
  if (company) {
    const tools: ChatTool[] = [{ id: "analise", label: "Análise", company: true }];
    if (workspaceToolsPaid(plan, company)) {
      tools.push(
        { id: "giro", label: "Giro", company: true },
        { id: "preco", label: "Preço", company: true },
        { id: "dre", label: "DRE", company: true },
        { id: "titulos", label: "Títulos", company: true },
      );
      if (plan === "ENTERPRISE") tools.push({ id: "fechar", label: "Fechar mês", company: true });
    }
    return tools;
  }
  if (!workspaceToolsPaid(plan, company)) return [];
  const tools: ChatTool[] = [
    { id: "503020", label: "50-30-20" },
    { id: "corte", label: "Corte" },
    { id: "moradia", label: "Moradia" },
    { id: "reserva", label: "Reserva" },
  ];
  if (plan === "PLUS") tools.push({ id: "divida", label: "Dívida" });
  return tools;
}

export function runChatTool(id: string, workspaceId: string, company: boolean) {
  const month = monthKey();
  const summary = monthSummary(workspaceId, month);
  const spend = categorySpend(workspaceId, month);
  const balance = accountBalances(workspaceId).reduce((s, a) => s + a.balance, 0);

  if (id === "503020") {
    const split = split503020(summary.income);
    const used = bucketSpend(spend);
    return summary.income
      ? `50-30-20 neste mês: necessidade ${brl(split.need)} (você gastou ${brl(used.need)}), lazer ${brl(split.want)} (gastou ${brl(used.want)}), guardar ${brl(split.save)}.`
      : "Ainda não entrou salário neste mês. Fala o ganho ou manda a planilha.";
  }
  if (id === "corte") {
    const top = spend[0];
    if (!top) return "Ainda não tem gasto para cortar. Manda a planilha ou fala o que saiu.";
    const save = cutSave(top.amount, 20);
    return `O que mais pesa é ${top.name} (${brl(top.amount)}). Cortar 20% libera ${brl(save)} por mês. Se gostar, eu só anoto a ideia — não mexo na planilha sozinho.`;
  }
  if (id === "moradia") {
    const moradia = spend.find((s) => /moradia|aluguel/i.test(s.name))?.amount ?? 0;
    const cap = housingCap(summary.income);
    return summary.income
      ? `Teto saudável de moradia: ${brl(cap)} (30% do que entra). Hoje está ${brl(moradia)}.`
      : "Sem renda neste mês eu não fecho o teto de moradia.";
  }
  if (id === "reserva") {
    const essential = spend.filter((s) => /moradia|aluguel|luz|agua|saúde|saude|mercado|aliment/i.test(s.name)).reduce((s, r) => s + r.amount, 0) || summary.expense;
    const months = reserveMonths(balance, essential);
    return `Saldo ${brl(balance)}. Essencial cerca de ${brl(essential)}. ${reserveHint(months)}${months != null ? ` Isso dá ${months.toFixed(1)} mês(es).` : ""}`;
  }
  if (id === "divida") {
    return "Para simular a dívida, fala assim: dívida 5000 parcela 400 juro 3. Eu conto em quantos meses acaba. Sem isso eu não invento número.";
  }
  if (id === "analise") {
    return analyzeCompany(workspaceId);
  }
  if (id === "giro" || (company && id === "titulos")) {
    const bills = billsOverview(workspaceId);
    return `Tesouraria: a pagar ${brl(bills.payables)}, a receber ${brl(bills.receivables)}. ${bills.overduePay ? `Atraso a pagar ${brl(bills.overduePay)}.` : "Sem atraso a pagar."} Não gaste o que ainda não caiu.`;
  }
  if (id === "preco") {
    const sample = sellPrice(10000, 6, 30);
    if ("error" in sample) return sample.error ?? "Não deu para precificar.";
    return `Exemplo: custo R$ 100 + 6% imposto + 30% margem = ${brl(sample.price)}. Fala o custo do seu serviço que eu recalculo.`;
  }
  if (id === "dre") {
    const dre = buildDre(workspaceId, month);
    return `DRE do mês: receita ${brl(dre.income)}, despesa ${brl(dre.expense)}, resultado ${brl(dre.net)} (${dre.margin}%).`;
  }
  if (id === "fechar") {
    return "Fechar o mês trava lançamento. Isso é do Empresa 200. Abre DRE e use Fechar mês quando a conta bater com o banco.";
  }
  return "Essa ferramenta não está neste espaço.";
}

export function wantsSheetCreate(text: string) {
  return /(faz(er)? uma planilha|montar planilha|criar planilha|planilha pronta|nao tenho planilha|não tenho planilha)/.test(text);
}

export function wantsApply(text: string) {
  return /^(sim|pode|aplica|gostei|pode aplicar|pode mudar|manda|confirmo|ok, aplica)\b/.test(text) || /(pode aplicar|aplica isso|gostei, aplica|pode mudar)/.test(text);
}

export function wantsReject(text: string) {
  return /^(nao|não|deixa|cancela)\b/.test(text) || /(nao muda|não muda|nao gosto|não gosto|deixa como esta|deixa como está)/.test(text);
}
