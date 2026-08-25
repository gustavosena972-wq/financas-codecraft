"use client";

import { useState } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { requestPasswordReset } from "@/lib/store";
import { supabaseConfigured } from "@/lib/supabase";

export default function EsqueciSenhaPage() {
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);
  const [pending, setPending] = useState(false);

  return (
    <div className="min-h-screen grid place-items-center p-3 sm:p-6">
      <div className="card p-5 sm:p-8 w-full max-w-md space-y-4 sm:space-y-5">
        <BrandLogo />
        <div>
          <p className="kicker">Conta</p>
          <h1 className="title">Esqueci a senha</h1>
          <p className="text-sm text-muted mt-2">
            Digite o e-mail da conta. Enviamos um link para criar uma senha nova.
          </p>
        </div>
        {!supabaseConfigured() ? (
          <p className="text-sm text-negative">Supabase do CodeCraft Gestão ainda não está ligado.</p>
        ) : null}
        {ok ? (
          <div className="space-y-3">
            <p className="text-sm text-positive">
              Se existir conta com este e-mail, o link já foi enviado. Abra a caixa de entrada (e o spam) e
              clique no link.
            </p>
            <Link href="/login" className="btn btn-primary w-full">
              Voltar ao login
            </Link>
          </div>
        ) : (
          <form
            className="space-y-3"
            onSubmit={async (event) => {
              event.preventDefault();
              setPending(true);
              setError("");
              const form = new FormData(event.currentTarget);
              const result = await requestPasswordReset(String(form.get("email")));
              setPending(false);
              if (result.error) {
                setError(result.error);
                return;
              }
              setOk(true);
            }}
          >
            <label className="field">
              <span>E-mail</span>
              <input name="email" type="email" required autoComplete="email" />
            </label>
            {error ? <p className="text-sm text-negative">{error}</p> : null}
            <button className="btn btn-primary w-full" disabled={pending}>
              {pending ? "Enviando…" : "Enviar link"}
            </button>
          </form>
        )}
        <p className="text-sm text-muted">
          Lembrou a senha? <Link href="/login">Entrar</Link>
        </p>
      </div>
    </div>
  );
}
