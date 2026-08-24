"use client";

import { useEffect, useState } from "react";
import { PageHead } from "@/components/shell";
import { linkCompany, requireSession, type Snapshot } from "@/lib/store";
import { useLive } from "@/lib/live";
import { go, type OrgSize } from "@/lib/types";
import {
  formatCep,
  formatCnpj,
  isValidCnpj,
  lookupCnpj,
  onlyDigits,
  orgIsLinked,
} from "@/lib/company";
import { isSubscribed } from "@/lib/plans";

type Form = {
  cnpj: string;
  legalName: string;
  tradeName: string;
  ie: string;
  phone: string;
  email: string;
  cep: string;
  street: string;
  number: string;
  district: string;
  city: string;
  state: string;
  activity: string;
  legalRep: string;
  situation: string;
  size: OrgSize;
};

const empty: Form = {
  cnpj: "",
  legalName: "",
  tradeName: "",
  ie: "",
  phone: "",
  email: "",
  cep: "",
  street: "",
  number: "",
  district: "",
  city: "",
  state: "",
  activity: "",
  legalRep: "",
  situation: "",
  size: "pequena",
};

export default function EmpresaPage() {
  const live = useLive();
  const [data, setData] = useState<Snapshot | null>(null);
  const [form, setForm] = useState<Form>(empty);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const [looking, setLooking] = useState(false);

  useEffect(() => {
    void requireSession().then((session) => {
      if (!session) {
        go("/login");
        return;
      }
      setData(session);
      setForm({
        cnpj: formatCnpj(session.org.cnpj),
        legalName: session.org.legalName,
        tradeName: session.org.tradeName || session.org.name,
        ie: session.org.ie,
        phone: session.org.phone,
        email: session.org.email || session.user.email,
        cep: formatCep(session.org.cep),
        street: session.org.street,
        number: session.org.number,
        district: session.org.district,
        city: session.org.city,
        state: session.org.state,
        activity: session.org.activity,
        legalRep: session.org.legalRep || session.user.name,
        situation: session.org.situation,
        size: session.org.size,
      });
    });
  }, [live]);

  function set<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function search() {
    setError("");
    setInfo("");
    setLooking(true);
    const result = await lookupCnpj(form.cnpj);
    setLooking(false);
    if (result.error || !result.data) {
      setError(result.error ?? "Não achei a empresa.");
      return;
    }
    const found = result.data;
    setForm((current) => ({
      ...current,
      cnpj: formatCnpj(found.cnpj),
      legalName: found.legalName || current.legalName,
      tradeName: found.tradeName || current.tradeName,
      phone: found.phone || current.phone,
      email: found.email || current.email,
      cep: formatCep(found.cep),
      street: found.street || current.street,
      number: found.number || current.number,
      district: found.district || current.district,
      city: found.city || current.city,
      state: found.state || current.state,
      activity: found.activity || current.activity,
      situation: found.situation || current.situation,
    }));
    if (found.situation && found.situation.toUpperCase() !== "ATIVA") {
      setInfo(`Situação cadastral: ${found.situation}. Confira se esta ainda é a empresa certa.`);
    } else {
      setInfo("Encontrei os dados públicos deste CNPJ. Confira se é a sua empresa e complete o que faltar.");
    }
  }

  if (!data) return <p className="text-sm text-muted">Carregando a empresa…</p>;
  const linked = orgIsLinked(data.org);

  return (
    <div className="space-y-6">
      <PageHead
        kicker="Identidade"
        title={linked ? "Empresa ligada" : "Ligar a sua empresa"}
        subtitle="O CodeCraft Gestão só abre de verdade com CNPJ, razão social e endereço. A conta fica da empresa, não de um nome solto."
        extra={linked ? <span className="chip ok">ligada e gravada</span> : <span className="chip warn">falta ligar</span>}
      />

      <article className="card p-6 space-y-4">
        <p className="text-sm text-muted">
          Buscamos os dados públicos do CNPJ. Isso não pede senha da Receita e não mistura com outro banco. Confira se é a sua empresa antes de ligar.
        </p>
        <div className="grid sm:grid-cols-[1fr_auto] gap-3 items-end">
          <label className="field">
            <span>CNPJ</span>
            <input
              value={form.cnpj}
              onChange={(event) => set("cnpj", formatCnpj(event.target.value))}
              placeholder="00.000.000/0000-00"
              inputMode="numeric"
            />
          </label>
          <button className="btn btn-ink" type="button" disabled={looking} onClick={() => void search()}>
            {looking ? "Buscando…" : "Buscar empresa"}
          </button>
        </div>
        {info ? <p className="text-sm text-positive">{info}</p> : null}
      </article>

      <form
        className="card p-6 grid sm:grid-cols-2 gap-3"
        onSubmit={async (event) => {
          event.preventDefault();
          setError("");
          const cnpj = onlyDigits(form.cnpj);
          if (!isValidCnpj(cnpj)) {
            setError("CNPJ inválido. Sem isso a empresa não liga.");
            return;
          }
          if (form.legalName.trim().length < 3) {
            setError("Falta a razão social.");
            return;
          }
          if (form.city.trim().length < 2 || form.state.trim().length !== 2) {
            setError("Cidade e UF são obrigatórios.");
            return;
          }
          if (form.legalRep.trim().length < 3) {
            setError("Quem responde pela empresa?");
            return;
          }
          setBusy(true);
          try {
            await linkCompany({
              ...form,
              cnpj,
              cep: onlyDigits(form.cep),
              state: form.state.trim().toUpperCase(),
            });
            go(isSubscribed(data.user) ? "/app" : "/app/planos");
          } catch (err) {
            setError(err instanceof Error ? err.message : "Não deu para ligar a empresa.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <label className="field sm:col-span-2">
          <span>Razão social</span>
          <input value={form.legalName} onChange={(event) => set("legalName", event.target.value)} required />
        </label>
        <label className="field">
          <span>Nome fantasia</span>
          <input value={form.tradeName} onChange={(event) => set("tradeName", event.target.value)} />
        </label>
        <label className="field">
          <span>Porte</span>
          <select value={form.size} onChange={(event) => set("size", event.target.value as OrgSize)}>
            <option value="mei">MEI</option>
            <option value="pequena">Pequena</option>
            <option value="media">Média</option>
            <option value="grande">Grande</option>
          </select>
        </label>
        <label className="field">
          <span>Inscrição estadual</span>
          <input value={form.ie} onChange={(event) => set("ie", event.target.value)} />
        </label>
        <label className="field">
          <span>Atividade</span>
          <input value={form.activity} onChange={(event) => set("activity", event.target.value)} />
        </label>
        <label className="field">
          <span>Responsável</span>
          <input value={form.legalRep} onChange={(event) => set("legalRep", event.target.value)} required />
        </label>
        <label className="field">
          <span>Telefone</span>
          <input value={form.phone} onChange={(event) => set("phone", event.target.value)} />
        </label>
        <label className="field sm:col-span-2">
          <span>E-mail da empresa</span>
          <input type="email" value={form.email} onChange={(event) => set("email", event.target.value)} />
        </label>
        <label className="field">
          <span>CEP</span>
          <input value={form.cep} onChange={(event) => set("cep", formatCep(event.target.value))} />
        </label>
        <label className="field">
          <span>UF</span>
          <input value={form.state} maxLength={2} onChange={(event) => set("state", event.target.value.toUpperCase())} placeholder="MG" />
        </label>
        <label className="field sm:col-span-2">
          <span>Rua</span>
          <input value={form.street} onChange={(event) => set("street", event.target.value)} />
        </label>
        <label className="field">
          <span>Número</span>
          <input value={form.number} onChange={(event) => set("number", event.target.value)} />
        </label>
        <label className="field">
          <span>Bairro</span>
          <input value={form.district} onChange={(event) => set("district", event.target.value)} />
        </label>
        <label className="field sm:col-span-2">
          <span>Cidade</span>
          <input value={form.city} onChange={(event) => set("city", event.target.value)} required />
        </label>
        {form.situation ? (
          <p className="text-sm text-muted sm:col-span-2">Situação no cadastro público: {form.situation}</p>
        ) : null}
        {error ? <p className="text-sm text-negative sm:col-span-2">{error}</p> : null}
        <button className="btn btn-primary sm:col-span-2" disabled={busy}>
          {busy ? "Ligando…" : linked ? "Atualizar dados da empresa" : "Ligar esta empresa ao CodeCraft Gestão"}
        </button>
      </form>
    </div>
  );
}
