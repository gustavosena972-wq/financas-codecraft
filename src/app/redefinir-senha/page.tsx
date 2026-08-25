"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { updatePassword, waitForRecoverySession } from "@/lib/store";
import { go } from "@/lib/types";
import { supabaseConfigured } from "@/lib/supabase";

export default function RedefinirSenhaPage() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [bootError, setBootError] = useState("");

  useEffect(() => {
    if (!supabaseConfigured()) {
      setBootError("Supabase do CodeCraft Gestão ainda não está ligado.");
      return;
    }
    void waitForRecoverySession().then((ok) => {
      if (!ok) {
        setBootError("Link inválido ou expirado. Peça um novo em Esqueci a senha.");
        return;
      }
      setReady(true);
    });
  }, []);

  return (
    <div className="min-h-screen grid place-items-center p-3 sm:p-6">
      <div className="card p-5 sm:p-8 w-full max-w-md space-y-4 sm:space-y-5">
        <BrandLogo />
        <div>
          <p className="kicker">Conta</p>
          <h1 className="title">Nova senha</h1>
          <p className="text-sm text-muted mt-2">Escolha uma senha com pelo menos 8 caracteres.</p>
        </div>
        {bootError ? (
          <div className="space-y-3">
            <p className="text-sm text-negative">{bootError}</p>
            <Link href="/esqueci-senha" className="btn btn-primary w-full">
              Pedir link de novo
            </Link>
          </div>
        ) : !ready ? (
          <p className="text-sm text-muted">Validando o link…</p>
        ) : (
          <form
            className="space-y-3"
            onSubmit={async (event) => {
              event.preventDefault();
              setPending(true);
              setError("");
              const form = new FormData(event.currentTarget);
              const password = String(form.get("password"));
              const confirm = String(form.get("confirm"));
              if (password !== confirm) {
                setPending(false);
                setError("As senhas não são iguais.");
                return;
              }
              const result = await updatePassword(password);
              setPending(false);
              if (result.error) {
                setError(result.error);
                return;
              }
              go("/app");
            }}
          >
            <label className="field">
              <span>Nova senha</span>
              <input name="password" type="password" required minLength={8} autoComplete="new-password" />
            </label>
            <label className="field">
              <span>Confirmar senha</span>
              <input name="confirm" type="password" required minLength={8} autoComplete="new-password" />
            </label>
            {error ? <p className="text-sm text-negative">{error}</p> : null}
            <button className="btn btn-primary w-full" disabled={pending}>
              {pending ? "Salvando…" : "Salvar senha e entrar"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
