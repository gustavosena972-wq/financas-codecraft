"use client";

import { useEffect } from "react";
import { go } from "@/lib/types";

export default function RelatorioRedirect() {
  useEffect(() => {
    go("/app/dre");
  }, []);
  return <p className="text-sm text-muted">Abrindo o DRE…</p>;
}
