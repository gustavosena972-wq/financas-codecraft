"use client";

import { useState } from "react";
import { HelpChat } from "@/components/help-chat";

export function HelpFab() {
  const [open, setOpen] = useState(false);
  return (
    <>
      {open ? (
        <div className="help-panel">
          <HelpChat compact />
        </div>
      ) : null}
      <button className={`help-fab ${open ? "open" : ""}`} type="button" onClick={() => setOpen((v) => !v)} aria-label="Ajuda">
        {open ? "×" : "?"}
      </button>
    </>
  );
}
