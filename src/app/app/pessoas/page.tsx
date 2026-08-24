"use client";

import { useEffect, useState } from "react";
import { Empty, PageHead } from "@/components/shell";
import { addPerson, removePerson, requireSession, type Snapshot } from "@/lib/store";
import { useLive } from "@/lib/live";
import { DEPARTMENTS, go, today, type Department } from "@/lib/types";
import { peopleLimit } from "@/lib/plans";
import { brl, parseMoneyToCents } from "@/lib/money";

const ROLE = { ADMIN: "Admin", LEAD: "Líder", MEMBER: "Time" };
const STATUS = { ACTIVE: "Ativa", ONBOARDING: "Entrando", LEAVE: "Afastada" };

export default function PessoasPage() {
  const live = useLive();
  const [data, setData] = useState<Snapshot | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void requireSession().then((session) => {
      if (!session) go("/login");
      else setData(session);
    });
  }, [live]);

  if (!data) return null;
  const limit = peopleLimit(data.user.plan);

  return (
    <div className="space-y-6">
      <PageHead
        kicker="Setor"
        title="Pessoas"
        subtitle="Quem trabalha aqui, em qual setor, e se está ativa. A IA não demite. Isso é o 5%."
      />
      <p className="text-sm text-muted">
        {data.people.length}
        {Number.isFinite(limit) ? ` de ${limit}` : ""} pessoas neste plano.
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
              department: String(form.get("department")) as Department,
              role: String(form.get("role")) as "ADMIN" | "LEAD" | "MEMBER",
              status: "ACTIVE",
              salary: Math.max(0, salary),
              startedAt: today(),
            });
            event.currentTarget.reset();
          } catch (err) {
            setError(err instanceof Error ? err.message : "Não deu para salvar.");
          }
        }}
      >
        <label className="field">
          <span>Nome</span>
          <input name="name" required />
        </label>
        <label className="field">
          <span>E-mail</span>
          <input name="email" type="email" required />
        </label>
        <label className="field">
          <span>Setor</span>
          <select name="department" defaultValue="PESSOAS">
            {DEPARTMENTS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Papel</span>
          <select name="role" defaultValue="MEMBER">
            <option value="MEMBER">Time</option>
            <option value="LEAD">Líder</option>
            <option value="ADMIN">Admin</option>
          </select>
        </label>
        <label className="field">
          <span>Salário</span>
          <input name="salary" placeholder="0,00" />
        </label>
        <div className="flex items-end">
          <button className="btn btn-primary">Adicionar pessoa</button>
        </div>
        {error ? <p className="text-sm text-negative sm:col-span-2">{error}</p> : null}
      </form>
      {data.people.length ? (
        <div className="card overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Setor</th>
                <th>Papel</th>
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
                  <td>{DEPARTMENTS.find((item) => item.id === person.department)?.name ?? person.department}</td>
                  <td>{ROLE[person.role]}</td>
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
        <Empty title="Ainda só você" body="Chame o time. Cada pessoa entra num setor — vendas, caixa, projeto." />
      )}
    </div>
  );
}
