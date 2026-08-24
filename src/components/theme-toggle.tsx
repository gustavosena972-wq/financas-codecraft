"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const next = localStorage.getItem("fn-theme") === "dark" ? "dark" : "light";
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
        localStorage.setItem("fn-theme", next);
        document.documentElement.setAttribute("data-theme", next);
      }}
    >
      {theme === "dark" ? "Claro" : "Escuro"}
    </button>
  );
}
