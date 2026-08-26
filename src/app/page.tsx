import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { DEPARTMENTS } from "@/lib/types";
import { PLANS } from "@/lib/plans";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <header className="land-top">
        <BrandLogo />
        <nav className="flex items-center gap-3 text-sm text-muted">
          <a className="hidden sm:inline" href="#modulos">
            Módulos
          </a>
          <a className="hidden sm:inline" href="#assinatura">
            Assinatura
          </a>
          <Link href="/login">Entrar</Link>
          <Link href="/cadastro" className="btn btn-primary">
            Começar
          </Link>
        </nav>
      </header>

      <section className="land-hero">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-[1.1fr_.9fr] gap-8 lg:gap-12 items-center">
          <div className="rise">
            <p className="kicker">// gestão empresarial · só empresas</p>
            <h1 className="font-extrabold tracking-tight leading-[1.12] mt-3 font-[family-name:var(--font-geist-mono)]">
              Financeiro e pessoas.
              <br />
              Uma plataforma <span style={{ color: "var(--gold)" }}>só para empresas.</span>
            </h1>
            <p className="mt-4 text-[#b9bedb] text-base sm:text-lg max-w-xl">
              CodeCraft Gestão une caixa, títulos, DRE, colaboradores e ponto eletrônico. Multi-tenant com RLS. Sem IA
              no painel — operação humana, clara e segura.
            </p>
            <div className="mt-6 flex flex-wrap gap-2 sm:gap-3">
              <Link href="/cadastro" className="btn btn-primary">
                Cadastrar empresa
              </Link>
              <Link href="/login" className="btn btn-ghost" style={{ color: "#fff", borderColor: "#4a517a" }}>
                Já tenho conta
              </Link>
            </div>
          </div>
          <div className="card p-4 sm:p-6 bg-[#1e2547] border-[#2c3358] text-white">
            <p className="kicker" style={{ color: "var(--gold)" }}>
              Escopo
            </p>
            <div className="grid grid-cols-2 gap-2 sm:gap-3 mt-4">
              {[
                ["Financeiro", "Caixa · títulos · DRE"],
                ["RH", "Cadastro · ponto · salários"],
                ["Assinatura", "R$ 280 a R$ 500"],
                ["Segurança", "RLS por empresa"],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl p-3 sm:p-4" style={{ background: "#161b33" }}>
                  <div className="text-[11px] text-[#b9bedb]">{k}</div>
                  <div className="text-sm font-bold mt-1">{v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="modulos" className="py-12 sm:py-20 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto">
          <p className="kicker">Módulos</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold mt-2 font-[family-name:var(--font-geist-mono)]">
            Operação unificada.
          </h2>
          <p className="text-muted mt-2 sm:mt-3 max-w-2xl text-sm sm:text-base">
            O mesmo padrão dos gigantes globais: um ecossistema, isolamento por cliente, UI limpa.
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 mt-6 sm:mt-10">
            {DEPARTMENTS.map((item, i) => (
              <article key={item.id} className="card p-3 sm:p-6">
                <p className="kicker">{String(i + 1).padStart(2, "0")}</p>
                <h3 className="font-bold mt-1 sm:mt-2 text-sm sm:text-base">{item.name}</h3>
                <p className="text-xs sm:text-sm text-muted mt-1 sm:mt-2">{item.does}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="assinatura" className="py-12 sm:py-20 px-4 sm:px-8 bg-bg-2">
        <div className="max-w-6xl mx-auto">
          <p className="kicker">Billing SaaS</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold mt-2 font-[family-name:var(--font-geist-mono)]">
            R$ 280 a R$ 500 por mês.
          </h2>
          <p className="text-muted mt-2 text-sm sm:text-base">
            PIX ou cartão com renovação mensal automática. Cancelamento no painel.
          </p>
          <div className="grid sm:grid-cols-3 gap-3 sm:gap-4 mt-6 sm:mt-10">
            {PLANS.map((plan) => (
              <article
                key={plan.id}
                className={`card p-4 sm:p-6 flex flex-col ${plan.highlight ? "ring-2 ring-[color:var(--gold)]" : ""}`}
              >
                {plan.badge ? <span className="chip warn w-fit">{plan.badge}</span> : null}
                <h3 className="font-bold text-base sm:text-lg mt-2">{plan.name}</h3>
                <div className="text-2xl sm:text-3xl font-extrabold mt-1 sm:mt-2">{plan.price}</div>
                <p className="text-xs text-muted">{plan.period}</p>
                <p className="text-xs sm:text-sm text-muted mt-2 sm:mt-3">{plan.forWho}</p>
                <ul className="text-xs sm:text-sm mt-3 sm:mt-4 space-y-1 sm:space-y-1.5 flex-1">
                  {plan.includes.map((line) => (
                    <li key={line}>· {line}</li>
                  ))}
                </ul>
                <Link href="/cadastro" className={`btn mt-4 sm:mt-5 ${plan.highlight ? "btn-primary" : "btn-ink"}`}>
                  Assinar {plan.name}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer className="px-4 sm:px-10 py-6 text-xs sm:text-sm text-muted flex justify-between border-t border-line flex-wrap gap-2">
        <span>CodeCraft Gestão · CodeCraft Solutions</span>
        <span className="flex gap-3">
          <Link href="/termos">Termos</Link>
          <Link href="/privacidade">Privacidade</Link>
        </span>
      </footer>
    </div>
  );
}
