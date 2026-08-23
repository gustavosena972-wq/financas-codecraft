import { brl, formatMonthLabel, monthKey } from "./money";
import { CARD_CUT_DEFAULT, cardEvolution, familyMonthItems, familyYear, type FamilyMonth } from "./family-budget";
import { houseSpendWatch, peopleSpeech, type HouseSpendWatch } from "./house-people";

export type OutlookMonth = FamilyMonth & {
  kind: "past" | "now" | "ahead";
  projected: boolean;
};

export type DailyTip = {
  title: string;
  body: string;
  tone: "ok" | "warn" | "info";
};

export type FamilyOutlook = {
  empty: boolean;
  year: number;
  today: string;
  daysLeft: number;
  now: OutlookMonth;
  series: OutlookMonth[];
  yearTotal: { income: number; expense: number; leftover: number; cards: number; fixed: number };
  rest: { expense: number; leftover: number; count: number };
  cutPath: { leftover: number; extra: number };
  heaviestCard: { name: string; amount: number } | null;
  endingSoon: { description: string; left: number; total: number; current: number }[];
  watch: HouseSpendWatch;
  review: DailyTip[];
};

function yearMonths(year: number) {
  return Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, "0")}`);
}

function kindOf(month: string, now: string): OutlookMonth["kind"] {
  if (month === now) return "now";
  return month < now ? "past" : "ahead";
}

function daysLeftInMonth(date = new Date()) {
  const last = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  return Math.max(0, last - date.getDate());
}

function parseInstallment(notes?: string) {
  const match = notes?.match(/(\d+)\s*de\s*(\d+)/i);
  if (!match) return null;
  const current = Number(match[1]);
  const total = Number(match[2]);
  if (!current || !total || current > total) return null;
  return { current, total, left: total - current };
}

function monthIndex(month: string) {
  return Number(month.slice(5, 7)) - 1;
}

function projectGaps(raw: FamilyMonth[], now: string): OutlookMonth[] {
  const filled = raw.filter((row) => row.income > 0 || row.expense > 0);
  const last = filled.at(-1);
  const lastIndex = last ? monthIndex(last.month) : -1;
  let lastCards = last?.cards ?? 0;

  return raw.map((row) => {
    const kind = kindOf(row.month, now);
    if (row.income > 0 || row.expense > 0) {
      lastCards = row.cards || lastCards;
      return { ...row, kind, projected: false };
    }
    if (kind !== "ahead" || !last) return { ...row, kind, projected: false };
    const steps = Math.max(1, monthIndex(row.month) - lastIndex);
    const cards = Math.round(lastCards * (1 - CARD_CUT_DEFAULT) ** steps);
    const income = last.income;
    const fixed = last.fixed;
    const other = 0;
    const expense = cards + fixed + other;
    return {
      month: row.month,
      income,
      cards,
      fixed,
      other,
      expense,
      net: income - expense,
      cardShare: expense ? cards / expense : 0,
      kind,
      projected: true,
    };
  });
}

function sum(rows: OutlookMonth[]) {
  return rows.reduce(
    (acc, row) => ({
      income: acc.income + row.income,
      expense: acc.expense + row.expense,
      leftover: acc.leftover + row.net,
      cards: acc.cards + row.cards,
      fixed: acc.fixed + row.fixed,
    }),
    { income: 0, expense: 0, leftover: 0, cards: 0, fixed: 0 },
  );
}

function leftoverIfCut(series: OutlookMonth[], now: string, cut = CARD_CUT_DEFAULT) {
  const current = series.find((row) => row.month === now);
  const baseCards = current?.cards || series.filter((row) => row.cards > 0).at(-1)?.cards || 0;
  let leftover = 0;
  let step = 0;
  for (const row of series) {
    if (row.kind === "past" || row.kind === "now") {
      leftover += row.net;
      continue;
    }
    step += 1;
    const cards = Math.round(baseCards * (1 - cut) ** step);
    leftover += row.income - (cards + row.fixed + row.other);
  }
  return leftover;
}

function buildTips(outlook: Omit<FamilyOutlook, "review">): DailyTip[] {
  const tips: DailyTip[] = [];
  const now = outlook.now;
  const year = outlook.yearTotal;
  const watch = outlook.watch;

  tips.push({
    title: watch.headline,
    body: watch.body,
    tone: watch.tone,
  });

  tips.push({
    title: outlook.daysLeft ? `Hoje · faltam ${outlook.daysLeft} dia(s) no mês` : "Hoje · último dia do mês",
    body:
      now.net >= 0
        ? `Já saiu ${brl(watch.spent)}. Ainda não saiu ${brl(watch.pending)}. Sem gasto novo no cartão, sobra ${brl(now.net)}.`
        : `Já saiu ${brl(watch.spent)}. Ainda não saiu ${brl(watch.pending)}. Falta ${brl(Math.abs(now.net))} para fechar. Sem parcela nova.`,
    tone: now.net >= 0 ? "ok" : "warn",
  });

  if (outlook.rest.count) {
    tips.push({
      title: "Daqui até dezembro",
      body: `Ainda vai gastar ${brl(outlook.rest.expense)} nos ${outlook.rest.count} mês(es) que faltam. No ano inteiro ${
        year.leftover >= 0 ? `sobra ${brl(year.leftover)}` : `falta ${brl(Math.abs(year.leftover))}`
      }.`,
      tone: year.leftover >= 0 ? "info" : "warn",
    });
  } else {
    tips.push({
      title: "No ano",
      body:
        year.leftover >= 0
          ? `Vai gastar ${brl(year.expense)} e sobrar ${brl(year.leftover)}.`
          : `Vai gastar ${brl(year.expense)} e faltar ${brl(Math.abs(year.leftover))}.`,
      tone: year.leftover >= 0 ? "ok" : "warn",
    });
  }

  if (outlook.cutPath.extra > 5000) {
    tips.push({
      title: "Se baixar o cartão 10% ao mês",
      body: `Sobra mais ${brl(outlook.cutPath.extra)} no ano. Esse extra vai para a maior fatura, não para compra nova.`,
      tone: "info",
    });
  }

  const red = outlook.series.find((row) => row.kind !== "past" && row.net < 0);
  if (red) {
    tips.push({
      title: `${formatMonthLabel(red.month)} não fecha`,
      body: `Vai faltar ${brl(Math.abs(red.net))}. O peso é ${
        red.cards >= red.fixed ? "o cartão" : "as contas da casa"
      }. Corta extra e não abre parcela.`,
      tone: "warn",
    });
  }

  if (outlook.heaviestCard && now.expense) {
    const share = Math.round((outlook.heaviestCard.amount / Math.max(now.cards, 1)) * 100);
    tips.push({
      title: `O cartão que mais come: ${outlook.heaviestCard.name}`,
      body:
        now.net > 0
          ? `Leva ${brl(outlook.heaviestCard.amount)} (${share}% das faturas). A sobra de ${brl(now.net)} deste mês serve para amortizar essa fatura.`
          : `Leva ${brl(outlook.heaviestCard.amount)} (${share}% das faturas). Não parcela em cima. Quite o extra primeiro.`,
      tone: "info",
    });
  }

  for (const item of outlook.endingSoon.slice(0, 2)) {
    tips.push({
      title: item.left === 0 ? `${item.description} acaba neste mês` : `${item.description} quase acabou`,
      body:
        item.left === 0
          ? `Era ${item.current} de ${item.total}. Quando cair, esse valor some do mês que vem — não substitui por compra nova.`
          : `Falta${item.left === 1 ? "" : "m"} ${item.left} parcela${item.left === 1 ? "" : "s"} de ${item.total}. Segura até zerar.`,
      tone: "ok",
    });
  }

  if (now.cardShare > 0.4 && now.expense) {
    tips.push({
      title: "Cartão come mais de 40% do mês",
      body: `São ${Math.round(now.cardShare * 100)}% do que sai. A casa só respira se essa fatia cair.`,
      tone: "warn",
    });
  }

  return tips.slice(0, 6);
}

function stampReview(workspaceId: string, fingerprint: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      `fc-house-eval:${workspaceId}`,
      JSON.stringify({ day: new Date().toISOString().slice(0, 10), fingerprint, at: Date.now() }),
    );
  } catch {
    /* ignore quota */
  }
}

export function familyOutlook(workspaceId: string, now = monthKey()): FamilyOutlook {
  const year = Number(now.slice(0, 4));
  const today = new Date().toISOString().slice(0, 10);
  const series = projectGaps(familyYear(workspaceId, year), now);
  const used = series.filter((row) => row.income > 0 || row.expense > 0);
  const current = series.find((row) => row.month === now) ?? used.at(-1) ?? series[0];
  const restRows = series.filter((row) => row.month >= now && (row.income || row.expense));
  const yearTotal = sum(used.length ? used : series);
  const restSum = sum(restRows);
  const plannedLeftover = yearTotal.leftover;
  const cutLeftover = leftoverIfCut(series, now);
  const cards = cardEvolution(workspaceId, year).cards;
  const heaviest = cards[0] ? { name: cards[0].name, amount: cards[0].values[monthIndex(now)] || cards[0].total } : null;
  const endingSoon = familyMonthItems(workspaceId, current.month)
    .map((item) => {
      const inst = parseInstallment(item.notes);
      if (!inst || inst.left > 2) return null;
      return { description: item.description, left: inst.left, total: inst.total, current: inst.current };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
  const watch = houseSpendWatch(workspaceId, now, today);

  const base: Omit<FamilyOutlook, "review"> = {
    empty: !used.length,
    year,
    today,
    daysLeft: daysLeftInMonth(),
    now: current,
    series,
    yearTotal,
    rest: { expense: restSum.expense, leftover: restSum.leftover, count: restRows.length },
    cutPath: { leftover: cutLeftover, extra: Math.max(0, cutLeftover - plannedLeftover) },
    heaviestCard: heaviest,
    endingSoon,
    watch,
  };
  const review = base.empty
    ? [
        {
          title: "Ainda não tem o ano da casa",
          body: "Manda o Excel uma vez. Daí o app passa a dizer, todo dia, o que ainda vai sair e o que sobra — não para repetir a planilha.",
          tone: "info" as const,
        },
      ]
    : buildTips(base);

  stampReview(workspaceId, `${yearTotal.expense}:${yearTotal.leftover}:${current.net}`);
  return { ...base, review };
}

export function outlookSpeech(outlook: FamilyOutlook) {
  if (outlook.empty) {
    return "Ainda não tem o orçamento da casa neste espaço. Manda a planilha uma vez. Eu avalio todo dia o que vai gastar e o que sobra.";
  }
  const now = outlook.now;
  const year = outlook.yearTotal;
  const monthLine =
    now.net >= 0
      ? `Este mês vai gastar ${brl(now.expense)} e sobrar ${brl(now.net)}.`
      : `Este mês vai gastar ${brl(now.expense)} e faltar ${brl(Math.abs(now.net))}.`;
  const yearLine =
    year.leftover >= 0
      ? `No ano vai gastar ${brl(year.expense)} e sobrar ${brl(year.leftover)}.`
      : `No ano vai gastar ${brl(year.expense)} e faltar ${brl(Math.abs(year.leftover))}.`;
  const restLine = outlook.rest.count
    ? `Daqui até dezembro ainda sai ${brl(outlook.rest.expense)}.`
    : "";
  const cutLine = outlook.cutPath.extra > 5000 ? `Se baixar o cartão 10% ao mês, sobra mais ${brl(outlook.cutPath.extra)} no ano.` : "";
  const who = peopleSpeech(outlook.watch);
  const tips = outlook.review.map((tip) => `${tip.title}: ${tip.body}`).join(" ");
  return [monthLine, who, restLine, yearLine, cutLine, `Avaliação de hoje: ${tips}`].filter(Boolean).join(" ");
}
