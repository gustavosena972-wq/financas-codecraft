"use client";

import { HelpChat } from "@/components/help-chat";
import { PIX_KEY, whatsappLink } from "@/lib/pix";

export default function AjudaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Ajuda</h1>
        <p className="text-sm text-muted max-w-2xl">
          Tem um chat no meio, mas ele só responde o que é seguro. Compra, comprovante e problema de conta
          passam por uma pessoa. Ninguém da CodeCraft pede senha.
        </p>
      </div>
      <HelpChat />
      <div className="card p-5 text-sm space-y-2">
        <p>Chave PIX da CodeCraft: <strong>{PIX_KEY}</strong></p>
        <a className="btn btn-primary" href={whatsappLink("Olá, preciso de ajuda no Finanças CodeCraft.")}>
          Falar com uma pessoa
        </a>
      </div>
    </div>
  );
}
