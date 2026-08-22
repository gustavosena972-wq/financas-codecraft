"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { PIX_KEY, buildPixPayload, copyText, whatsappLink } from "@/lib/pix";

export function PixPay({
  amount,
  txid,
  label,
}: {
  amount?: number;
  txid?: string;
  label?: string;
}) {
  const payload = buildPixPayload({ amount, txid });
  const [qr, setQr] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    void QRCode.toDataURL(payload, { width: 220, margin: 1, color: { dark: "#12172B", light: "#ffffff" } }).then(setQr);
  }, [payload]);

  async function copy(text: string, which: string) {
    const ok = await copyText(text);
    setCopied(ok ? which : "erro");
    setTimeout(() => setCopied(null), 2500);
  }

  const value = amount ? `R$ ${amount.toFixed(2).replace(".", ",")}` : "";

  return (
    <div className="ccs-pix">
      {qr ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={qr} alt="QR Code PIX" className="rounded-lg border border-line bg-white w-[160px] h-[160px]" />
      ) : (
        <div className="w-[160px] h-[160px] rounded-lg border border-line bg-white" />
      )}
      <div className="space-y-3 min-w-0">
        <div>
          <div className="page-kicker">Pagar com PIX</div>
          <h2 className="font-bold mt-1">{label ?? "O dinheiro cai na conta da CodeCraft"}</h2>
          {value ? <p className="text-2xl font-extrabold font-mono mt-2">{value}</p> : null}
        </div>
        <p className="text-sm text-muted">
          Valor: <strong className="text-ink">{value || "a combinar"}</strong> · Chave: <strong className="text-ink">{PIX_KEY}</strong>
        </p>
        <div className="ccs-pix-key" onClick={(e) => (e.currentTarget.querySelector("textarea") as HTMLTextAreaElement | null)?.select()}>
          <textarea readOnly rows={3} value={payload} className="w-full bg-transparent border-0 p-0 font-mono text-[11px] leading-snug resize-none" onFocus={(e) => e.currentTarget.select()} />
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-primary" type="button" onClick={() => void copy(PIX_KEY, "chave")}>
            {copied === "chave" ? "Chave copiada" : "Copiar chave"}
          </button>
          <button className="btn btn-ink" type="button" onClick={() => void copy(payload, "pix")}>
            {copied === "pix" ? "PIX copiado" : "Copiar copia e cola"}
          </button>
          <a className="btn btn-ghost" href={whatsappLink(`Olá! Paguei o PIX ${label ?? ""} no valor de ${value}. Chave ${PIX_KEY}.`)}>
            Enviar comprovante
          </a>
        </div>
        {copied === "erro" ? <p className="text-sm text-negative">Não copiou sozinho. Selecione o código e copie no celular.</p> : null}
        <p className="text-xs text-muted">
          Abra o banco, pague o QR ou cole o código. É o mesmo PIX da CodeCraft. O valor cai na hora na conta.
        </p>
      </div>
    </div>
  );
}
