"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { registerAction } from "@/app/actions/auth";
import { AuthFrame } from "@/components/auth-frame";

export default function RegisterPage() {
  const [state, action, pending] = useActionState(registerAction, null);
  const [start, setStart] = useState("PERSONAL");

  return (
    <AuthFrame title="Criar conta" subtitle="A plataforma é para pessoa e para empresa. Os dois espaços já vêm no mesmo login — o dinheiro não se mistura.">
      <form action={action} className="space-y-4">
        <input type="hidden" name="mode" value={start} />
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
          <span>Por onde começar</span>
          <select
            value={start}
            onChange={(e) => {
              const next = e.target.value;
              setStart(next);
              try {
                localStorage.setItem("fc-pending-company-size", "autonomo");
              } catch {
                /* ignore */
              }
            }}
          >
            <option value="PERSONAL">Pessoa (casa, salário, família)</option>
            <option value="BUSINESS">Empresa (MEI, PJ, caixa)</option>
          </select>
        </label>
        <label className="field">
          <span>Nome da empresa</span>
          <input name="company" placeholder="Opcional — se ainda não tiver, fica Empresa" />
        </label>
        <label className="field">
          <span>Porte da empresa</span>
          <select
            name="porte"
            defaultValue="autonomo"
            onChange={(e) => {
              try {
                localStorage.setItem("fc-pending-company-size", e.target.value);
              } catch {
                /* ignore */
              }
            }}
          >
            <option value="autonomo">Autônomo</option>
            <option value="mei">MEI</option>
            <option value="pequena">Empresa pequena</option>
            <option value="grande">Empresa grande</option>
          </select>
        </label>
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
