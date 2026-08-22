"use client";

import { useEffect, useRef, useState } from "react";
import { guideAsset } from "@/lib/guide";

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
      <img className="bg-photo" src={guideAsset("/bg/house.png")} alt="" fetchPriority="high" decoding="async" />
      <i className="bg-wash" />
      <i className="bg-cursor" />
      {ripples.map((row) => (
        <span key={row.id} className="bg-ripple" style={{ left: row.x, top: row.y }} />
      ))}
    </div>
  );
}
