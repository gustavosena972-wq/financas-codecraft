import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { DEPARTMENTS } from "@/lib/types";
import { PLANS, PIX_KEY } from "@/lib/plans";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <header className="land-top">
        <BrandLogo tone="light" />
        <nav className="flex items-center gap-4 text-sm text-[#c5cce0]">
          <a href="#setores">Setores</a>
          <a href="#planos">Planos</a>
          <Link href="/login">Entrar</Link>
          <Link href="/cadastro" className="btn btn-primary">
            Começar
          </Link>
        </nav>
      </header>

      <section className="land-hero">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-[1.1fr_.9fr] gap-12 items-center">
          <div className="rise">
            <p className="kicker">Finanças CodeCraft · sistema da empresa</p>
            <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.1] mt-3">
              Todos os setores.
              <br />
              Uma IA que <span style={{ color: "var(--gold)" }}>trabalha.</span>
            </h1>
            <p className="mt-5 text-[#c5cce0] text-lg max-w-xl">
              Você cadastra a conta. Depois liga o CNPJ da empresa. Só então o painel abre: pessoas, vendas, projetos, caixa e estoque.
              A IA cuida de 95% sozinha. Os 5% que mexem dinheiro ou gente, você confirma.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/cadastro" className="btn btn-primary">
                Criar empresa
              </Link>
              <Link href="/login" className="btn btn-ghost" style={{ color: "#fff", borderColor: "#3a4160" }}>
                Já tenho conta
              </Link>
            </div>
          </div>
          <div className="float-card card p-6 bg-[#1b2140] border-[#2c3358] text-white">
            <div className="flex items-center justify-between">
              <span className="kicker" style={{ color: "var(--gold)" }}>
                Painel ao vivo
              </span>
              <span className="pilot">
                <i className="dot" /> IA 95% autônoma
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-5">
              {[
                ["Pessoas", "12 ativas"],
                ["Pipeline", "R$ 84 mil"],
                ["Caixa", "R$ 31 mil"],
                ["Tarefas da IA", "7 hoje"],
              ].map(([k, v]) => (
                <div key={k} className="rounded-2xl p-4" style={{ background: "#14182a" }}>
                  <div className="text-[11px] text-[#9aa3b8]">{k}</div>
                  <div className="text-lg font-bold mt-1">{v}</div>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-[#9aa3b8] mt-4">Não é planilha. É a empresa inteira, com a IA no volante.</p>
          </div>
        </div>
      </section>

      <section id="setores" className="py-20 px-8">
        <div className="max-w-6xl mx-auto">
          <p className="kicker">Ferramentas que fazem sentido</p>
          <h2 className="text-3xl font-extrabold mt-2">Cada setor no seu lugar.</h2>
          <p className="text-muted mt-3 max-w-2xl">
            Fácil de entender. Sério no caixa. Um pouco divertido no resto — para a equipe querer abrir todo dia.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-10">
            {DEPARTMENTS.map((item, i) => (
              <article key={item.id} className="card sector p-6" style={{ animationDelay: `${i * 0.05}s` }}>
                <p className="kicker">{String(i + 1).padStart(2, "0")}</p>
                <h3 className="font-bold mt-2">{item.name}</h3>
                <p className="text-sm text-muted mt-2">{item.does}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="planos" className="py-20 px-8 bg-bg-2">
        <div className="max-w-6xl mx-auto">
          <p className="kicker">Assinatura</p>
          <h2 className="text-3xl font-extrabold mt-2">Planos claros.</h2>
          <p className="text-muted mt-2">PIX {PIX_KEY}. Renova todo mês. A IA não pede senha e não move dinheiro.</p>
          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4 mt-10">
            {PLANS.map((plan) => (
              <article key={plan.id} className={`card p-6 flex flex-col ${plan.highlight ? "ring-2 ring-[color:var(--gold)]" : ""}`}>
                {plan.badge ? <span className="chip warn w-fit">{plan.badge}</span> : null}
                <h3 className="font-bold text-lg mt-2">{plan.name}</h3>
                <div className="text-3xl font-extrabold mt-2">{plan.price}</div>
                <p className="text-xs text-muted">{plan.period}</p>
                <p className="text-sm text-muted mt-3">{plan.forWho}</p>
                <ul className="text-sm mt-4 space-y-1.5 flex-1">
                  {plan.includes.map((line) => (
                    <li key={line}>· {line}</li>
                  ))}
                </ul>
                <Link href="/cadastro" className={`btn mt-5 ${plan.highlight ? "btn-primary" : "btn-ink"}`}>
                  {plan.cta}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer className="px-10 py-8 text-sm text-muted flex justify-between border-t border-line flex-wrap gap-3">
        <span>Finanças CodeCraft · CodeCraft Solutions</span>
        <span>PIX {PIX_KEY}</span>
      </footer>
    </div>
  );
}
