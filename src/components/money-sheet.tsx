"use client";

import { useEffect, useMemo, useState } from "react";
import { brl, monthKey } from "@/lib/money";
import type { CutTip, SheetCharts, SheetTab } from "@/lib/coach";
import { CashflowChart, CategoryChart, FreeMoneyChart } from "@/components/charts";
import { chartsFromMonths, loadMonthPlan, parseCellMoney, upsertMonthPlan } from "@/lib/month-plan";

const TIPS_KEY = "fc-cut-tips";

function colLetter(index: number) {
  let n = index;
  let out = "";
  do {
    out = String.fromCharCode(65 + (n % 26)) + out;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return out;
}

function money(cents: number) {
  if (!cents) return "0,00";
  return (cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function MoneySheet({
  sheet,
  workspaceId,
}: {
  sheet: {
    fileName?: string;
    empty: boolean;
    paid: boolean;
    tips: CutTip[];
    tabs: SheetTab[];
    openTab?: string;
    charts?: SheetCharts;
  };
  workspaceId?: string;
}) {
  const [done, setDone] = useState<string[]>([]);
  const [picked, setPicked] = useState<{ row: number; col: number }>({ row: 0, col: 0 });
  const [tabId, setTabId] = useState(sheet.openTab ?? sheet.tabs[0]?.id ?? "caixa");
  const [tick, setTick] = useState(0);
  const [edit, setEdit] = useState<{ row: number; col: number; text: string } | null>(null);

  useEffect(() => {
    try {
      setDone(JSON.parse(localStorage.getItem(TIPS_KEY) || "[]"));
    } catch {
      setDone([]);
    }
  }, []);

  useEffect(() => {
    if (sheet.openTab && sheet.tabs.some((item) => item.id === sheet.openTab)) {
      setTabId(sheet.openTab);
      return;
    }
    if (!sheet.tabs.some((item) => item.id === tabId)) setTabId(sheet.tabs[0]?.id ?? "caixa");
  }, [sheet.fileName, sheet.openTab]);

  const tab = sheet.tabs.find((item) => item.id === tabId) ?? sheet.tabs[0];
  const cols = useMemo(() => (tab ? tab.headers.map((_, i) => colLetter(i)) : []), [tab]);
  const plan = useMemo(() => (workspaceId ? loadMonthPlan(workspaceId) : []), [workspaceId, tick]);

  const rows = useMemo(() => {
    if (!tab) return [];
    if (tab.id !== "orcamento" || !tab.monthKeys?.length) return tab.rows;
    return tab.rows.map((row, i) => {
      const month = tab.monthKeys?.[i];
      const saved = plan.find((item) => item.month === month);
      if (!saved) return row;
      return [row[0] ?? "", money(saved.income), money(saved.expense), money(saved.income - saved.expense)];
    });
  }, [tab, plan]);

  const charts = useMemo(() => {
    const orc = sheet.tabs.find((item) => item.id === "orcamento");
    if (orc?.monthKeys?.length) {
      const values = orc.monthKeys.map((month, i) => {
        const saved = plan.find((item) => item.month === month);
        const row = orc.rows[i];
        return {
          month,
          income: saved?.income ?? parseCellMoney(row?.[1] ?? ""),
          expense: saved?.expense ?? parseCellMoney(row?.[2] ?? ""),
        };
      });
      return chartsFromMonths(values, monthKey(), { slices: sheet.charts?.slices });
    }
    return sheet.charts;
  }, [sheet.tabs, sheet.charts, plan]);

  function toggleTip(title: string) {
    const next = done.includes(title) ? done.filter((t) => t !== title) : [title, ...done];
    setDone(next);
    localStorage.setItem(TIPS_KEY, JSON.stringify(next.slice(0, 20)));
  }

  function canEdit(col: number) {
    return Boolean(tab?.editableCols?.includes(col) && workspaceId && tab.monthKeys);
  }

  function startEdit(row: number, col: number) {
    if (!canEdit(col)) return;
    setPicked({ row, col });
    setEdit({ row, col, text: rows[row]?.[col] ?? "" });
  }

  function commitEdit() {
    if (!edit || !workspaceId || !tab?.monthKeys) {
      setEdit(null);
      return;
    }
    const month = tab.monthKeys[edit.row];
    if (!month) {
      setEdit(null);
      return;
    }
    const cents = parseCellMoney(edit.text);
    upsertMonthPlan(workspaceId, month, edit.col === 1 ? { income: cents } : { expense: cents });
    setEdit(null);
    setTick((n) => n + 1);
  }

  const headerPick = picked.row < 0;
  const dataRow = !headerPick ? rows[picked.row] : undefined;
  const cellText = edit && edit.row === picked.row && edit.col === picked.col ? edit.text : headerPick ? (tab?.headers[picked.col] ?? "") : (dataRow?.[picked.col] ?? "");
  const cellName = `${cols[picked.col] ?? "A"}${headerPick ? 1 : picked.row + 2}`;
  const formulaEditable = !headerPick && canEdit(picked.col);

  if (!tab) return null;
  const showCharts = tab.id === "graficos" && charts;

  return (
    <section className="xls rise">
      <div className="xls-bar">{sheet.fileName ?? "Caixa.xlsx"}</div>
      <div className="xls-fx">
        <span>fx</span>
        <em>{cellName}</em>
        <input
          value={cellText}
          readOnly={!formulaEditable}
          placeholder={sheet.empty ? "Clique em Entra ou Orçamento e digite o valor do mês" : ""}
          onChange={(e) => {
            if (!formulaEditable) return;
            setEdit({ row: picked.row, col: picked.col, text: e.target.value });
          }}
          onBlur={() => {
            if (formulaEditable && edit) commitEdit();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && formulaEditable) {
              e.preventDefault();
              commitEdit();
            }
            if (e.key === "Escape") setEdit(null);
          }}
        />
      </div>
      {showCharts ? (
        <div className="xls-charts">
          <div className="xls-free">
            <p className="xls-free-kicker">Dinheiro livre em {charts.nextLabel}</p>
            <p className={`xls-free-value ${charts.nextFreeIfCut < 0 ? "neg" : ""}`}>{brl(charts.nextFreeIfCut)}</p>
            <p className="xls-free-hint">
              Se nada mudar: {brl(charts.nextFree)}. Se desapertar o orçamento, fica {brl(charts.nextFreeIfCut)}.
            </p>
          </div>
          <div className="xls-chart-grid">
            <div>
              <p className="xls-chart-title">Livre este mês × o próximo</p>
              <FreeMoneyChart
                thisLabel={charts.thisLabel}
                nextLabel={charts.nextLabel}
                thisFree={charts.thisFree}
                nextFree={charts.nextFree}
                nextFreeIfCut={charts.nextFreeIfCut}
              />
            </div>
            <div>
              <p className="xls-chart-title">O que mais sai neste mês</p>
              <CategoryChart data={charts.slices} />
            </div>
          </div>
          {charts.series.length > 1 ? (
            <div>
              <p className="xls-chart-title">Entra e sai</p>
              <CashflowChart data={charts.series} />
            </div>
          ) : null}
        </div>
      ) : (
        <div className="xls-scroll">
          <table className="xls-grid">
            <thead>
              <tr>
                <th className="xls-corner" />
                {cols.map((col, colIdx) => (
                  <th key={col} className={picked.col === colIdx ? "xls-col-on" : ""}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <th>1</th>
                {tab.headers.map((header, colIdx) => (
                  <td
                    key={header + colIdx}
                    className={`xls-head ${picked.row === -1 && picked.col === colIdx ? "xls-cell-on" : ""}`}
                    onClick={() => setPicked({ row: -1, col: colIdx })}
                  >
                    {header}
                  </td>
                ))}
              </tr>
              {rows.map((values, rowIdx) => (
                <tr key={rowIdx} className={tab.nowRow === rowIdx ? "xls-now" : ""}>
                  <th className={picked.row === rowIdx ? "xls-row-on" : ""}>{rowIdx + 2}</th>
                  {values.map((value, colIdx) => {
                    const on = picked.row === rowIdx && picked.col === colIdx;
                    const headerName = tab.headers[colIdx] ?? "";
                    const num = /valor|renda|gasto|entra|sai|sobra|saldo|receita|custo|folha|imposto|opex|resultado|orcado|orçamento|real|alvo|teto|folga|base|pagar|livre/i.test(
                      headerName,
                    );
                    const formula = /fórmula|formula/i.test(headerName);
                    const negative = typeof value === "string" && value.startsWith("-") && num;
                    const editing = edit?.row === rowIdx && edit?.col === colIdx;
                    return (
                      <td
                        key={`${rowIdx}-${colIdx}`}
                        className={`${num ? "xls-num" : ""} ${formula ? "xls-fx-cell" : ""} ${negative ? "xls-neg" : ""} ${on ? "xls-cell-on" : ""} ${canEdit(colIdx) ? "xls-edit" : ""}`}
                        onClick={() => {
                          if (canEdit(colIdx)) startEdit(rowIdx, colIdx);
                          else {
                            setEdit(null);
                            setPicked({ row: rowIdx, col: colIdx });
                          }
                        }}
                      >
                        {editing ? (
                          <input
                            autoFocus
                            value={edit.text}
                            onChange={(e) => setEdit({ ...edit, text: e.target.value })}
                            onBlur={commitEdit}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                commitEdit();
                              }
                              if (e.key === "Escape") setEdit(null);
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          value
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="xls-tabs">
        {sheet.tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            className={item.id === tab.id ? "on" : ""}
            onClick={() => {
              setTabId(item.id);
              setPicked({ row: 0, col: 0 });
              setEdit(null);
            }}
          >
            {item.name}
          </button>
        ))}
      </div>
      {sheet.empty ? (
        <p className="xls-fill-hint">
          Sem planilha salva: abre a aba Orçamento e vai colocando o que entra e o teto de cada mês. O Livre e o gráfico do mês que vem saem daí.
        </p>
      ) : null}
      {sheet.tips.length && !sheet.empty ? (
        <div className="xls-notes">
          {sheet.tips.map((tip) => {
            const marked = done.includes(tip.title);
            return (
              <button key={tip.title} type="button" className={marked ? "on" : ""} onClick={() => toggleTip(tip.title)}>
                {marked ? "✓ " : ""}
                {tip.title}
                {tip.save ? ` (${brl(tip.save)}/mês)` : ""}
              </button>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
