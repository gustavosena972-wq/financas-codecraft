"use client";

import { useEffect, useState } from "react";
import { brl } from "@/lib/money";
import type { buildMoneySheet } from "@/lib/coach";

const TIPS_KEY = "fc-cut-tips";
const COLS = ["A", "B", "C", "D", "E"] as const;
const HEADERS = ["Mês", "Entra", "Sai", "Sobra", "Saldo"] as const;

export function MoneySheet({ sheet }: { sheet: ReturnType<typeof buildMoneySheet> }) {
  const [done, setDone] = useState<string[]>([]);
  const [picked, setPicked] = useState<{ row: number; col: number }>({ row: 0, col: 0 });

  useEffect(() => {
    try {
      setDone(JSON.parse(localStorage.getItem(TIPS_KEY) || "[]"));
    } catch {
      setDone([]);
    }
  }, []);

  function toggleTip(title: string) {
    const next = done.includes(title) ? done.filter((t) => t !== title) : [title, ...done];
    setDone(next);
    localStorage.setItem(TIPS_KEY, JSON.stringify(next.slice(0, 20)));
  }

  const headerPick = picked.row < 0;
  const activeRow = headerPick ? undefined : sheet.rows[picked.row] ?? sheet.rows[0];
  const cellText = headerPick ? HEADERS[picked.col] ?? "" : cellValue(activeRow, picked.col);
  const cellName = `${COLS[picked.col] ?? "A"}${headerPick ? 1 : picked.row + 2}`;

  if (sheet.empty) {
    return (
      <section className="xls rise">
        <div className="xls-bar">Livro1.xlsx</div>
        <div className="xls-fx">
          <span>fx</span>
          <em>A1</em>
          <input readOnly value="" placeholder="Manda o Excel ou pede para eu fazer uma planilha" />
        </div>
        <div className="xls-scroll">
          <table className="xls-grid">
            <thead>
              <tr>
                <th className="xls-corner" />
                {COLS.map((col) => (
                  <th key={col}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 12 }, (_, i) => (
                <tr key={i}>
                  <th>{i + 1}</th>
                  {COLS.map((col) => (
                    <td key={col} />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="xls-tabs">
          <span className="on">Plan1</span>
        </div>
      </section>
    );
  }

  return (
    <section className="xls rise">
      <div className="xls-bar">Caixa.xlsx</div>
      <div className="xls-fx">
        <span>fx</span>
        <em>{cellName}</em>
        <input readOnly value={cellText} />
      </div>
      <div className="xls-scroll">
        <table className="xls-grid">
          <thead>
            <tr>
              <th className="xls-corner" />
              {COLS.map((col, colIdx) => (
                <th key={col} className={picked.col === colIdx ? "xls-col-on" : ""}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th>1</th>
              {HEADERS.map((header, colIdx) => (
                <td
                  key={header}
                  className={`xls-head ${picked.row === -1 && picked.col === colIdx ? "xls-cell-on" : ""}`}
                  onClick={() => setPicked({ row: -1, col: colIdx })}
                >
                  {header}
                </td>
              ))}
            </tr>
            {sheet.rows.map((row, rowIdx) => {
              const values = [row.label, money(row.income), money(row.expense), money(row.net), row.kind === "past" ? "" : money(row.balance)];
              return (
                <tr key={row.month} className={row.kind === "now" ? "xls-now" : ""}>
                  <th className={picked.row === rowIdx ? "xls-row-on" : ""}>{rowIdx + 2}</th>
                  {values.map((value, colIdx) => {
                    const on = picked.row === rowIdx && picked.col === colIdx;
                    const num = colIdx > 0;
                    const negative = colIdx === 3 && row.net < 0;
                    return (
                      <td
                        key={COLS[colIdx]}
                        className={`${num ? "xls-num" : ""} ${negative ? "xls-neg" : ""} ${on ? "xls-cell-on" : ""}`}
                        onClick={() => setPicked({ row: rowIdx, col: colIdx })}
                      >
                        {value}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="xls-tabs">
        <span className="on">Caixa</span>
        <span>Previsão</span>
      </div>
      {sheet.tips.length ? (
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

function money(cents: number) {
  if (!cents) return "";
  return brl(cents).replace("R$\u00a0", "R$ ").replace("R$ ", "");
}

function cellValue(row: ReturnType<typeof buildMoneySheet>["rows"][number] | undefined, col: number) {
  if (!row) return "";
  if (col === 0) return row.label;
  if (col === 1) return money(row.income);
  if (col === 2) return money(row.expense);
  if (col === 3) return money(row.net);
  if (col === 4) return row.kind === "past" ? "" : money(row.balance);
  return "";
}
