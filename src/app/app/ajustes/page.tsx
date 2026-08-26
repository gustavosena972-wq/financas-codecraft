"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHead } from "@/components/shell";
import { cancelSubscription, createInvite, inviteUrl, requireSession, revokeInvite, updatePassword, type Snapshot } from "@/lib/store";
import { useLive } from "@/lib/live";
import { go } from "@/lib/types";
import { isSubscribed, planLabel } from "@/lib/plans";
import { displayCompany, formatCnpj, orgIsLinked } from "@/lib/company";

export default function AjustesPage() {
  const live = useLive();
  const [data, setData] = useState<Snapshot | null>(null);
  const [pwdError, setPwdError] = useState("");
  const [pwdOk, setPwdOk] = useState("");
  const [pwdBusy, setPwdBusy] = useState(false);

  useEffect(() => {
    void requireSession().then((session) => {
      if (!session) go("/login");
      else setData(session);
    });
  }, [live]);

  if (!data) return null;
  const org = data.org;
  const linked = orgIsLinked(org);

  return (
    <div className="space-y-6">
      <PageHead
        kicker="Conta"
        title="Ajustes"
        subtitle="Conta do responsável e empresa ligada por CNPJ. Sem IA no painel."
      />
      <article className="card p-6 space-y-2">
        <p className="kicker">Você</p>
        <p className="font-bold text-lg">{data.user.name}</p>
        <p className="text-sm text-muted">{data.user.email}</p>
        <p className="text-sm">{planLabel(data.user)}</p>
        {isSubscribed(data.user) ? (
          <>
            <p className="text-sm text-muted">
              {data.user.billingMethod === "pix"
                ? "Assinatura PIX mensal · renovação automática todo mês"
                : `Cartão •••• ${data.user.cardLast4} · renovação mensal`}
            </p>
            <Link href="/app/planos" className="btn btn-ink w-fit mt-2">
              Ver assinatura
            </Link>
            <button
              className="btn btn-ghost w-fit"
              type="button"
              onClick={async () => {
                if (!window.confirm("Cancelar a assinatura agora?")) return;
                await cancelSubscription();
              }}
            >
              Cancelar assinatura
            </button>
          </>
        ) : (
          <Link href="/app/planos" className="btn btn-primary w-fit mt-2">
            Assinar a plataforma
          </Link>
        )}
      </article>

      <article className="card p-6 space-y-3">
        <p className="kicker">Senha</p>
        <h2 className="font-bold">Trocar senha</h2>
        <form
          className="grid sm:grid-cols-2 gap-3"
          onSubmit={async (event) => {
            event.preventDefault();
            setPwdBusy(true);
            setPwdError("");
            setPwdOk("");
            const form = new FormData(event.currentTarget);
            const password = String(form.get("password"));
            const confirm = String(form.get("confirm"));
            if (password !== confirm) {
              setPwdBusy(false);
              setPwdError("As senhas não são iguais.");
              return;
            }
            const result = await updatePassword(password);
            setPwdBusy(false);
            if (result.error) {
              setPwdError(result.error);
              return;
            }
            setPwdOk("Senha atualizada.");
            event.currentTarget.reset();
          }}
        >
          <label className="field">
            <span>Nova senha</span>
            <input name="password" type="password" required minLength={8} autoComplete="new-password" />
          </label>
          <label className="field">
            <span>Confirmar</span>
            <input name="confirm" type="password" required minLength={8} autoComplete="new-password" />
          </label>
          {pwdError ? <p className="text-sm text-negative sm:col-span-2">{pwdError}</p> : null}
          {pwdOk ? <p className="text-sm text-positive sm:col-span-2">{pwdOk}</p> : null}
          <button className="btn btn-ink sm:col-span-2 w-fit" disabled={pwdBusy}>
            {pwdBusy ? "Salvando…" : "Salvar senha"}
          </button>
        </form>
        <p className="text-xs text-muted">
          Sem acesso? Use <Link href="/esqueci-senha">Esqueci a senha</Link> no login.
        </p>
      </article>

      <article className="card p-6 space-y-2">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="kicker">Empresa</p>
          <span className={`chip ${linked ? "ok" : "warn"}`}>{linked ? "ligada" : "não ligada"}</span>
        </div>
        <p className="font-bold text-lg">{displayCompany(org)}</p>
        {linked ? (
          <>
            <p className="text-sm">{org.legalName}</p>
            <p className="text-sm text-muted">CNPJ {formatCnpj(org.cnpj)}</p>
            <p className="text-sm text-muted">
              {[org.street, org.number, org.district, org.city, org.state].filter(Boolean).join(" · ")}
            </p>
            <p className="text-sm text-muted">Responsável {org.legalRep}</p>
          </>
        ) : (
          <p className="text-sm text-muted">Sem CNPJ a plataforma não abre. Ligue a empresa primeiro.</p>
        )}
        <Link href="/app/empresa" className="btn btn-primary w-fit mt-2">
          {linked ? "Atualizar dados" : "Ligar empresa"}
        </Link>
      </article>

      {data.isOwner ? (
        <InvitesCard invites={data.invites} />
      ) : (
        <article className="card p-6">
          <p className="kicker">Acesso</p>
          <p className="text-sm text-muted mt-2">Você entrou por convite. Só o dono gerencia membros.</p>
        </article>
      )}
    </div>
  );
}

