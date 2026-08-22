import { searchKnowledge } from "./finance-knowledge";
import { brl, formatMonthLabel, monthKey, parseMoneyToCents } from "./money";
import { accountBalances, categorySpend, cashflowSeries, monthSummary } from "./queries";
import { listBudgets, listCategories } from "./store";

export type ChatSpend = {
  type: "INCOME" | "EXPENSE";
  description: string;
  amount: number;
};

export type ChatBudget = {
  categoryName: string;
  amount: number;
};

export type TxCite = {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: string;
};

export type AccountantReply = {
  body: string;
  spends?: ChatSpend[];
  budget?: ChatBudget;
  evidence?: TxCite[];
};

function n(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function toNum(raw: string) {
  return parseMoneyToCents(raw);
}

function isMath(t: string) {
  return /(quanto (e|eh)|calcul|soma|menos |\d+\s*%\s*(de|do)|\d+(?:[.,]\d+)?\s*[\+\-\*x\/]\s*\d+)/.test(t);
}

function plainNum(raw: string) {
  const value = Number(String(raw).replace(/\./g, "").replace(",", "."));
  return Number.isFinite(value) ? value : null;
}

function evalMath(text: string): number | null {
  const pct = text.match(/(\d+(?:[.,]\d+)?)\s*%\s*(?:de|do)\s*(?:r\$\s*)?(\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?|\d+(?:[.,]\d{1,2})?)/i);
  if (pct) {
    const a = plainNum(pct[1]);
    const b = toNum(pct[2]);
    if (a == null || b == null) return null;
    return Math.round(b * (a / 100));
  }
  const chain = text.replace(/r\$/gi, "").match(/(\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?|\d+(?:[.,]\d{1,2})?)(?:\s*[\+\-\*x\/]\s*(?:\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?|\d+(?:[.,]\d{1,2})?))+/);
  if (!chain) return null;
  const tokens = chain[0].split(/\s*([\+\-\*x\/])\s*/).filter(Boolean);
  let acc = toNum(tokens[0] ?? "");
  if (acc == null) return null;
  for (let i = 1; i < tokens.length - 1; i += 2) {
    const op = tokens[i];
    const next = toNum(tokens[i + 1] ?? "");
    if (next == null) return null;
    if (op === "+") acc += next;
    else if (op === "-") acc -= next;
    else if (op === "*" || op === "x") acc = Math.round((acc * next) / 100);
    else if (op === "/") acc = next ? Math.round((acc * 100) / next) : acc;
  }
  return acc;
}

const NOISE =
  /^(gastei|paguei|pago|despesa|despesas|gasto|gastos|saiu|saida|tenho|meu|minha|foi|foi de|no|na|de|do|da|em|com|para|pra|o|a|um|uma|reais|real|r\$|recebi|ganho|ganhei|entrou|salario|receita)$/;

function cleanDesc(raw: string) {
  const words = raw
    .replace(/[“”"']/g, "")
    .split(/\s+/)
    .filter((w) => !NOISE.test(n(w)));
  const desc = words.join(" ").replace(/^[\s\-–:,.]+|[\s\-–:,.]+$/g, "");
  return desc || "Gasto";
}

export function parseChatSpends(raw: string): ChatSpend[] {
  const t = n(raw);
  if (isMath(t) && !/(gastei|paguei|recebi|ganho|salario)/.test(t)) return [];
  if (/(senha|token|cvv)/.test(t)) return [];
  const incomeOnly = /(ganho|ganhei|recebi|salario|entrou|receita)/.test(t) && !/(gastei|paguei|despesa|gasto)/.test(t);
  const looksLike = /(gastei|paguei|pago|despesa|gasto|saiu|tenho .+ de |recebi|ganho|salario|aluguel|ifood|luz|agua|internet)/.test(t);
  if (!looksLike) return [];

  const parts = raw
    .split(/\s*(?:,|;|\be\b)\s*/i)
    .map((p) => p.trim())
    .filter(Boolean);
  const items: ChatSpend[] = [];
  for (const part of parts) {
    const m = part.match(/(?:r\$\s*)?(\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?|\d+(?:[.,]\d{1,2})?)\s*(?:reais?)?/i);
    if (!m) continue;
    const amount = toNum(m[1]);
    if (!amount || amount <= 0) continue;
    const desc = cleanDesc(part.replace(m[0], " "));
    const localIncome = /(salario|freelance|venda|recebi|ganho)/.test(n(part));
    items.push({
      type: incomeOnly || localIncome ? "INCOME" : "EXPENSE",
      description: desc.slice(0, 80),
      amount,
    });
  }
  return items.slice(0, 12);
}

export function citeTransactions(workspaceId: string, query: string, limit = 6): TxCite[] {
  const summary = monthSummary(workspaceId, monthKey());
  const q = n(query);
  const words = q
    .replace(/(quanto|gastei|gastamos|saiu|gasto|gastos|com|de|do|da|em|no|na|este|esse|mes|mês|categoria|lancamento|lançamento)/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !NOISE.test(word));
  const txs = summary.txs.filter((tx) => tx.type !== "TRANSFER");
  const matched = words.length
    ? txs.filter((tx) => {
        const hay = n(`${tx.description} ${tx.category?.name ?? ""}`);
        return words.some((word) => hay.includes(word));
      })
    : txs.filter((tx) => tx.type === "EXPENSE");
  const pick = (matched.length ? matched : txs).slice(0, limit);
  return pick.map((tx) => ({
    id: tx.id,
    date: tx.date.slice(0, 10),
    description: tx.description,
    amount: tx.amount,
    type: tx.type,
  }));
}

function parseBudget(raw: string): ChatBudget | null {
  const t = n(raw);
  const m = raw.match(/(?:teto|orcamento|orçamento|limite)\s+(?:de\s+)?([a-záéíóúãõç\s]+?)\s+(?:de\s+|em\s+|:?\s*)(?:r\$\s*)?(\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?|\d+(?:[.,]\d{1,2})?)/i);
  if (!m) return null;
  const amount = toNum(m[2]);
  if (!amount) return null;
  return { categoryName: m[1].trim(), amount };
}

function housingAdvice(moradia: number, income: number) {
  const lines = [
    "Moradia é o gasto que mais pesa. Não some com ela: baixe o preço, mês a mês.",
    "Aluguel: peça 5% a 10% de desconto na renovação, com PIX em dia. Dono prefere inquilino certo a imóvel vazio.",
    "Financiamento: peça portabilidade se o juro atual estiver menor. Amortize com FGTS o principal, não o prazo, se quiser pagar menos juros.",
    "Condomínio e IPTU: corte extra (salão, vaga extra). IPTU à vista muitas prefeituras dão desconto; se apertar, parcele sem multa.",
    "Se o imóvel ficou caro demais: um quarto alugado, um cômodo a menos, ou mudar 2–3 km já desce o preço sem vender no desespero.",
  ];
  if (income > 0 && moradia / income > 0.3) {
    lines.unshift(
      `Hoje moradia leva ${brl(moradia)} — mais de 30% do que entra. Contador marca isso como alerta. O teto saudável é até 30%.`,
    );
  } else if (moradia > 0) {
    lines.unshift(`Neste mês moradia está em ${brl(moradia)}. Dá para negociar, não precisa sair correndo.`);
  }
  return lines.join(" ");
}

function keepOrCut(spend: ReturnType<typeof categorySpend>, summary: ReturnType<typeof monthSummary>) {
  const keep = new Set(["Moradia", "Saúde", "Educação", "Impostos", "Folha"]);
  const cutFirst = ["Assinaturas", "Lazer", "Compras", "Alimentação", "Marketing"];
  const keepLines: string[] = [];
  const cutLines: string[] = [];
  for (const row of spend) {
    if (keep.has(row.name)) {
      keepLines.push(`${row.name} (${brl(row.amount)}) — mantém. Negocia valor, não cancela de uma vez.`);
    } else if (cutFirst.includes(row.name) || row.amount > 0) {
      const save = Math.round(row.amount * 0.2);
      cutLines.push(`${row.name} (${brl(row.amount)}) — dá para cortar cerca de 20% (${brl(save)}/mês) sem quebrar o mês.`);
    }
  }
  if (!spend.length) {
    return "Ainda não tem gasto neste mês. Fala aqui o que sai (ex.: gastei 200 no mercado) ou manda a planilha / lança na mão.";
  }
  const red = summary.net < 0 ? `O mês está negativo em ${brl(Math.abs(summary.net))}. ` : `Sobra ${brl(summary.net)}. `;
  return (
    red +
    (cutLines.length ? "Cortar primeiro: " + cutLines.slice(0, 3).join(" ") : "") +
    (keepLines.length ? " Manter: " + keepLines.slice(0, 3).join(" ") : "")
  );
}

function snapshot(workspaceId: string) {
  const month = monthKey();
  const summary = monthSummary(workspaceId, month);
  const spend = categorySpend(workspaceId, month);
  const accounts = accountBalances(workspaceId);
  const balance = accounts.reduce((s, a) => s + a.balance, 0);
  const budgets = listBudgets(workspaceId, month);
  const categories = listCategories(workspaceId);
  const moradia = spend.find((s) => /moradia|aluguel/i.test(s.name))?.amount ?? 0;
  const series = cashflowSeries(workspaceId, 6);
  return { month, summary, spend, accounts, balance, budgets, categories, moradia, series };
}

export type HealthLevel = "empty" | "critical" | "medium" | "good";

export type FinancePulse = {
  level: HealthLevel;
  label: string;
  hint: string;
};

export function financePulse(workspaceId: string): FinancePulse {
  const data = snapshot(workspaceId);
  const hasHistory = data.series.some((row) => row.income > 0 || row.expense > 0);
  if (!hasHistory && data.balance === 0) {
    return {
      level: "empty",
      label: "Sem dados",
      hint: "Manda a planilha, lança na mão ou fala o gasto aqui.",
    };
  }
  const { income, expense, net } = data.summary;
  const housingShare = income > 0 ? data.moradia / income : 0;
  const saveRate = income > 0 ? net / income : 0;
  if (data.balance < 0 || (income > 0 && expense > income) || housingShare > 0.5) {
    return {
      level: "critical",
      label: "Crítica",
      hint: "Sai mais do que entra, ou a moradia já come metade da renda.",
    };
  }
  if (income > 0 && saveRate >= 0.1 && data.balance >= 0 && housingShare <= 0.3) {
    return {
      level: "good",
      label: "Boa",
      hint: "Sobra pelo menos 10% e as contas fixas ainda cabem.",
    };
  }
  return {
    level: "medium",
    label: "Média",
    hint: "Não quebrou, mas sobra pouco. Dá para apertar o teto.",
  };
}

function pastReview(series: ReturnType<typeof cashflowSeries>) {
  const used = series.filter((row) => row.income > 0 || row.expense > 0);
  if (!used.length) {
    return "Ainda não tem meses anteriores neste espaço. Manda a planilha do computador, lança na mão o que entrou este mês, ou fala aqui: ganho 4000, aluguel 1500.";
  }
  const lines = used.map((row) => {
    const name = formatMonthLabel(row.month);
    if (row.net >= 0) return `${name}: entrou ${brl(row.income)}, saiu ${brl(row.expense)}, sobrou ${brl(row.net)}`;
    return `${name}: entrou ${brl(row.income)}, saiu ${brl(row.expense)}, faltou ${brl(Math.abs(row.net))}`;
  });
  const last = used[used.length - 1];
  const prev = used.length > 1 ? used[used.length - 2] : null;
  let trend = "Com um mês só ainda é cedo para tendência, mas já dá para montar teto.";
  if (prev) {
    if (last.expense > prev.expense && last.income <= prev.income) {
      trend = "O gasto subiu e a entrada não acompanhou. Se isso repetir no próximo trimestre, o caixa aperta.";
    } else if (last.net > prev.net) {
      trend = "O último mês ficou melhor que o anterior. Segura o que funcionou e corta só o que inchou.";
    } else {
      trend = "O último mês ficou mais apertado. O plano da frente precisa de teto, não de vontade.";
    }
  }
  return `Como foram os meses: ${lines.join(". ")}. ${trend}`;
}

function futurePlan(data: ReturnType<typeof snapshot>) {
  const used = data.series.filter((row) => row.income > 0 || row.expense > 0);
  const sample = used.slice(-3);
  const avgIn = sample.length ? Math.round(sample.reduce((s, r) => s + r.income, 0) / sample.length) : data.summary.income;
  const avgOut = sample.length ? Math.round(sample.reduce((s, r) => s + r.expense, 0) / sample.length) : data.summary.expense;
  const top = data.spend[0];
  const cut = top ? Math.round(top.amount * 0.2) : Math.round(avgOut * 0.1);
  const targetSave = Math.round(avgIn * 0.1);
  const nextOut = Math.max(0, avgOut - cut);
  const parts = [
    `Olhando para a frente, uso a média recente: entra cerca de ${brl(avgIn)} e sai ${brl(avgOut)}.`,
    top
      ? `Se você baixar 20% em ${top.name} (${brl(cut)}), o gasto cai para perto de ${brl(nextOut)}.`
      : `Se você cortar cerca de 10% do que sai (${brl(cut)}), o mês respira.`,
    avgIn > 0
      ? `Alvo simples: guardar ${brl(targetSave)} por mês (10% do que entra). Primeiro o essencial, depois a reserva, só então lazer.`
      : "Quando o salário ou a receita entrar neste espaço, eu fecho o teto em cima do número real.",
  ];
  return parts.join(" ");
}

function budgetLines(data: ReturnType<typeof snapshot>) {
  if (!data.budgets.length) {
    return "Ainda não tem teto gravado. Fala assim: teto alimentação 800. Eu comparo com o que já saiu e aviso se passar.";
  }
  return (
    "Orçamento deste mês: " +
    data.budgets
      .map((b) => {
        const cat = data.categories.find((c) => c.id === b.categoryId);
        const actual = data.spend.find((s) => s.name === cat?.name)?.amount ?? 0;
        const ok = actual <= b.amount;
        return `${cat?.name ?? "Categoria"} teto ${brl(b.amount)}, gasto ${brl(actual)}${ok ? " (dentro)" : " (passou)"}`;
      })
      .join(". ")
  );
}

function pulseLine(pulse: FinancePulse) {
  if (pulse.level === "critical") return `Alerta: situação crítica. ${pulse.hint}`;
  if (pulse.level === "good") return `Alerta: situação boa. ${pulse.hint}`;
  if (pulse.level === "medium") return `Alerta: situação média. ${pulse.hint}`;
  return pulse.hint;
}

function knowledgeLine(question: string) {
  const hits = searchKnowledge(question, 2);
  if (!hits.length) return "";
  return hits.map((item) => item.body).join(" ");
}

export function accountantReply(message: string, workspaceId: string): AccountantReply {
  const text = message.trim();
  const t = n(text);
  const data = snapshot(workspaceId);
  const pulse = financePulse(workspaceId);
  const know = knowledgeLine(text);

  if (/(senha|codigo do banco|token|cvv|numero do cartao)/.test(t)) {
    return { body: "Eu não peço senha, código do banco nem os números do cartão. Isso não entra neste chat." };
  }

  const spends = parseChatSpends(text);
  if (spends.length) {
    const total = spends.reduce((s, i) => s + (i.type === "EXPENSE" ? i.amount : -i.amount), 0);
    const list = spends.map((i) => `${i.type === "INCOME" ? "entra" : "sai"} ${brl(i.amount)} · ${i.description}`).join("; ");
    return {
      spends,
      body: `Pronto, já está no seu controle: ${list}. ${
        total > 0 ? `Isso pesa ${brl(total)} neste mês.` : "Entrada registrada."
      } Se quiser, eu digo o que cortar ou monto o teto do que falta no mês.`,
    };
  }

  const budget = parseBudget(text);
  if (budget) {
    return {
      budget,
      body: `Teto de ${budget.categoryName}: ${brl(budget.amount)} neste mês. Eu guardo e aviso se passar. ${pulseLine(pulse)}`,
    };
  }

  if (/(quanto (gastei|gastamos|saiu)|gasto com|despesa com|onde foi|quais lanc|quais lanç|mostrar (os )?gasto)/.test(t)) {
    const evidence = citeTransactions(workspaceId, text);
    if (!evidence.length) {
      return { body: "Neste mês ainda não tem lançamento que bata com isso. Manda a planilha ou lança na mão." };
    }
    const total = evidence.reduce((sum, row) => sum + (row.type === "EXPENSE" ? row.amount : 0), 0);
    return {
      evidence,
      body: `Achei ${evidence.length} lançamento(s) neste mês. Soma das saídas nessa lista: ${brl(total)}. Cada linha abaixo é o movimento real — não é chute.`,
    };
  }

  if (isMath(t)) {
    const value = evalMath(text);
    if (value != null) {
      return { body: `Deu ${brl(value)}. Se essa conta for um gasto, fala “gastei” na frente que eu lanço.` };
    }
  }

  if (/(passad|histor|meses|como foi|tendenc)/.test(t)) {
    return { body: [pastReview(data.series), pulseLine(pulse), know].filter(Boolean).join(" ") };
  }

  if (/(futuro|planej|proximo|trimestre|baixar (o )?gasto|melhorar (minha |a )?condic)/.test(t)) {
    return { body: [futurePlan(data), keepOrCut(data.spend, data.summary), know].filter(Boolean).join(" ") };
  }

  if (/(alerta|critica|como estou|situacao|situação|saudavel|saúde financeira|saude financeira)/.test(t)) {
    return {
      body: [
        pulseLine(pulse),
        pulse.level === "empty"
          ? ""
          : `Neste mês entrou ${brl(data.summary.income)} e saiu ${brl(data.summary.expense)}. Saldo nas contas: ${brl(data.balance)}.`,
        know,
        "Se quiser, eu reviso os meses passados ou monto o orçamento da frente.",
      ]
        .filter(Boolean)
        .join(" "),
    };
  }

  if (/(imovel|imóvel|aluguel|financi|iptu|condomin|moradia|casa|apartamento)/.test(t)) {
    return { body: [housingAdvice(data.moradia, data.summary.income), know].filter(Boolean).join(" ") };
  }

  if (/(o que cortar|corta|onde sobra|posso cortar)/.test(t)) {
    return { body: [keepOrCut(data.spend, data.summary), futurePlan(data)].join(" ") };
  }

  if (/(manter|continuar|nao cortar|não cortar|essencial)/.test(t)) {
    return {
      body:
        keepOrCut(data.spend, data.summary) +
        " Moradia, saúde e transporte do trabalho ficam. Assinatura, delivery e compra por impulso saem primeiro.",
    };
  }

  if (/(estrateg|estratég|como organizar|o que fazer|me ajuda|analisa|analise|análise)/.test(t)) {
    return {
      body: [pulseLine(pulse), pastReview(data.series), futurePlan(data), know].filter(Boolean).join(" "),
    };
  }

  if (/(orcamento|orçamento|teto|limite)/.test(t)) {
    return { body: [budgetLines(data), know, "Para gravar um teto: teto alimentação 800."].filter(Boolean).join(" ") };
  }

  if (know) {
    const live =
      pulse.level === "empty"
        ? "Se ainda não tem nada neste espaço, manda a planilha, lança na mão o mês, ou fala o gasto aqui — aí eu cruzo a teoria com o seu número."
        : `No seu mês: entrou ${brl(data.summary.income)}, saiu ${brl(data.summary.expense)}, saldo ${brl(data.balance)}. ${pulseLine(pulse)}`;
    return { body: `${know} ${live}` };
  }

  if (/(saldo|sobra|resumo|caixa)/.test(t)) {
    if (pulse.level === "empty") {
      return {
        body: "Ainda não tem movimento. Abre a aba Orçamento e preenche entra e teto de cada mês, anexa a planilha, ou lança na mão.",
      };
    }
    const top = data.spend[0];
    const evidence = citeTransactions(workspaceId, top?.name ?? "gasto", 5);
    return {
      evidence,
      body:
        `${pulseLine(pulse)} Neste mês entrou ${brl(data.summary.income)} e saiu ${brl(data.summary.expense)}. ` +
        (data.summary.net >= 0 ? `Sobra ${brl(data.summary.net)}. ` : `Falta ${brl(Math.abs(data.summary.net))}. `) +
        `Saldo nas contas: ${brl(data.balance)}. ` +
        (top ? `O que mais pesou: ${top.name} (${brl(top.amount)}). ` : "") +
        "Abaixo estão os lançamentos reais por trás deste número.",
    };
  }

  return {
    body:
      pulse.level === "empty"
        ? "Pergunta o que quiser sobre dinheiro, orçamento ou conta. Se ainda não tem arquivo salvo, abre a aba Orçamento e vai colocando mês a mês. Eu não peço senha."
        : `${pulseLine(pulse)} Pode perguntar de reserva, dívida, cartão, imposto, o que cortar, os meses passados ou o próximo trimestre. Se for um gasto, fala o valor que eu lanço.`,
  };
}
