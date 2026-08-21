"use client";

import Link from "next/link";
import { GUIDE, START_STEPS } from "@/lib/guide";
import { PageHeader } from "@/components/page-header";
import { GuideVideo } from "@/components/guide-video";

export default function ComecarPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        kicker="Guia"
        title="Como usar"
        subtitle="Não quer ler? Aperte play. Quer ler? Três passos e uma frase por tela."
      />
      <GuideVideo />

      <section className="grid md:grid-cols-3 gap-3">
        {START_STEPS.map((step) => (
          <Link key={step.n} href={step.href} className="card p-5 hover:border-gold">
            <div className="text-gold font-mono text-xs mb-2">{step.n}</div>
            <h2 className="font-semibold">{step.title}</h2>
            <p className="text-sm text-muted mt-2">{step.body}</p>
          </Link>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">O que cada tela faz</h2>
        <div className="card overflow-hidden">
          <table className="table">
            <thead>
              <tr>
                <th>Tela</th>
                <th>Para que serve</th>
                <th>Dica</th>
              </tr>
            </thead>
            <tbody>
              {GUIDE.filter((item) => item.href !== "/app/comecar").map((item) => (
                <tr key={item.href}>
                  <td>
                    <Link href={item.href} className="font-medium underline-offset-2 hover:underline">
                      {item.title}
                    </Link>
                  </td>
                  <td className="text-sm">{item.does}</td>
                  <td className="text-sm text-muted">{item.tip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p className="text-sm text-muted">
        Dúvida de dinheiro, comprovante ou senha: fale com uma pessoa em Ajuda. O chat não pede senha e não mexe no PIX.
      </p>
    </div>
  );
}
