"use client";

import { useEffect, useState } from "react";

const SCENES = [
  [
    ["Receita jan", "R$ 8.000"],
    ["Fixas", "R$ 4.198"],
    ["Cartões", "R$ 4.817"],
    ["Saldo", "− R$ 1.015"],
  ],
  [
    ["Nubank", "R$ 1.580"],
    ["Inter", "R$ 2.283"],
    ["% cartão", "53% do mês"],
    ["Meta", "baixar a fatura"],
  ],
  [
    ["Três grupos", "cartão, fixas, outras"],
    ["Uma aba", "por mês"],
    ["O trabalho", "o mês fechar"],
    ["IA", "mostra a linha"],
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
        <div className="text-[#9aabba] text-[11px] uppercase tracking-[0.16em]">Painel — o mês da casa</div>
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
      <p className="text-[11px] text-[#9aabba]">Receita, contas da casa e cartão. O mês fecha ou não. A IA só aponta a linha.</p>
    </div>
  );
}
