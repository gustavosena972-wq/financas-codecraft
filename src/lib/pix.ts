/** PIX da CodeCraft. Na tela a chave é o celular; no QR o banco exige +55. */
export const PIX_KEY = "31999758385";
export const PIX_NAME = "CODECRAFT SOLUTIONS";
export const PIX_CITY = "BELO HORIZONTE";
export const PIX_WHATSAPP = "5531999758385";

function crc16(str: string) {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function tlv(id: string, value: string) {
  return `${id}${String(value.length).padStart(2, "0")}${value}`;
}

export function pixKeyDigits(raw = PIX_KEY) {
  return String(raw).replace(/\D/g, "") || PIX_KEY;
}

/** Chave que a pessoa cola no app do banco (como está cadastrada). */
export function pixKeyForCopy(raw = PIX_KEY) {
  return pixKeyDigits(raw);
}

/** Chave no EMV: celular BR vai com +55, senão o QR não cai na conta. */
export function pixKeyForEmv(raw = PIX_KEY) {
  const digits = pixKeyDigits(raw);
  if (digits.length === 11 && digits[2] === "9") return `+55${digits}`;
  if (digits.length === 13 && digits.startsWith("55")) return `+${digits}`;
  if (digits.length === 12 && digits.startsWith("55") === false && raw.trim().startsWith("+")) return `+${digits}`;
  return digits;
}

export function buildPixPayload(opts: { amount?: number; txid?: string; key?: string } = {}) {
  const key = pixKeyForEmv(opts.key);
  const txid = (opts.txid || "***").replace(/[^a-zA-Z0-9*]/g, "").slice(0, 25) || "***";
  const merchant = tlv("00", "br.gov.bcb.pix") + tlv("01", key);
  const extra = tlv("62", tlv("05", txid));
  const dynamic = Boolean(opts.amount && opts.amount > 0);
  let payload = tlv("00", "01") + tlv("01", dynamic ? "12" : "11") + tlv("26", merchant) + tlv("52", "0000") + tlv("53", "986");
  if (dynamic) payload += tlv("54", opts.amount!.toFixed(2));
  payload += tlv("58", "BR") + tlv("59", PIX_NAME.slice(0, 25).toUpperCase()) + tlv("60", PIX_CITY.slice(0, 15).toUpperCase()) + extra + "6304";
  return payload + crc16(payload);
}

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const el = document.createElement("textarea");
      el.value = text;
      el.setAttribute("readonly", "");
      el.style.position = "fixed";
      el.style.left = "-9999px";
      document.body.appendChild(el);
      el.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(el);
      return ok;
    } catch {
      return false;
    }
  }
}

export function whatsappLink(text?: string) {
  const base = `https://wa.me/${PIX_WHATSAPP}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

export function whatsappCardPay(planName: string, price: string) {
  return whatsappLink(
    `Olá! Quero assinar o plano ${planName} (${price}/mês) no cartão de crédito, com renovação automática. Pode mandar a cobrança para cair na conta da CodeCraft?`,
  );
}
