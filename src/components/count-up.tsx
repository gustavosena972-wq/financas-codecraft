"use client";

import { useEffect, useState } from "react";
import { brl } from "@/lib/money";

export function CountMoney({
  cents,
  className,
}: {
  cents: number;
  className?: string;
}) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(cents);
      return;
    }
    const from = value;
    const start = performance.now();
    const dur = 720;
    let frame = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      const ease = 1 - (1 - p) ** 3;
      setValue(Math.round(from + (cents - from) * ease));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- animate from last painted value
  }, [cents]);

  return <span className={className}>{brl(value)}</span>;
}
