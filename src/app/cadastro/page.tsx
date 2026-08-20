"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { registerAction } from "@/app/actions/auth";
import { AuthFrame } from "@/components/auth-frame";

export default function RegisterPage() {
  const [state, action, pending] = useActionState(registerAction, null);
  const [mode, setMode] = useState("PERSONAL");

  return (
    <AuthFrame title="Criar conta" subtitle="Pessoal, empresa, ou os dois — com dados separados.">
      <form action={action} className="space-y-4">
        <label className="field">
          <span>Nome</span>
          <input name="name" required placeholder="Seu nome" />
        </label>
        <label className="field">
          <span>E-mail</span>
          <input name="email" type="email" required />
        </label>
        <label className="field">
          <span>Senha</span>
          <input name="password" type="password" minLength={8} required />
        </label>
        <label className="field">
          <span>Como vai usar</span>
          <select name="mode" value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="PERSONAL">Pessoal</option>
            <option value="BUSINESS">Empresa</option>
            <option value="BOTH">Pessoal e empresa</option>
          </select>
        </label>
        {mode !== "PERSONAL" ? (
          <label className="field">
            <span>Nome da empresa</span>
            <input name="company" placeholder="Opcional" />
          </label>
        ) : null}
        {state?.error ? <p className="text-sm text-negative">{state.error}</p> : null}
        <button className="btn btn-primary w-full" disabled={pending}>
          {pending ? "Criando…" : "Criar conta"}
        </button>
      </form>
      <p className="text-sm text-muted mt-6 text-center">
        Já tem conta?{" "}
        <Link href="/login" className="text-ink font-semibold">
          Entrar
        </Link>
      </p>
    </AuthFrame>
  );
}
