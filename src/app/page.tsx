import Link from "next/link";
import { PlansGrid } from "@/components/plans-grid";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-panel text-[#e8edf2]">
      <header className="flex items-center justify-between px-8 py-5 border-b border-[#2c4458]">
        <div className="flex items-center gap-2">
          <span className="mark">FC</span>
          <span className="font-semibold tracking-tight">Finanças CodeCraft</span>
        </div>
        <nav className="flex items-center gap-6 text-sm text-[#b7c4cf]">
          <a href="#produto">Produto</a>
          <a href="#planos">Planos</a>
          <Link href="/login">Entrar</Link>
          <Link href="/cadastro" className="btn btn-primary">Começar</Link>
        </nav>
      </header>

      <section className="px-8 py-24 max-w-6xl mx-auto grid lg:grid-cols-[1.15fr_.85fr] gap-14 items-center">
        <div>
          <p className="text-gold text-xs tracking-[0.2em] uppercase mb-4">ERP financeiro</p>
          <h1 className="text-4xl lg:text-5xl font-semibold tracking-tight leading-[1.12] text-white">
            Caixa, DRE e títulos
            <br />
            no mesmo lugar.
          </h1>
          <p className="mt-5 text-[#b7c4cf] text-lg max-w-xl">
            Ferramenta de operação, não de recorte. Lançamento, pagar e receber, conciliação e fechamento —
            do MEI à empresa que já tem tesouraria.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/cadastro" className="btn btn-primary">Criar conta</Link>
            <Link href="/login" className="btn btn-ghost" style={{ color: "#fff", borderColor: "#2c4458" }}>
              Já tenho conta
            </Link>
          </div>
        </div>
        <div className="rounded-xl border border-[#2c4458] bg-panel-2 p-6 text-sm space-y-4">
          <div className="text-[#9aabba] text-[11px] uppercase tracking-[0.16em]">Painel executivo</div>
          <div className="grid grid-cols-2 gap-3">
            {[
              ["Saldo consolidado", "R$ 482.190"],
              ["A pagar (aberto)", "R$ 91.400"],
              ["A receber", "R$ 126.800"],
              ["Resultado do mês", "+ R$ 38.210"],
            ].map(([k, v]) => (
              <div key={k} className="rounded-lg bg-panel p-4">
                <div className="text-[11px] text-[#9aabba]">{k}</div>
                <div className="text-lg mt-1 text-white">{v}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="produto" className="bg-bg text-ink py-20 px-8">
        <div className="max-w-6xl mx-auto">
          <p className="page-kicker">Módulos</p>
          <h2 className="text-3xl font-semibold max-w-xl mt-2">O que uma operação grande realmente usa.</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-10">
            {[
              ["Lançamentos", "Receita, despesa e transferência com busca, mês e categoria."],
              ["Títulos", "Contas a pagar e a receber. Baixa vira lançamento no caixa."],
              ["DRE", "Receitas, despesas, resultado e margem do período. Dá para imprimir."],
              ["Conciliação", "Livro contra extrato. Marca o que já conferiu."],
              ["Centros de custo", "Onde o gasto pesa. Cliente e fornecedor no cadastro."],
              ["Fechamento", "No Enterprise o mês trava. Ninguém lança em competência fechada."],
            ].map(([title, body]) => (
              <article key={title} className="card p-5">
                <h3 className="font-semibold">{title}</h3>
                <p className="text-sm text-muted mt-2">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="planos" className="bg-bg-2 text-ink py-20 px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-semibold">Planos</h2>
          <p className="text-muted mt-2 max-w-2xl">
            Preço de ferramenta de empresa. Free organiza o básico. Pro já é tesouraria. Enterprise fecha competência.
          </p>
          <div className="mt-10">
            <PlansGrid mode="public" />
          </div>
        </div>
      </section>

      <footer className="px-8 py-8 text-sm text-[#9aabba] flex justify-between border-t border-[#2c4458] bg-panel">
        <span>Finanças CodeCraft · CodeCraft Solutions</span>
        <span>PIX 31999758385</span>
      </footer>
    </div>
  );
}
