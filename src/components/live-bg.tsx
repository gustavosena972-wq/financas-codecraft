"use client";

import { useEffect, useRef, useState } from "react";

const BITS = Array.from({ length: 22 }, (_, i) => ({
  left: `${(i * 13 + 7) % 96}%`,
  top: `${(i * 19 + 4) % 92}%`,
  delay: `${(i % 9) * 0.45}s`,
  dur: `${10 + (i % 8) * 1.4}s`,
  size: 5 + (i % 4) * 3,
  kind: i % 4,
}));

type Ripple = { id: number; x: number; y: number };

export function LiveBg() {
  const root = useRef<HTMLDivElement>(null);
  const [ripples, setRipples] = useState<Ripple[]>([]);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const x = e.clientX / window.innerWidth - 0.5;
        const y = e.clientY / window.innerHeight - 0.5;
        el.style.setProperty("--mx", x.toFixed(3));
        el.style.setProperty("--my", y.toFixed(3));
        el.style.setProperty("--cx", `${e.clientX}px`);
        el.style.setProperty("--cy", `${e.clientY}px`);
      });
    };
    const onDown = (e: PointerEvent) => {
      const id = Date.now() + Math.random();
      setRipples((current) => [...current.slice(-7), { id, x: e.clientX, y: e.clientY }]);
      window.setTimeout(() => {
        setRipples((current) => current.filter((row) => row.id !== id));
      }, 900);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
    };
  }, []);

  return (
    <div className="bg-motion" ref={root} aria-hidden="true">
      <i className="bg-aurora" />
      <i className="bg-orb a" />
      <i className="bg-orb b" />
      <i className="bg-orb c" />
      <i className="bg-cursor" />
      <i className="bg-grid" />
      {BITS.map((bit, i) => (
        <span
          key={i}
          className={`bg-bit k${bit.kind}`}
          style={{
            left: bit.left,
            top: bit.top,
            width: bit.size,
            height: bit.size,
            animationDelay: bit.delay,
            animationDuration: bit.dur,
          }}
        />
      ))}
      {ripples.map((row) => (
        <span key={row.id} className="bg-ripple" style={{ left: row.x, top: row.y }} />
      ))}
    </div>
  );
}
