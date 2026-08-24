function emv(id: string, value: string) {
  return `${id}${String(value.length).padStart(2, "0")}${value}`;
}

function crc16(payload: string) {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i += 1) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function clean(value: string, max: number) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .trim()
    .slice(0, max) || "FINANCAS";
}

export function pixPayload(input: {
  key: string;
  name: string;
  city: string;
  amountCents?: number;
  txid?: string;
}) {
  const key = input.key.trim();
  const merchant = emv("00", "br.gov.bcb.pix") + emv("01", key);
  const amount =
    input.amountCents && input.amountCents > 0 ? (input.amountCents / 100).toFixed(2) : "";
  const txid = (input.txid || "***").replace(/[^a-zA-Z0-9]/g, "").slice(0, 25) || "***";
  let payload =
    emv("00", "01") +
    emv("01", "11") +
    emv("26", merchant) +
    emv("52", "0000") +
    emv("53", "986") +
    (amount ? emv("54", amount) : "") +
    emv("58", "BR") +
    emv("59", clean(input.name, 25).toUpperCase()) +
    emv("60", clean(input.city, 15).toUpperCase()) +
    emv("62", emv("05", txid));
  payload += "6304";
  return payload + crc16(payload);
}

export function pixKeyHint(key: string) {
  const raw = key.trim();
  if (!raw) return "Chave PIX da plataforma";
  if (/^\d{11}$/.test(raw.replace(/\D/g, "")) && raw.replace(/\D/g, "").length === 11) return "CPF";
  if (/^\d{14}$/.test(raw.replace(/\D/g, ""))) return "CNPJ";
  if (raw.includes("@")) return "E-mail";
  if (raw.startsWith("+") || /^\d{10,13}$/.test(raw.replace(/\D/g, ""))) return "Celular";
  return "Chave aleatória";
}
