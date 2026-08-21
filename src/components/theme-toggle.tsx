"use client";

import { useEffect, useState } from "react";

const KEY = "fc-theme";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const stored = localStorage.getItem(KEY);
    const next = stored === "dark" ? "dark" : "light";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
  }, []);

  return (
    <button
      className="btn btn-ghost"
      type="button"
      onClick={() => {
        const next = theme === "dark" ? "light" : "dark";
        setTheme(next);
        localStorage.setItem(KEY, next);
        document.documentElement.setAttribute("data-theme", next);
      }}
    >
      {theme === "dark" ? "Claro" : "Escuro"}
    </button>
  );
}
