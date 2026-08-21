"use client";

import { useEffect, useMemo, useState } from "react";
import { brl } from "@/lib/money";
import type { CutTip, SheetTab } from "@/lib/coach";

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

export function MoneySheet({
  sheet,
}: {
  sheet: {
    fileName?: string;
    empty: boolean;
    paid: boolean;
    tips: CutTip[];
    tabs: SheetTab[];
  };
}) {
  const [done, setDone] = useState<string[]>([]);
  const [picked, setPicked] = useState<{ row: number; col: number }>({ row: 0, col: 0 });
  const [tabId, setTabId] = useState(sheet.tabs[0]?.id ?? "caixa");

  useEffect(() => {
    try {
      setDone(JSON.parse(localStorage.getItem(TIPS_KEY) || "[]"));
    } catch {
      setDone([]);
    }
  }, []);

  useEffect(() => {
    if (!sheet.tabs.some((tab) => tab.id === tabId)) setTabId(sheet.tabs[0]?.id ?? "caixa");
  }, [sheet.tabs, tabId]);

  const tab = sheet.tabs.find((item) => item.id === tabId) ?? sheet.tabs[0];
  const cols = useMemo(() => (tab ? tab.headers.map((_, i) => colLetter(i)) : []), [tab]);

  function toggleTip(title: string) {
    const next = done.includes(title) ? done.filter((t) => t !== title) : [title, ...done];
    setDone(next);
    localStorage.setItem(TIPS_KEY, JSON.stringify(next.slice(0, 20)));
  }

  const headerPick = picked.row < 0;
  const dataRow = !headerPick && tab ? tab.rows[picked.row] : undefined;
  const cellText = headerPick ? (tab?.headers[picked.col] ?? "") : (dataRow?.[picked.col] ?? "");
  const cellName = `${cols[picked.col] ?? "A"}${headerPick ? 1 : picked.row + 2}`;

  if (!tab) return null;

  return (
    <section className="xls rise">
      <div className="xls-bar">{sheet.fileName ?? "Caixa.xlsx"}</div>
      <div className="xls-fx">
        <span>fx</span>
        <em>{cellName}</em>
        <input readOnly value={sheet.empty && !sheet.paid ? "" : cellText} placeholder={sheet.empty ? "Manda o Excel ou pede para eu fazer uma planilha" : ""} />
      </div>
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
            {(sheet.empty && !sheet.paid
              ? Array.from({ length: 12 }, () => cols.map(() => ""))
              : tab.rows
            ).map((values, rowIdx) => (
              <tr key={rowIdx} className={tab.nowRow === rowIdx ? "xls-now" : ""}>
                <th className={picked.row === rowIdx ? "xls-row-on" : ""}>{rowIdx + 2}</th>
                {values.map((value, colIdx) => {
                  const on = picked.row === rowIdx && picked.col === colIdx;
                  const headerName = tab.headers[colIdx] ?? "";
                  const num = /valor|renda|gasto|entra|sai|sobra|saldo|receita|custo|folha|imposto|opex|resultado|orcado|real|alvo|teto|folga|base|pagar/i.test(headerName);
                  const formula = /fórmula|formula/i.test(headerName);
                  const negative = typeof value === "string" && value.startsWith("-") && num;
                  return (
                    <td
                      key={`${rowIdx}-${colIdx}`}
                      className={`${num ? "xls-num" : ""} ${formula ? "xls-fx-cell" : ""} ${negative ? "xls-neg" : ""} ${on ? "xls-cell-on" : ""}`}
                      onClick={() => setPicked({ row: rowIdx, col: colIdx })}
                    >
                      {value}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="xls-tabs">
        {sheet.tabs.map((item) => (
          <button key={item.id} type="button" className={item.id === tab.id ? "on" : ""} onClick={() => { setTabId(item.id); setPicked({ row: 0, col: 0 }); }}>
            {item.name}
          </button>
        ))}
      </div>
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
