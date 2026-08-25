/** Download a CSV file in the browser. */
export function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const esc = (v: string | number) => {
    const s = String(v ?? "");
    if (/[;"\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines = [headers.map(esc).join(";"), ...rows.map((r) => r.map(esc).join(";"))];
  const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
