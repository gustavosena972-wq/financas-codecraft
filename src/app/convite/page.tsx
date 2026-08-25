"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { claimInvite, peekInvite } from "@/lib/store";
import { go } from "@/lib/types";
import { getSupabase, supabaseConfigured } from "@/lib/supabase";

function tokenFromUrl() {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("t") || "";
}

export default function ConvitePage() {
  const [token, setToken] = useState("");
  const [info, setInfo] = useState<{ email: string; orgName: string; role: string } | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const t = tokenFromUrl();
    setToken(t);
    if (!supabaseConfigured() || !t) {
      setError("Link de convite incompleto.");
      return;
    }
    void (async () => {
      const { data } = await getSupabase().auth.getSession();
      setAuthed(Boolean(data.session));
      const peek = await peekInvite(t);
      if (!peek.ok) {
        setError(peek.error);
        return;
      }
      setInfo({ email: peek.email, orgName: peek.orgName, role: peek.role });
    })();
  }, []);

  return (
    <div className="min-h-screen grid place-items-center p-3 sm:p-6">
      <div className="card p-5 sm:p-8 w-full max-w-md space-y-4">
        <BrandLogo />
        <div>
          <p className="kicker">Convite</p>
          <h1 className="title">Entrar na empresa</h1>
        </div>
        {error ? <p className="text-sm text-negative">{error}</p> : null}
        {info ? (
          <div className="space-y-2 text-sm">
            <p>
              Empresa <strong>{info.orgName}</strong>
            </p>
            <p className="text-muted">
              Convidado: {info.email} · papel {info.role}
            </p>
          </div>
        ) : null}
        {!authed && !error ? (
          <p className="text-sm text-muted">
            <Link href={`/login/?next=${encodeURIComponent(`/convite/?t=${token}`)}`}>Entre</Link> ou{" "}
            <Link href={`/cadastro/?invite=${encodeURIComponent(token)}`}>crie a conta</Link> com o e-mail do convite.
          </p>
        ) : null}
        {authed && info ? (
          <button
            className="btn btn-primary w-full"
            disabled={pending}
            type="button"
            onClick={async () => {
              setPending(true);
              setError("");
              const result = await claimInvite(token);
              setPending(false);
              if (result.error) {
                setError(result.error);
                return;
              }
              go("/app");
            }}
          >
            {pending ? "Entrando…" : "Aceitar convite"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
