import Link from "next/link";
import { PlansGrid } from "@/components/plans-grid";
import { PIX_PLAN_KEY } from "@/lib/plans";
import { HeroPreview } from "@/components/hero-preview";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-panel text-[#e8edf2]">
      <header className="flex items-center justify-between px-8 py-5 border-b border-[#2c4458]">
        <div className="flex items-center gap-2">
          <span className="mark">FC</span>
          <span className="font-semibold tracking-tight">Finanças CodeCraft</span>
        </div>
        <nav className="flex items-center gap-6 text-sm text-[#b7c4cf]">
          <a href="#pessoa">Pessoa</a>
          <a href="#empresa">Empresa</a>
          <a href="#planos">Planos</a>
          <Link href="/login">Entrar</Link>
          <Link href="/cadastro" className="btn btn-primary">Começar</Link>
        </nav>
      </header>

      <section className="px-8 py-24 max-w-6xl mx-auto grid lg:grid-cols-[1.1fr_.9fr] gap-14 items-center">
        <div className="rise">
          <p className="text-gold text-xs tracking-[0.2em] uppercase mb-4">Dois espaços. Nada misturado.</p>
          <h1 className="text-4xl lg:text-5xl font-semibold tracking-tight leading-[1.12] text-white max-w-3xl">
            Pessoa de um lado.
            <br />
            Empresa do outro.
          </h1>
          <p className="mt-5 text-[#b7c4cf] text-lg max-w-2xl">
            Cada um tem o seu menu e o seu plano. Você troca no topo. O dinheiro da pessoa não entra no caixa da empresa.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/cadastro" className="btn btn-primary">Criar conta</Link>
            <Link href="/login" className="btn btn-ghost" style={{ color: "#fff", borderColor: "#2c4458" }}>
              Já tenho conta
            </Link>
          </div>
        </div>
        <HeroPreview />
      </section>

      <section id="pessoa" className="bg-bg text-ink py-20 px-8">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-10 items-start">
          <div>
            <p className="page-kicker">Para pessoa</p>
            <h2 className="text-3xl font-semibold mt-2">Três passos. Sem DRE, sem título.</h2>
            <p className="text-muted mt-3">
              Coloca os gastos, olha o caixa e corta o que pesa. Plano grátis ou Pessoal por R$ 29.
            </p>
          </div>
          <div className="grid gap-4">
            {[
              ["1. Coloca os gastos", "Excel ou lançamento na mão. Mercado, aluguel, luz."],
              ["2. A planilha monta o caixa", "O que entra, o que sai e a previsão dos próximos meses."],
              ["3. A IA diz o que cortar", "Onde o dinheiro pesa e quanto baixa se negociar a conta."],
            ].map(([title, body], i) => (
              <article key={title} className={`card p-5 rise rise-d${i + 1}`}>
                <h3 className="font-semibold">{title}</h3>
                <p className="text-sm text-muted mt-2">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="empresa" className="bg-bg-2 text-ink py-20 px-8">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-10 items-start">
          <div>
            <p className="page-kicker">Para empresa</p>
            <h2 className="text-3xl font-semibold mt-2">Tesouraria de verdade.</h2>
            <p className="text-muted mt-3">
              Títulos, DRE, conciliação e equipe. Só aparece quando o espaço é Empresa. Plano Empresa R$ 199, Empresa Plus R$ 399.
            </p>
          </div>
          <div className="grid gap-4">
            {[
              ["Títulos", "Contas a pagar e a receber. Baixa vira lançamento no caixa."],
              ["DRE e fluxo", "Resultado do período e o saldo que ainda vai entrar ou sair."],
              ["Conciliação e equipe", "Bate com o banco. Até 8 pessoas, ou sem teto no Plus."],
            ].map(([title, body]) => (
              <article key={title} className="card p-5">
                <h3 className="font-semibold">{title}</h3>
                <p className="text-sm text-muted mt-2">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="planos" className="bg-bg text-ink py-20 px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-semibold">Planos</h2>
          <p className="text-muted mt-2 max-w-2xl">
            Pessoa mais em conta. Empresa mais completa — e mais cara. Pagamento só no PIX {PIX_PLAN_KEY}.
          </p>
          <div className="mt-10">
            <PlansGrid mode="public" />
          </div>
        </div>
      </section>

      <footer className="px-8 py-8 text-sm text-[#9aabba] flex justify-between border-t border-[#2c4458] bg-panel">
        <span>Finanças CodeCraft · CodeCraft Solutions</span>
        <span>PIX {PIX_PLAN_KEY}</span>
      </footer>
    </div>
  );
}
