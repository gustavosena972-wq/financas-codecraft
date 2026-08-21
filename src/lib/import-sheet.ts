import { brl, formatMonthLabel, monthKey } from "./money";
import type { CutTip, SheetTab } from "./coach";
import type { OrganizeResult } from "./organize";
import { split503020 } from "./tools";

function money(cents: number) {
  if (!cents) return "0,00";
  return (cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function tab(id: string, name: string, headers: string[], rows: string[][], nowRow?: number): SheetTab {
  return { id, name, headers, rows, nowRow };
}

function pickMonth(result: OrganizeResult) {
  const now = monthKey();
  const dated = result.months.filter((item) => item.month !== "sem-data");
  return dated.find((item) => item.month === now) ?? dated[dated.length - 1] ?? result.months[0] ?? null;
}

function monthRows(result: OrganizeResult, month: string) {
  return result.rows.filter((row) => !row.issues.length && row.amount > 0 && (row.date ? row.date.slice(0, 7) === month : false));
}

function monthCats(result: OrganizeResult, month: string) {
  const map = new Map<string, { name: string; income: number; expense: number }>();
  const bump = (name: string, type: "INCOME" | "EXPENSE", amount: number) => {
    const key = name.trim() || "Sem categoria";
    const cur = map.get(key) ?? { name: key, income: 0, expense: 0 };
    if (type === "INCOME") cur.income += amount;
    else cur.expense += amount;
    map.set(key, cur);
  };
  for (const row of monthRows(result, month)) bump(row.category ?? row.description, row.type, row.amount);
  for (const cell of result.budgets.filter((item) => item.month === month)) bump(cell.category, cell.type, cell.amount);
  return [...map.values()].sort((a, b) => b.expense - a.expense);
}

const KEEP = /moradia|aluguel|condomin|financi|saude|saúde|farmac|remedio|luz|energia|agua|água|internet|transporte|onibus|ônibus|metro|metrô|gasolina|imposto|das|inss|escola|creche/;
const CUT = /ifood|rappi|uber eats|delivery|assinat|netflix|spotify|prime|disney|lazer|bar|festa|roupa|compra|marketplace|ads|anuncio/;

function canCut(name: string) {
  const n = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  if (KEEP.test(n)) return false;
  return CUT.test(n) || !KEEP.test(n);
}

export function importedSheetView(result: OrganizeResult) {
  const focus = pickMonth(result);
  const month = focus?.month ?? monthKey();
  const launches = result.rows.filter((row) => !row.issues.length && row.amount > 0);
  const cats = monthCats(result, month);
  const pay = focus?.expense ?? 0;
  const income = focus?.income ?? 0;
  const leftover = income - pay;
  const tips: CutTip[] = [];

  for (const cat of cats.filter((item) => item.expense > 0 && canCut(item.name)).slice(0, 4)) {
    const save = Math.round(cat.expense * 0.2);
    if (!save) continue;
    tips.push({
      title: `Desapertar ${cat.name}`,
      body: `${cat.name} leva ${brl(cat.expense)} neste mês. Se baixar 20%, você paga ${brl(save)} a menos e o orçamento respira.`,
      save,
    });
  }
  if (leftover < 0) {
    tips.push({
      title: "O mês ainda aperta",
      body: `Para fechar no zero você precisa cortar ${brl(Math.abs(leftover))} do que vai pagar.`,
      save: Math.abs(leftover),
    });
  } else if (income > 0 && leftover / income < 0.1) {
    tips.push({
      title: "Sobra pouco",
      body: `Depois de pagar tudo, fica ${brl(leftover)}. Meta simples: guardar 10% do que entra.`,
      save: 0,
    });
  }

  const monthRowsShown = monthRows(result, month);
  const allRows = launches.length ? launches : monthRowsShown;
  const display = allRows.slice(0, 180);
  const nowRow = display.findIndex((row) => row.date?.slice(0, 7) === month);

  const tabs: SheetTab[] = [
    tab(
      "planilha",
      "Planilha",
      ["Data", "Descrição", "Categoria", "Tipo", "Valor"],
      display.map((row) => [
        row.date || "",
        row.description,
        row.category ?? "",
        row.type === "INCOME" ? "Entra" : "Sai",
        money(row.amount),
      ]),
      nowRow >= 0 ? nowRow : undefined,
    ),
    tab(
      "mes",
      "Este mês",
      ["O que", "Valor"],
      [
        ["Mês", formatMonthLabel(month)],
        ["Entra", money(income)],
        ["Você vai pagar", money(pay)],
        [leftover >= 0 ? "Sobra" : "Falta", money(Math.abs(leftover))],
        ["Lançamentos no mês", String(monthRowsShown.length || cats.length)],
      ],
    ),
    tab(
      "pagar",
      "A pagar",
      ["Categoria", "Pagar no mês", "Dá para cortar?"],
      cats
        .filter((item) => item.expense > 0)
        .map((item) => [item.name, money(item.expense), canCut(item.name) ? "Sim, 20%" : "Manter"]),
    ),
  ];

  if (result.months.length > 1) {
    tabs.push(
      tab(
        "ano",
        "Meses",
        ["Mês", "Entra", "Pagar", "Sobra"],
        result.months.map((item) => [
          item.month === "sem-data" ? "Sem data" : formatMonthLabel(item.month),
          money(item.income),
          money(item.expense),
          money(item.net),
        ]),
        result.months.findIndex((item) => item.month === month),
      ),
    );
  }

  return {
    rows: [],
    incomeAvg: income,
    expenseAvg: pay,
    saveMonth: tips.reduce((s, t) => s + t.save, 0),
    yearSave: 0,
    tips,
    empty: false,
    paid: true,
    company: false,
    fileName: result.filename || "Planilha.xlsx",
    tabs,
  };
}

export function analyzeImported(result: OrganizeResult) {
  const focus = pickMonth(result);
  if (!focus) {
    return "Abri o arquivo, mas não achei valor de mês. Confere se tem data e valor nas colunas.";
  }
  const month = focus.month;
  const label = month === "sem-data" ? "neste arquivo" : formatMonthLabel(month);
  const cats = monthCats(result, month);
  const pay = focus.expense;
  const income = focus.income;
  const leftover = income - pay;
  const lines: string[] = [];
  const launchCount = result.rows.filter((row) => !row.issues.length).length;
  lines.push(`Abri a planilha inteira no app${launchCount ? ` (${launchCount} lançamentos)` : ""}.`);
  lines.push(`Análise de ${label}: entra ${brl(income)}. Você vai pagar ${brl(pay)} de tudo neste mês.`);
  if (leftover >= 0) lines.push(`Se pagar tudo, sobra ${brl(leftover)}.`);
  else lines.push(`Se pagar tudo, falta ${brl(Math.abs(leftover))}. O mês aperta.`);

  const heavy = cats.filter((item) => item.expense > 0).slice(0, 4);
  if (heavy.length) {
    lines.push(
      "O que mais pesa no orçamento: " + heavy.map((item) => `${item.name} ${brl(item.expense)}`).join("; ") + ".",
    );
  }

  const cuts = cats.filter((item) => item.expense > 0 && canCut(item.name)).slice(0, 3);
  const saved = cuts.reduce((s, item) => s + Math.round(item.expense * 0.2), 0);
  if (cuts.length) {
    lines.push(
      "Estratégias para desapertar: " +
        cuts
          .map((item) => `baixar 20% de ${item.name} (economiza ${brl(Math.round(item.expense * 0.2))})`)
          .join("; ") +
        ". Moradia, luz, saúde e transporte do trabalho ficam.",
    );
  } else if (pay > 0) {
    lines.push("Quase tudo que sai é conta fixa. Para desapertar: negociar aluguel ou plano, e não criar gasto novo neste mês.");
  }

  if (income > 0) {
    const split = split503020(income);
    lines.push(
      `Orçamento melhor deste mês: até ${brl(split.need)} no essencial (50%), ${brl(split.want)} no que dá para soltar (30%) e ${brl(split.save)} de reserva (20%). Hoje o essencial mais o resto somam ${brl(pay)}.`,
    );
  }

  if (saved) {
    const after = leftover + saved;
    lines.push(
      after >= 0
        ? `Se você fizer esses cortes, o mês deixa de apertar: em vez de ${leftover >= 0 ? "sobrar " + brl(leftover) : "faltar " + brl(Math.abs(leftover))}, fica perto de ${brl(after)}.`
        : `Mesmo cortando ${brl(saved)}, ainda falta ${brl(Math.abs(after))}. Aí o passo é renegociar a maior conta fixa.`,
    );
  }

  lines.push("A planilha grande está aberta embaixo. Se quiser gravar isso no controle, fala “pode aplicar”.");
  return lines.join(" ");
}
