import { financePulse } from "./accountant";
import { searchKnowledge } from "./finance-knowledge";
import { brl, monthKey } from "./money";
import { buildDre, billsOverview } from "./ops";
import { accountBalances, monthSummary } from "./queries";
import { analyzeCompany, parseCompanySize, wantsCompanyAnalysis } from "./company-biz";

export type JarvisReply = { body: string };

function n(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function jarvisCompanyReply(message: string, workspaceId: string, market?: {
  usd?: number | null;
  usdPct?: string | number | null;
  selic?: string | number | null;
  ibovPct?: number | null;
}): JarvisReply {
  const t = n(message);
  const month = monthKey();
  const dre = buildDre(workspaceId, month);
  const bills = billsOverview(workspaceId);
  const summary = monthSummary(workspaceId, month);
  const balance = accountBalances(workspaceId).reduce((s, a) => s + a.balance, 0);

  if (/(senha|token|cvv|cartao)/.test(t)) {
    return { body: "Eu não peço senha, código do banco nem cartão. Jarvis é no site da CodeCraft, não aqui." };
  }

  const size = parseCompanySize(message);
  if (size || wantsCompanyAnalysis(message)) {
    return { body: analyzeCompany(workspaceId, size ?? undefined) };
  }

  if (/(dre|resultado|margem|lucro)/.test(t)) {
    return {
      body:
        `DRE do mês: receita ${brl(dre.income)}, despesa ${brl(dre.expense)}, resultado ${brl(dre.net)} (${dre.margin}%). ` +
        (dre.net < 0 ? "Está negativo: corta operacional e marketing antes de folha." : "Azul. Reserva 10% e não inchas custo fixo."),
    };
  }

  if (/(titulo|título|pagar|receber|atras)/.test(t)) {
    return {
      body:
        `Tesouraria: a pagar ${brl(bills.payables)}, a receber ${brl(bills.receivables)}. ` +
        (bills.overduePay ? `Atraso a pagar ${brl(bills.overduePay)} — isso é prioridade hoje. ` : "Sem atraso a pagar. ") +
        `Abre Títulos, baixa o que já saiu do banco.`,
    };
  }

  if (/(ideia|melhorar|futuro|inovar|cliente|prospec|quem precisa|achar|instagram)/.test(t)) {
    return {
      body:
        "Isso é do Jarvis, no painel da CodeCraft — projeto e cliente. Aqui no Finanças eu cuido do caixa: DRE, título, planilha e o que entra ou sai.",
    };
  }

  if (/(mercado|dolar|selic|bolsa)/.test(t) && market) {
    return {
      body:
        `Mercado: dólar R$ ${market.usd ?? "—"} (${market.usdPct ?? "—"}%), Selic ${market.selic ?? "—"}%. ` +
        (Number(market.selic) >= 13
          ? "Juro alto: vende PIX à vista e Finanças, não projeto parcelado."
          : "Fecha site e loja de crescimento. Caixa da empresa: " + brl(balance) + "."),
    };
  }

  const know = searchKnowledge(message, 2)
    .map((item) => item.body)
    .join(" ");
  if (know) {
    const pulse = financePulse(workspaceId);
    return {
      body: `${know} No caixa da empresa: saldo ${brl(balance)}, entrou ${brl(summary.income)}, saiu ${brl(summary.expense)}. Situação ${pulse.label.toLowerCase()}.`,
    };
  }

  const pulse = financePulse(workspaceId);
  return {
    body:
      `Contador da empresa — do autônomo à tesouraria grande. Situação ${pulse.label.toLowerCase()}. Saldo ${brl(balance)}. Este mês entrou ${brl(summary.income)} e saiu ${brl(summary.expense)}. ` +
      `A pagar ${brl(bills.payables)}, a receber ${brl(bills.receivables)}. ` +
      `Pede análise, diz o porte (autônomo, MEI, pequena, grande) ou manda a planilha. Pessoa fica no outro espaço.`,
  };
}
