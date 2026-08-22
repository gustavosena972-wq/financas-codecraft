"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { START_STEPS, guideAsset, guideForMode } from "@/lib/guide";
import { PageHeader } from "@/components/page-header";
import { GuideVideo } from "@/components/guide-video";
import { requireSession } from "@/lib/store";
import { useLive } from "@/lib/live";
import { go } from "@/lib/types";

export default function ComecarPage() {
  const live = useLive();
  const [mode, setMode] = useState<"PERSONAL" | "BUSINESS">("PERSONAL");

  useEffect(() => {
    void (async () => {
      const session = await requireSession();
      if (!session) {
        go("/login");
        return;
      }
      setMode(session.workspace.type === "BUSINESS" ? "BUSINESS" : "PERSONAL");
    })();
  }, [live]);

  const list = guideForMode(mode).filter((item) => item.href !== "/app/comecar");
  const company = mode === "BUSINESS";

  return (
    <div className="space-y-8">
      <PageHeader
        kicker={company ? "Empresa" : "Pessoa"}
        title="Como usar"
        subtitle={
          company
            ? "Este espaço é da empresa — autônomo, MEI, pequena ou grande. Análise, DRE e títulos. O pessoal fica no seletor do topo."
            : "Este espaço é seu. Gastos, caixa e o que cortar. DRE e títulos não aparecem aqui."
        }
      />
      <GuideVideo />
      <section className="card overflow-hidden">
        <div className="px-5 pt-4 pb-3">
          <p className="page-kicker">Teste gravado</p>
          <h2 className="font-semibold mt-1">Vídeo do projeto e dos planos</h2>
          <p className="text-sm text-muted mt-1">Pessoa, empresa, Grátis, Pro, Business e o PIX. Sem áudio de microfone — a voz fica no resumo acima.</p>
        </div>
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video className="w-full bg-ink" controls playsInline preload="metadata" src={guideAsset("/guide/teste-completo.mp4")} />
      </section>

      {!company ? (
        <section className="grid md:grid-cols-3 gap-3">
          {START_STEPS.map((step) => (
            <Link key={step.n} href={step.href} className="card p-5 hover:border-gold">
              <div className="text-gold font-mono text-xs mb-2">{step.n}</div>
              <h2 className="font-semibold">{step.title}</h2>
              <p className="text-sm text-muted mt-2">{step.body}</p>
            </Link>
          ))}
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="font-semibold">{company ? "Telas da empresa" : "Telas da pessoa"}</h2>
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
              {list.map((item) => (
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
        Planos: Grátis, Pro R$ 27,90, Business R$ 69,90 e Contador a combinar. O chat não pede senha e não mexe no PIX.
      </p>
    </div>
  );
}
