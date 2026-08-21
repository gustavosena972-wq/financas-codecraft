"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { START_STEPS } from "@/lib/guide";

const KEY = "fc-welcome";

export function WelcomeGuide() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (localStorage.getItem(KEY) !== "1") setOpen(true);
  }, []);

  if (!open) return null;

  const last = step >= START_STEPS.length;
  function done() {
    localStorage.setItem(KEY, "1");
    setOpen(false);
  }

  return (
    <div className="guide-mask">
      <div className="card p-6 w-full max-w-md space-y-4">
        <p className="page-kicker">Começar</p>
        {last ? (
          <>
            <h2 className="text-lg font-semibold">Pronto. Use o app no seu ritmo.</h2>
            <p className="text-sm text-muted">
              Conta, lançamento, visão geral. Se não quiser ler, em Como usar tem um vídeo de um minuto.
            </p>
            <div className="flex gap-2">
              <Link href="/app/comecar" className="btn btn-primary" onClick={done}>
                Ver o vídeo
              </Link>
              <button className="btn btn-ghost" type="button" onClick={done}>
                Entrar
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="text-xs text-muted">Passo {step + 1} de {START_STEPS.length}</div>
            <h2 className="text-lg font-semibold">
              {START_STEPS[step].n}. {START_STEPS[step].title}
            </h2>
            <p className="text-sm text-muted">{START_STEPS[step].body}</p>
            <div className="flex flex-wrap gap-2">
              <button className="btn btn-primary" type="button" onClick={() => setStep(step + 1)}>
                Entendi
              </button>
              <Link href={START_STEPS[step].href} className="btn btn-ghost" onClick={done}>
                Ir para a tela
              </Link>
              <button className="btn btn-ghost" type="button" onClick={done}>
                Pular
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