function InvitesCard({ invites }: { invites: Snapshot["invites"] }) {
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState("");

  return (
    <article className="card p-6 space-y-3">
      <p className="kicker">Equipe</p>
      <h2 className="font-bold">Convidar usuários</h2>
      <p className="text-sm text-muted">Gera um link. A pessoa cria conta (ou entra) e aceita o convite.</p>
      <form
        className="grid sm:grid-cols-[1fr_auto_auto] gap-3 items-end"
        onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          setError("");
          setOk("");
          setLink("");
          const form = new FormData(event.currentTarget);
          try {
            const invite = await createInvite(
              String(form.get("email")),
              String(form.get("role")) === "MEMBER" ? "MEMBER" : "ADMIN",
            );
            setLink(inviteUrl(invite.token));
            setOk("Convite criado.");
            event.currentTarget.reset();
          } catch (err) {
            setError(err instanceof Error ? err.message : "Falha ao convidar.");
          }
          setBusy(false);
        }}
      >
        <label className="field">
          <span>E-mail</span>
          <input name="email" type="email" required />
        </label>
        <label className="field">
          <span>Papel</span>
          <select name="role" defaultValue="ADMIN">
            <option value="ADMIN">Admin</option>
            <option value="MEMBER">Membro</option>
          </select>
        </label>
        <button className="btn btn-ink" disabled={busy}>
          {busy ? "…" : "Convidar"}
        </button>
      </form>
      {error ? <p className="text-sm text-negative">{error}</p> : null}
      {ok ? <p className="text-sm text-positive">{ok}</p> : null}
      {link ? (
        <div className="space-y-2">
          <p className="text-xs break-all bg-bg-2 p-3 rounded-lg">
            Link: <a href={link}>{link}</a>
          </p>
          <a
            className="btn btn-ink w-fit text-sm"
            href={`mailto:?subject=${encodeURIComponent("Convite CodeCraft Gestão")}&body=${encodeURIComponent(`Olá!\n\nVocê foi convidado. Abra o link:\n${link}\n`)}`}
          >
            Abrir e-mail com o link
          </a>
        </div>
      ) : null}
      {invites.length ? (
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>E-mail</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {invites.map((invite) => (
                <tr key={invite.id}>
                  <td>
                    {invite.email}
                    <div className="text-xs text-muted">{invite.role}</div>
                  </td>
                  <td>
                    {invite.claimedAt ? (
                      <span className="chip ok">aceito</span>
                    ) : (
                      <span className="chip warn">pendente</span>
                    )}
                  </td>
                  <td>
                    {!invite.claimedAt ? (
                      <button
                        className="text-xs text-muted"
                        type="button"
                        onClick={() => void revokeInvite(invite.id)}
                      >
                        Revogar
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </article>
  );
}
