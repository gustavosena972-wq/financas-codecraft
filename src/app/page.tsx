import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { DEPARTMENTS } from "@/lib/types";
import { PLAN, PIX_KEY } from "@/lib/plans";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <header className="land-top">
        <BrandLogo tone="light" />
        <nav className="flex items-center gap-4 text-sm text-[#c5cce0]">
          <a href="#setores">Setores</a>
          <a href="#assinatura">Assinatura</a>
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

      <section id="assinatura" className="py-20 px-8 bg-bg-2">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-[1fr_1fr] gap-8 items-start">
          <div>
            <p className="kicker">Cobrança da plataforma</p>
            <h2 className="text-3xl font-extrabold mt-2">Um plano. R$ 249 por mês.</h2>
            <p className="text-muted mt-3 max-w-xl">{PLAN.forWho}</p>
            <ul className="mt-6 space-y-2 text-sm">
              {PLAN.includes.map((line) => (
                <li key={line}>· {line}</li>
              ))}
            </ul>
          </div>
          <article className="card p-8 space-y-4">
            <p className="chip ok w-fit">Assinatura única</p>
            <div className="text-5xl font-extrabold">{PLAN.price}</div>
            <p className="text-sm text-muted">{PLAN.period}</p>
            <div className="grid sm:grid-cols-2 gap-3 pt-2">
              <div className="rounded-2xl border border-line p-4">
                <p className="font-bold">Cartão</p>
                <p className="text-sm text-muted mt-1">Cobra sozinho todo mês.</p>
              </div>
              <div className="rounded-2xl border border-line p-4">
                <p className="font-bold">PIX</p>
                <p className="text-sm text-muted mt-1">Chave da plataforma {PIX_KEY}.</p>
              </div>
            </div>
            <Link href="/cadastro" className="btn btn-primary">
              Assinar agora
            </Link>
          </article>
        </div>
      </section>

      <footer className="px-10 py-8 text-sm text-muted flex justify-between border-t border-line flex-wrap gap-3">
        <span>Finanças CodeCraft · CodeCraft Solutions</span>
        <span>PIX da plataforma {PIX_KEY}</span>
      </footer>
    </div>
  );
}
