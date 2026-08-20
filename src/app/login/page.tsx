"use client";

import Link from "next/link";
import { useActionState } from "react";
import { demoLoginAction, loginAction } from "@/app/actions/auth";
import { AuthFrame } from "@/components/auth-frame";

export default function LoginPage() {
  const [state, action, pending] = useActionState(loginAction, null);

  return (
    <AuthFrame title="Entrar" subtitle="Acesse sua base financeira.">
      <form action={action} className="space-y-4">
        <label className="field">
          <span>E-mail</span>
          <input name="email" type="email" required placeholder="voce@email.com" />
        </label>
        <label className="field">
          <span>Senha</span>
          <input name="password" type="password" required />
        </label>
        {state?.error ? <p className="text-sm text-negative">{state.error}</p> : null}
        <button className="btn btn-primary w-full" disabled={pending}>
          {pending ? "Entrando…" : "Entrar"}
        </button>
      </form>
      <form action={demoLoginAction} className="mt-3">
        <button className="btn btn-ghost w-full">Ver demonstração</button>
      </form>
      <p className="text-sm text-muted mt-6 text-center">
        Ainda não tem conta?{" "}
        <Link href="/cadastro" className="text-ink font-semibold">
          Criar agora
        </Link>
      </p>
    </AuthFrame>
  );
}
