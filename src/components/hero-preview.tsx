"use client";

import { useEffect, useState } from "react";

const SCENES = [
  [
    ["Este mês sai", "R$ 9.015"],
    ["Vai faltar", "R$ 1.015"],
    ["No ano sobra", "R$ 15.859"],
    ["Dias no mês", "9"],
  ],
  [
    ["Até dezembro", "ainda sai"],
    ["Se o cartão cair 10%", "sobra mais"],
    ["Avaliado", "hoje"],
    ["IA", "o que fazer agora"],
  ],
  [
    ["Mês a mês", "gastar e sobrar"],
    ["Cartão", "baixar, não copiar"],
    ["Planilha", "entra uma vez"],
    ["Empresa", "outro espaço"],
  ],
];

export function HeroPreview() {
  const [scene, setScene] = useState(0);
  const [hot, setHot] = useState<number | null>(null);
  const cells = SCENES[scene];

  useEffect(() => {
    const id = window.setInterval(() => setScene((s) => (s + 1) % SCENES.length), 4200);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="rounded-xl border border-[#2c4458] bg-panel-2 p-6 text-sm space-y-4 float-card">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[#9aabba] text-[11px] uppercase tracking-[0.16em]">Painel — o que vai sobrar</div>
        <div className="flex gap-1">
          {SCENES.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Cena ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${i === scene ? "w-6 bg-gold" : "w-1.5 bg-[#2c4458]"}`}
              onClick={() => setScene(i)}
            />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {cells.map(([k, v], i) => (
          <button
            key={`${scene}-${k}`}
            type="button"
            className={`rounded-lg bg-panel p-4 text-left transition-transform duration-200 ${
              hot === i ? "scale-[1.04] ring-1 ring-gold/70" : "hover:scale-[1.02]"
            }`}
            onMouseEnter={() => setHot(i)}
            onMouseLeave={() => setHot(null)}
            onClick={() => setScene((s) => (s + 1) % SCENES.length)}
          >
            <div className="text-[11px] text-[#9aabba]">{k}</div>
            <div className="text-lg mt-1 text-white pop-in" key={v}>
              {v}
            </div>
          </button>
        ))}
      </div>
      <p className="text-[11px] text-[#9aabba]">Não é a planilha na tela. É o que ainda vai sair, o que sobra, e a dica de hoje.</p>
    </div>
  );
}
