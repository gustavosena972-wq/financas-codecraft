"use client";

import { useEffect, useMemo, useState } from "react";
import { Empty, Gate, PageHead } from "@/components/shell";
import {
  addPerson,
  generatePayroll,
  payPayroll,
  punchClock,
  removePerson,
  requireSession,
  updatePerson,
  type Snapshot,
} from "@/lib/store";
import { useLive } from "@/lib/live";
import { PEOPLE_DEPARTMENTS, go, today, type Department, type Person, type TimePunch } from "@/lib/types";
import { hasHr, peopleLimit } from "@/lib/plans";
import { brl, parseMoneyToCents } from "@/lib/money";
import { competenceNow, formatHours, mirrorRows } from "@/lib/payroll";
import { downloadCsv } from "@/lib/csv";

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
  const [competence, setCompetence] = useState(competenceNow());
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<Person | null>(null);

  useEffect(() => {
    void requireSession().then((session) => {
      if (!session) go("/login");
      else {
        setData(session);
        setPunchPerson(session.people[0]?.id ?? "");
      }
    });
  }, [live]);

  const mirror = useMemo(
    () => (data ? mirrorRows(data.people, data.punches, competence) : []),
    [data, competence],
  );
  const currentRun = data?.payrollRuns.find((r) => r.competence === competence) ?? null;

  if (!data) return null;
  const ok = hasHr(data.user);
  const limit = peopleLimit(data.user);
  const payroll = data.people.reduce((sum, person) => sum + person.salary, 0);

  return (
    <div className="space-y-6">
      <PageHead
        kicker="RH"
        title="Pessoas"
        subtitle="Cadastro, ponto eletrônico, espelho de horas e folha do mês."
        extra={
          <div className="text-right">
            <p className="kicker">Folha base</p>
            <p className="text-xl font-extrabold">{brl(payroll)}</p>
          </div>
        }
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
                      <td className="space-x-2 whitespace-nowrap">
                        <button className="text-xs text-muted" type="button" onClick={() => setEditing(person)}>
                          Editar
                        </button>
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

          {editing ? (
            <form
              className="card p-6 grid sm:grid-cols-2 gap-3"
              onSubmit={async (event) => {
                event.preventDefault();
                setError("");
                const form = new FormData(event.currentTarget);
                const salary = parseMoneyToCents(String(form.get("salary") ?? "0")) ?? 0;
                try {
                  await updatePerson(editing.id, {
                    name: String(form.get("name")),
                    email: String(form.get("email")),
                    document: String(form.get("document") || ""),
                    department: String(form.get("department")) as Department,
                    roleTitle: String(form.get("roleTitle") || ""),
                    role: String(form.get("role")) as Person["role"],
                    status: String(form.get("status")) as Person["status"],
                    salary: Math.max(0, salary),
                    benefits: String(form.get("benefits") || ""),
                  });
                  setEditing(null);
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Não deu para salvar.");
                }
              }}
            >
              <h2 className="font-bold sm:col-span-2">Editar {editing.name}</h2>
              <label className="field">
                <span>Nome</span>
                <input name="name" defaultValue={editing.name} required />
              </label>
              <label className="field">
                <span>E-mail</span>
                <input name="email" type="email" defaultValue={editing.email} required />
              </label>
              <label className="field">
                <span>Documento</span>
                <input name="document" defaultValue={editing.document} />
              </label>
              <label className="field">
                <span>Cargo</span>
                <input name="roleTitle" defaultValue={editing.roleTitle} />
              </label>
              <label className="field">
                <span>Setor</span>
                <select name="department" defaultValue={editing.department}>
                  {PEOPLE_DEPARTMENTS.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Papel</span>
                <select name="role" defaultValue={editing.role}>
                  <option value="MEMBER">Colaborador</option>
                  <option value="LEAD">Líder</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </label>
              <label className="field">
                <span>Status</span>
                <select name="status" defaultValue={editing.status}>
                  <option value="ACTIVE">Ativo</option>
                  <option value="ONBOARDING">Admissão</option>
                  <option value="LEAVE">Afastado</option>
                </select>
              </label>
              <label className="field">
                <span>Salário</span>
                <input name="salary" defaultValue={(editing.salary / 100).toFixed(2).replace(".", ",")} />
              </label>
              <label className="field sm:col-span-2">
                <span>Benefícios</span>
                <input name="benefits" defaultValue={editing.benefits} />
              </label>
              <div className="flex gap-2 sm:col-span-2">
                <button className="btn btn-primary" type="submit">
                  Salvar
                </button>
                <button className="btn btn-ghost" type="button" onClick={() => setEditing(null)}>
                  Cancelar
                </button>
              </div>
            </form>
          ) : null}

          {data.people.length ? (
            <article className="card p-6 space-y-4">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="font-bold">Espelho de ponto</h2>
                  <p className="text-sm text-muted">Horas do mês a partir das batidas IN/OUT.</p>
                </div>
                <label className="field w-40">
                  <span>Competência</span>
                  <input type="month" value={competence} onChange={(e) => setCompetence(e.target.value)} />
                </label>
              </div>
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Colaborador</th>
                      <th>Horas</th>
                      <th>Salário</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mirror.map(({ person, minutes }) => (
                      <tr key={person.id}>
                        <td>{person.name}</td>
                        <td>{formatHours(minutes)}</td>
                        <td>{person.salary ? brl(person.salary) : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          ) : null}

          {data.people.length ? (
            <article className="card p-6 space-y-4">
              <h2 className="font-bold">Folha do mês</h2>
              <p className="text-sm text-muted">
                Gera a folha com salário dos ativos e horas do espelho. Ao pagar, lança a saída no Financeiro.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  className="btn btn-ink"
                  type="button"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    setError("");
                    try {
                      await generatePayroll(competence);
                    } catch (err) {
                      setError(err instanceof Error ? err.message : "Falha na folha.");
                    }
                    setBusy(false);
                  }}
                >
                  {busy ? "Gerando…" : "Gerar / atualizar folha"}
                </button>
                {currentRun && currentRun.status === "OPEN" ? (
                  <button
                    className="btn btn-primary"
                    type="button"
                    disabled={busy}
                    onClick={async () => {
                      if (!window.confirm(`Pagar folha ${currentRun.competence} (${brl(currentRun.totalCents)})?`)) return;
                      setBusy(true);
                      setError("");
                      try {
                        await payPayroll(currentRun.id);
                      } catch (err) {
                        setError(err instanceof Error ? err.message : "Falha ao pagar.");
                      }
                      setBusy(false);
                    }}
                  >
                    Marcar como paga · {brl(currentRun.totalCents)}
                  </button>
                ) : null}
                {currentRun?.status === "PAID" ? (
                  <span className="chip ok">Paga em {currentRun.paidAt ? new Date(currentRun.paidAt).toLocaleDateString("pt-BR") : "—"}</span>
                ) : null}
                {currentRun?.lines.length ? (
                  <button
                    className="btn btn-ghost"
                    type="button"
                    onClick={() =>
                      downloadCsv(
                        `folha-${currentRun.competence}`,
                        ["Colaborador", "Horas", "Salario_centavos"],
                        currentRun.lines.map((l) => [l.personName, formatHours(l.hoursMinutes), l.salaryCents]),
                      )
                    }
                  >
                    Exportar CSV
                  </button>
                ) : null}
              </div>
              {currentRun?.lines.length ? (
                <div className="overflow-x-auto">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Colaborador</th>
                        <th>Horas</th>
                        <th>Salário</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentRun.lines.map((line) => (
                        <tr key={line.id}>
                          <td>{line.personName}</td>
                          <td>{formatHours(line.hoursMinutes)}</td>
                          <td>{brl(line.salaryCents)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-muted">Ainda sem folha nesta competência.</p>
              )}
            </article>
          ) : null}

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
