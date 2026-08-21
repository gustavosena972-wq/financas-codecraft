/** PIX da CodeCraft. A chave é exatamente a cadastrada no banco, sem +55. */
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

export function buildPixPayload(opts: { amount?: number; txid?: string; key?: string } = {}) {
  const key = pixKeyDigits(opts.key);
  const txid = (opts.txid || "***").replace(/[^a-zA-Z0-9*]/g, "").slice(0, 25) || "***";
  const merchant = tlv("00", "br.gov.bcb.pix") + tlv("01", key);
  const extra = tlv("62", tlv("05", txid));
  let payload = tlv("00", "01") + tlv("01", "11") + tlv("26", merchant) + tlv("52", "0000") + tlv("53", "986");
  if (opts.amount && opts.amount > 0) {
    payload += tlv("54", opts.amount.toFixed(2));
  }
  payload += tlv("58", "BR") + tlv("59", PIX_NAME.slice(0, 25)) + tlv("60", PIX_CITY.slice(0, 15)) + extra + "6304";
  return payload + crc16(payload);
}

export function whatsappLink(text?: string) {
  const base = `https://wa.me/${PIX_WHATSAPP}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}
