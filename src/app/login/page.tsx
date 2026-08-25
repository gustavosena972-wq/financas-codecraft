"use client";

import { useState } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { loginAccount } from "@/lib/store";
import { go } from "@/lib/types";
import { supabaseConfigured } from "@/lib/supabase";

function nextPath() {
  if (typeof window === "undefined") return "/app";
  const next = new URLSearchParams(window.location.search).get("next");
  return next && next.startsWith("/") ? next : "/app";
}

export default function LoginPage() {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  return (
    <div className="min-h-screen grid place-items-center p-3 sm:p-6">
      <div className="card p-5 sm:p-8 w-full max-w-md space-y-4 sm:space-y-5">
        <BrandLogo />
        <div>
          <p className="kicker">Entrar</p>
          <h1 className="title">Sua empresa</h1>
        </div>
        {!supabaseConfigured() ? (
          <p className="text-sm text-negative">
            Falta ligar o Supabase do CodeCraft Gestão. Projeto só deste app, rode
            <code> supabase/schema.sql</code> e cole URL + anon key no <code>.env.local</code>.
          </p>
        ) : null}
        <form
          className="space-y-3"
          onSubmit={async (event) => {
            event.preventDefault();
            setPending(true);
            setError("");
            const form = new FormData(event.currentTarget);
            const result = await loginAccount(String(form.get("email")), String(form.get("password")));
            setPending(false);
            if (result.error) {
              setError(result.error);
              return;
            }
            go(nextPath());
          }}
        >
          <label className="field">
            <span>E-mail</span>
            <input name="email" type="email" required />
          </label>
          <label className="field">
            <span>Senha</span>
            <input name="password" type="password" required />
          </label>
          {error ? <p className="text-sm text-negative">{error}</p> : null}
          <button className="btn btn-primary w-full" disabled={pending}>
            {pending ? "Entrando…" : "Entrar"}
          </button>
        </form>
        <p className="text-sm text-muted">
          <Link href="/esqueci-senha">Esqueci a senha</Link>
        </p>
        <p className="text-sm text-muted">
          Novo por aqui? <Link href="/cadastro">Criar empresa</Link>
        </p>
      </div>
    </div>
  );
}
