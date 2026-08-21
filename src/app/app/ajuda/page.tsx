"use client";

import Link from "next/link";
import { HelpChat } from "@/components/help-chat";
import { PixPay } from "@/components/pix-pay";
import { PIX_KEY, whatsappLink } from "@/lib/pix";

export default function AjudaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Ajuda</h1>
        <p className="text-sm text-muted max-w-2xl">
          O chat do contador é a tela principal. Aqui é só PIX, comprovante e falar com uma pessoa.
        </p>
      </div>
      <Link href="/app/comecar" className="card p-5 block hover:border-gold">
        <div className="font-semibold">Como usar a plataforma</div>
        <p className="text-sm text-muted mt-1">Vídeo de um minuto, com voz, ou o texto curto das telas.</p>
      </Link>
      <PixPay label="PIX da CodeCraft · chave 31999758385" />
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
