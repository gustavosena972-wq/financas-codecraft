"use client";

import { useState } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { registerAccount } from "@/lib/store";
import { go } from "@/lib/types";
import { supabaseConfigured } from "@/lib/supabase";

function inviteToken() {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("invite") || "";
}

export default function CadastroPage() {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  return (
    <div className="min-h-screen grid place-items-center p-3 sm:p-6">
      <div className="card p-5 sm:p-8 w-full max-w-lg space-y-4 sm:space-y-5">
        <BrandLogo />
        <div>
          <p className="kicker">Cadastro</p>
          <h1 className="title">Sua conta, depois a empresa</h1>
          <p className="text-sm text-muted mt-2">Primeiro você. Em seguida o CNPJ liga a empresa de verdade.</p>
        </div>
        {!supabaseConfigured() ? (
          <p className="text-sm text-negative">
            Ainda falta o Supabase do CodeCraft Gestão. Projeto só deste app, separado do site.
          </p>
        ) : null}
        <form
          className="grid sm:grid-cols-2 gap-3"
          onSubmit={async (event) => {
            event.preventDefault();
            setPending(true);
            setError("");
            const form = new FormData(event.currentTarget);
            const token = inviteToken();
            const result = await registerAccount({
              name: String(form.get("name")),
              email: String(form.get("email")),
              password: String(form.get("password")),
              company: String(form.get("company") || "Empresa"),
              size: String(form.get("size")) as "mei" | "pequena" | "media" | "grande",
              inviteToken: token || undefined,
            });
            setPending(false);
            if (result.error) {
              setError(result.error);
              return;
            }
            go(token ? "/app" : "/app/empresa");
          }}
        >
          <label className="field sm:col-span-2">
            <span>Seu nome</span>
            <input name="name" required minLength={2} />
          </label>
          <label className="field">
            <span>E-mail</span>
            <input name="email" type="email" required />
          </label>
          <label className="field">
            <span>Senha</span>
            <input name="password" type="password" required minLength={8} />
          </label>
          <label className={`field ${inviteToken() ? "hidden" : ""}`}>
            <span>Nome da empresa</span>
            <input name="company" required={!inviteToken()} minLength={2} defaultValue={inviteToken() ? "—" : ""} />
          </label>
          <label className={`field ${inviteToken() ? "hidden" : ""}`}>
            <span>Porte</span>
            <select name="size" defaultValue="pequena">
              <option value="mei">MEI</option>
              <option value="pequena">Pequena</option>
              <option value="media">Média</option>
              <option value="grande">Grande</option>
            </select>
          </label>
          {error ? <p className="text-sm text-negative sm:col-span-2">{error}</p> : null}
          <label className="flex gap-2 items-start text-xs text-muted sm:col-span-2">
            <input name="terms" type="checkbox" required className="mt-0.5" />
            <span>
              Li e aceito os <Link href="/termos">Termos</Link> e a <Link href="/privacidade">Privacidade</Link>.
            </span>
          </label>
          <button className="btn btn-primary sm:col-span-2" disabled={pending}>
            {pending ? "Criando conta…" : "Continuar para a empresa"}
          </button>
        </form>
        <p className="text-sm text-muted">
          Já tem conta? <Link href="/login">Entrar</Link>
        </p>
      </div>
    </div>
  );
}
