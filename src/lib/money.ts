export function brl(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format((cents || 0) / 100);
}

export function parseMoneyToCents(raw: string): number | null {
  const trimmed = String(raw ?? "").trim();
  if (!trimmed) return null;
  const negative = trimmed.startsWith("-") || trimmed.includes("(");
  const digits = trimmed.replace(/[^\d,.-]/g, "");
  if (!digits) return null;
  let normalized = digits;
  if (digits.includes(",") && digits.includes(".")) {
    normalized = digits.replace(/\./g, "").replace(",", ".");
  } else if (digits.includes(",")) {
    normalized = digits.replace(",", ".");
  }
  const value = Number(normalized);
  if (!Number.isFinite(value)) return null;
  const cents = Math.round(Math.abs(value) * 100);
  return negative ? -cents : cents;
}

export function monthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}
