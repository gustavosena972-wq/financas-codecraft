import { isValidCpf } from "./company";

export type CardBrand = "visa" | "mastercard" | "elo" | "amex" | "hipercard" | "unknown";

export function onlyCardDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function formatCardNumber(value: string) {
  const digits = onlyCardDigits(value).slice(0, 19);
  if (detectBrand(digits) === "amex") {
    return [digits.slice(0, 4), digits.slice(4, 10), digits.slice(10, 15)].filter(Boolean).join(" ");
  }
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

export function formatCardExp(value: string) {
  const digits = onlyCardDigits(value).slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export function detectBrand(number: string): CardBrand {
  const d = onlyCardDigits(number);
  if (/^3[47]/.test(d)) return "amex";
  if (/^(606282|3841)/.test(d)) return "hipercard";
  if (
    /^(4011|4312|4389|4514|4576|5041|5066|5067|509|6277|6362|6363|6504|6505|6509|6516|6550)/.test(d)
  ) {
    return "elo";
  }
  if (/^4/.test(d)) return "visa";
  const bin = Number(d.slice(0, 4));
  if (/^5[1-5]/.test(d) || (bin >= 2221 && bin <= 2720)) return "mastercard";
  return "unknown";
}

export function brandLabel(brand: CardBrand | string) {
  if (brand === "visa") return "Visa";
  if (brand === "mastercard") return "Mastercard";
  if (brand === "elo") return "Elo";
  if (brand === "amex") return "Amex";
  if (brand === "hipercard") return "Hipercard";
  return "Cartão";
}

function luhnOk(number: string) {
  const digits = onlyCardDigits(number);
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let n = Number(digits[i]);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return digits.length >= 13 && sum % 10 === 0;
}

export function parseExpiry(value: string) {
  const digits = onlyCardDigits(value);
  if (digits.length !== 4) return null;
  const month = Number(digits.slice(0, 2));
  const year = 2000 + Number(digits.slice(2));
  if (month < 1 || month > 12) return null;
  return { month, year, label: `${digits.slice(0, 2)}/${digits.slice(2)}` };
}

export function expiryValid(value: string) {
  const parsed = parseExpiry(value);
  if (!parsed) return false;
  const now = new Date();
  const last = new Date(parsed.year, parsed.month, 0, 23, 59, 59);
  return last >= now;
}

export function readCard(input: { number: string; name: string; exp: string; cvv: string; cpf: string }) {
  const number = onlyCardDigits(input.number);
  const brand = detectBrand(number);
  const name = input.name.replace(/\s+/g, " ").trim();
  const cvv = onlyCardDigits(input.cvv);
  const cpf = input.cpf.replace(/\D/g, "");
  const cvvLen = brand === "amex" ? 4 : 3;
  if (name.length < 3) return { error: "Nome impresso no cartão." };
  if (!luhnOk(number) || brand === "unknown") return { error: "Número do cartão inválido." };
  if (!expiryValid(input.exp)) return { error: "Validade do cartão inválida." };
  if (cvv.length !== cvvLen) return { error: "CVV inválido." };
  if (!isValidCpf(cpf)) return { error: "CPF do dono do cartão inválido." };
  const exp = parseExpiry(input.exp);
  if (!exp) return { error: "Validade do cartão inválida." };
  return {
    last4: number.slice(-4),
    brand,
    exp: exp.label,
    holder: name.toUpperCase(),
    cpf,
  };
}

export function cardOnFile(user: { cardLast4?: string; cardExp?: string; cardHolder?: string } | null | undefined) {
  return Boolean(user?.cardLast4 && user.cardLast4.length === 4 && user.cardExp && user.cardHolder);
}
