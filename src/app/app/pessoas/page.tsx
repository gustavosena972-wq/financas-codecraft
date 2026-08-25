"use client";

import { useEffect, useState } from "react";
import { Empty, Gate, PageHead } from "@/components/shell";
import { addPerson, punchClock, removePerson, requireSession, type Snapshot } from "@/lib/store";
import { useLive } from "@/lib/live";
import { PEOPLE_DEPARTMENTS, go, today, type Department, type TimePunch } from "@/lib/types";
import { hasHr, peopleLimit } from "@/lib/plans";
import { brl, parseMoneyToCents } from "@/lib/money";

const ROLE = { ADMIN: "Admin", LEAD: "Líder", MEMBER: "Colaborador" };
const STATUS = { ACTIVE: "Ativo", ONBOARDING: "Admissão", LEAVE: "Afastado" };
const PUNCH: Record<TimePunch["kind"], string> = {
  IN: "Entrada",
  OUT: "Saída",
  BREAK_START: "Início intervalo",
  BREAK_END: "Fim intervalo",
};

export default function PessoasPage() {
  const live = useLive();
  const [data, setData] = useState<Snapshot | null>(null);
  const [error, setError] = useState("");
  const [punchPerson, setPunchPerson] = useState("");

  useEffect(() => {
    void requireSession().then((session) => {
      if (!session) go("/login");
      else {
        setData(session);
        setPunchPerson(session.people[0]?.id ?? "");
      }
    });
  }, [live]);

  if (!data) return null;
  const ok = hasHr(data.user);
  const limit = peopleLimit(data.user);
  const payroll = data.people.reduce((sum, person) => sum + person.salary, 0);

  return (
    <div className="space-y-6">
      <PageHead
        kicker="RH"
        title="Pessoas"
        subtitle="Cadastro de colaboradores, ponto eletrônico e visão de folha."
        extra={<div className="text-right"><p className="kicker">Folha</p><p className="text-xl font-extrabold">{brl(payroll)}</p></div>}
      />
      <Gate allowed={ok} title="Assine para abrir o RH" body="Cadastro, ponto e folha entram com a assinatura da empresa." />
      {ok ? (
        <>
          <p className="text-sm text-muted">
            {data.people.length}
            {Number.isFinite(limit) ? ` de ${limit}` : ""} colaboradores neste plano.
          </p>

          <form
            className="card p-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-3"
            onSubmit={async (event) => {
              event.preventDefault();
              setError("");
              const form = new FormData(event.currentTarget);
              const salary = parseMoneyToCents(String(form.get("salary") ?? "0")) ?? 0;
              try {
                await addPerson({
                  name: String(form.get("name")),
                  email: String(form.get("email")),
                  document: String(form.get("document") || ""),
                  department: String(form.get("department")) as Department,
                  roleTitle: String(form.get("roleTitle") || ""),
                  role: String(form.get("role")) as "ADMIN" | "LEAD" | "MEMBER",
                  status: "ACTIVE",
                  salary: Math.max(0, salary),
                  benefits: String(form.get("benefits") || ""),
                  startedAt: today(),
                });
                event.currentTarget.reset();
              } catch (err) {
                setError(err instanceof Error ? err.message : "Não deu para salvar.");
              }
            }}
          >
            <h2 className="font-bold sm:col-span-2 lg:col-span-3">Novo colaborador</h2>
            <label className="field">
              <span>Nome</span>
              <input name="name" required />
            </label>
            <label className="field">
              <span>E-mail</span>
              <input name="email" type="email" required />
            </label>
            <label className="field">
              <span>Documento</span>
              <input name="document" placeholder="CPF" />
            </label>
            <label className="field">
              <span>Cargo</span>
              <input name="roleTitle" placeholder="Analista" />
            </label>
            <label className="field">
              <span>Setor</span>
              <select name="department" defaultValue="PESSOAS">
                {PEOPLE_DEPARTMENTS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Papel</span>
              <select name="role" defaultValue="MEMBER">
                <option value="MEMBER">Colaborador</option>
                <option value="LEAD">Líder</option>
                <option value="ADMIN">Admin</option>
              </select>
            </label>
            <label className="field">
              <span>Salário</span>
              <input name="salary" placeholder="0,00" />
            </label>
            <label className="field">
              <span>Benefícios</span>
              <input name="benefits" placeholder="VT, VR…" />
            </label>
            <div className="flex items-end">
              <button className="btn btn-primary">Adicionar</button>
            </div>
            {error ? <p className="text-sm text-negative sm:col-span-2 lg:col-span-3">{error}</p> : null}
          </form>

          {data.people.length ? (
            <div className="card overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Cargo</th>
                    <th>Setor</th>
                    <th>Status</th>
                    <th>Salário</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {data.people.map((person) => (
                    <tr key={person.id}>
                      <td>
                        <div className="font-semibold">{person.name}</div>
                        <div className="text-xs text-muted">{person.email}</div>
                      </td>
                      <td>
                        {person.roleTitle || ROLE[person.role]}
                        <div className="text-xs text-muted">{ROLE[person.role]}</div>
                      </td>
                      <td>{PEOPLE_DEPARTMENTS.find((item) => item.id === person.department)?.name ?? person.department}</td>
                      <td>
                        <span className={`chip ${person.status === "ACTIVE" ? "ok" : "warn"}`}>{STATUS[person.status]}</span>
                      </td>
                      <td>{person.salary ? brl(person.salary) : "—"}</td>
                      <td>
                        <button className="text-xs text-muted" type="button" onClick={() => void removePerson(person.id)}>
                          Remover
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty title="Sem colaboradores" body="Cadastre o time para bater ponto e acompanhar a folha." />
          )}

          {data.people.length ? (
            <article className="card p-6 space-y-4">
              <h2 className="font-bold">Ponto eletrônico</h2>
              <div className="grid sm:grid-cols-[1fr_auto] gap-3 items-end">
                <label className="field">
                  <span>Colaborador</span>
                  <select value={punchPerson} onChange={(event) => setPunchPerson(event.target.value)}>
                    {data.people.map((person) => (
                      <option key={person.id} value={person.id}>
                        {person.name}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(PUNCH) as TimePunch["kind"][]).map((kind) => (
                    <button
                      key={kind}
                      className="btn btn-ink"
                      type="button"
                      disabled={!punchPerson}
                      onClick={() => void punchClock({ personId: punchPerson, kind })}
                    >
                      {PUNCH[kind]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Quando</th>
                      <th>Colaborador</th>
                      <th>Tipo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.punches.slice(0, 30).map((punch) => {
                      const person = data.people.find((item) => item.id === punch.personId);
                      return (
                        <tr key={punch.id}>
                          <td>{new Date(punch.at).toLocaleString("pt-BR")}</td>
                          <td>{person?.name ?? "—"}</td>
                          <td>{PUNCH[punch.kind]}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {!data.punches.length ? <p className="text-sm text-muted pt-2">Nenhum ponto registrado ainda.</p> : null}
              </div>
            </article>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
