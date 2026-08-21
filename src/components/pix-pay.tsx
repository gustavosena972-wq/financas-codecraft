"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { PIX_KEY, buildPixPayload, whatsappLink } from "@/lib/pix";

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
    void QRCode.toDataURL(payload, { width: 220, margin: 1, color: { dark: "#12202b", light: "#ffffff" } }).then(setQr);
  }, [payload]);

  async function copy(text: string, which: string) {
    await navigator.clipboard.writeText(text);
    setCopied(which);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="card p-6 grid md:grid-cols-[220px_1fr] gap-6 items-start">
      {qr ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={qr} alt="QR Code PIX" className="rounded-xl border border-line bg-white w-[220px] h-[220px]" />
      ) : (
        <div className="w-[220px] h-[220px] rounded-xl border border-line bg-white" />
      )}
      <div className="space-y-3">
        <div>
          <div className="text-xs uppercase tracking-wide text-muted font-semibold">Pagar com PIX</div>
          <h2 className="font-semibold mt-1">{label ?? "O dinheiro cai na conta da CodeCraft"}</h2>
          {amount ? <p className="text-2xl font-semibold mt-2">R$ {amount.toFixed(2).replace(".", ",")}</p> : null}
        </div>
        <p className="text-sm text-muted">
          Chave PIX (celular): <strong className="text-ink">{PIX_KEY}</strong>
        </p>
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-primary" type="button" onClick={() => void copy(PIX_KEY, "chave")}>
            {copied === "chave" ? "Chave copiada" : "Copiar chave"}
          </button>
          <button className="btn btn-ghost" type="button" onClick={() => void copy(payload, "pix")}>
            {copied === "pix" ? "PIX copiado" : "Copiar copia e cola"}
          </button>
          <a className="btn btn-ghost" href={whatsappLink(`Olá! Paguei o PIX ${label ?? ""} no valor de R$ ${amount?.toFixed(2) ?? ""}. Chave ${PIX_KEY}.`)}>
            Enviar comprovante
          </a>
        </div>
        <p className="text-xs text-muted">
          Abra o app do banco, pague o QR ou cole o código. A chave é {PIX_KEY}. Não pedimos senha e o chat não libera pagamento sozinho.
        </p>
      </div>
    </div>
  );
}
