"use client";

import { useEffect, useState } from "react";
import { Empty, Gate, PageHead } from "@/components/shell";
import { addTask, addWork, requireSession, setTaskStatus, setWorkStatus, type Snapshot } from "@/lib/store";
import { useLive } from "@/lib/live";
import { go } from "@/lib/types";
import { hasOps } from "@/lib/plans";

const WORK = { PLAN: "Planejando", RUN: "Andando", BLOCKED: "Travado", DONE: "Pronto" };
const TASK = { TODO: "Fazer", DOING: "Fazendo", DONE: "Feito" };

export default function ProjetosPage() {
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
  const ok = hasOps(data.user);

  return (
    <div className="space-y-6">
      <PageHead kicker="Setor" title="Projetos" subtitle="O que está andando. A IA cria tarefa quando algo trava. Você só desbloqueia." />
      <Gate allowed={ok} title="Assine para abrir projetos" body="A assinatura da plataforma libera obras, tarefas e o acompanhamento da IA." />
      {ok ? (
        <>
          <form
            className="card p-6 grid sm:grid-cols-3 gap-3"
            onSubmit={async (event) => {
              event.preventDefault();
              setError("");
              const form = new FormData(event.currentTarget);
              try {
                await addWork({
                  name: String(form.get("name")),
                  ownerName: String(form.get("owner") ?? ""),
                  status: "PLAN",
                  dueAt: String(form.get("due") ?? ""),
                  notes: String(form.get("notes") ?? ""),
                });
                event.currentTarget.reset();
              } catch (err) {
                setError(err instanceof Error ? err.message : "Não deu para salvar.");
              }
            }}
          >
            <label className="field">
              <span>Projeto</span>
              <input name="name" required />
            </label>
            <label className="field">
              <span>Dono</span>
              <input name="owner" />
            </label>
            <label className="field">
              <span>Prazo</span>
              <input name="due" type="date" />
            </label>
            <label className="field sm:col-span-2">
              <span>Nota</span>
              <input name="notes" />
            </label>
            <div className="flex items-end">
              <button className="btn btn-primary">Abrir projeto</button>
            </div>
            {error ? <p className="text-sm text-negative sm:col-span-3">{error}</p> : null}
          </form>
          <div className="grid md:grid-cols-2 gap-4">
            {data.works.map((work) => (
              <article key={work.id} className="card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-bold">{work.name}</h2>
                    <p className="text-sm text-muted">{work.ownerName || "sem dono"} {work.dueAt ? `· ${work.dueAt}` : ""}</p>
                  </div>
                  <span className={`chip ${work.status === "BLOCKED" ? "bad" : work.status === "DONE" ? "ok" : ""}`}>
                    {WORK[work.status]}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 mt-3">
                  {(Object.keys(WORK) as Array<keyof typeof WORK>).map((status) => (
                    <button key={status} className="chip" type="button" onClick={() => void setWorkStatus(work.id, status)}>
                      {WORK[status]}
                    </button>
                  ))}
                </div>
              </article>
            ))}
          </div>
          <article className="card p-6">
            <h2 className="font-bold mb-3">Tarefas</h2>
            <form
              className="grid sm:grid-cols-3 gap-3 mb-4"
              onSubmit={async (event) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                await addTask({
                  title: String(form.get("title")),
                  area: String(form.get("area") || "OPS"),
                  status: "TODO",
                  assignee: String(form.get("assignee") ?? ""),
                  auto: false,
                });
                event.currentTarget.reset();
              }}
            >
              <input name="title" required placeholder="O que fazer" />
              <input name="assignee" placeholder="Com quem" />
              <button className="btn btn-ink">Criar tarefa</button>
            </form>
            <ul className="space-y-2">
              {data.tasks.map((task) => (
                <li key={task.id} className="flex items-center justify-between gap-3 border-b border-line py-2">
                  <div>
                    <div className="font-semibold text-sm">
                      {task.title} {task.auto ? <span className="chip">IA</span> : null}
                    </div>
                    <div className="text-xs text-muted">{task.area} {task.assignee ? `· ${task.assignee}` : ""}</div>
                  </div>
                  <select value={task.status} onChange={(event) => void setTaskStatus(task.id, event.target.value as typeof task.status)}>
                    {Object.entries(TASK).map(([id, label]) => (
                      <option key={id} value={id}>
                        {label}
                      </option>
                    ))}
                  </select>
                </li>
              ))}
            </ul>
            {!data.works.length && !data.tasks.length ? (
              <Empty title="Nada no radar" body="Abre um projeto. Se travar, a IA cria a tarefa de destravar." />
            ) : null}
          </article>
        </>
      ) : null}
    </div>
  );
}
