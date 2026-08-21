"use client";

import { useState } from "react";
import { AccountantChat } from "@/components/accountant-chat";

export function HelpFab() {
  const [open, setOpen] = useState(false);
  return (
    <>
      {open ? (
        <div className="help-panel">
          <AccountantChat compact />
        </div>
      ) : null}
      <button className={`help-fab ${open ? "open" : ""}`} type="button" onClick={() => setOpen((v) => !v)} aria-label="Contador">
        {open ? "×" : "AI"}
      </button>
    </>
  );
}
