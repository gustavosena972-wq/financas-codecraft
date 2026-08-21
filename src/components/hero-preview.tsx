"use client";

import { useState } from "react";

const SCENES = [
  [
    ["Este mês sai", "R$ 4.820"],
    ["Próximo mês", "R$ 4.610"],
    ["Dá para cortar", "R$ 640 / mês"],
    ["Saldo projetado", "R$ 12.190"],
  ],
  [
    ["Entrou", "R$ 7.400"],
    ["Saiu", "R$ 5.180"],
    ["Sobra", "R$ 2.220"],
    ["No teto", "ainda cabe"],
  ],
  [
    ["Aluguel", "negociar"],
    ["Assinaturas", "R$ 89"],
    ["iFood", "R$ 420"],
    ["Corte sugerido", "R$ 180"],
  ],
];

export function HeroPreview() {
  const [scene, setScene] = useState(0);
  const [hot, setHot] = useState<number | null>(null);
  const cells = SCENES[scene];

  return (
    <div className="rounded-xl border border-[#2c4458] bg-panel-2 p-6 text-sm space-y-4 float-card">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[#9aabba] text-[11px] uppercase tracking-[0.16em]">Prévia — toque para girar</div>
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
      <p className="text-[11px] text-[#9aabba]">Clique em qualquer número. A planilha real faz isso com os seus gastos.</p>
    </div>
  );
}
