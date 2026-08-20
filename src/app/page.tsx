import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-panel text-[#e8edf2]">
      <header className="flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-2">
          <span className="mark">FC</span>
          <span className="font-semibold tracking-tight">Finanças CodeCraft</span>
        </div>
        <nav className="flex items-center gap-6 text-sm text-[#b7c4cf]">
          <a href="#produto">Produto</a>
          <a href="#planos">Planos</a>
          <Link href="/login">Entrar</Link>
          <Link href="/cadastro" className="btn btn-primary">
            Começar
          </Link>
        </nav>
      </header>

      <section className="px-8 py-20 max-w-6xl mx-auto grid lg:grid-cols-[1.1fr_.9fr] gap-12 items-center">
        <div>
          <p className="text-gold text-xs tracking-[0.18em] uppercase mb-4">
            Gestão financeira inteligente
          </p>
          <h1 className="text-4xl lg:text-5xl font-semibold tracking-tight leading-tight text-white">
            Entenda o presente.
            <br />
            Preveja o futuro.
          </h1>
          <p className="mt-5 text-[#b7c4cf] text-lg max-w-xl">
            Finanças CodeCraft não é só um extrato. É uma base confiável para pessoas e empresas
            organizarem o caixa, importarem planilhas e tomarem decisões com clareza.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/cadastro" className="btn btn-primary">
              Criar conta
            </Link>
            <Link href="/login" className="btn btn-ghost" style={{ color: "#fff", borderColor: "#2c4458" }}>
              Já tenho conta
            </Link>
          </div>
        </div>
        <div className="card bg-panel-2 border-[#2c4458] p-6 text-sm">
          <div className="text-[#9aabba] mb-4">Resumo do mês</div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-panel p-4">
              <div className="text-xs text-[#9aabba]">Saldo</div>
              <div className="text-xl mt-1 text-white">R$ 12.480</div>
            </div>
            <div className="rounded-xl bg-panel p-4">
              <div className="text-xs text-[#9aabba]">Projeção</div>
              <div className="text-xl mt-1 text-gold">R$ 14.210</div>
            </div>
            <div className="rounded-xl bg-panel p-4">
              <div className="text-xs text-[#9aabba]">Receitas</div>
              <div className="text-xl mt-1 text-positive">R$ 10.300</div>
            </div>
            <div className="rounded-xl bg-panel p-4">
              <div className="text-xs text-[#9aabba]">Despesas</div>
              <div className="text-xl mt-1 text-negative">R$ 8.270</div>
            </div>
          </div>
        </div>
      </section>

      <section id="produto" className="bg-bg text-ink py-20 px-8">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs tracking-[0.18em] uppercase text-muted mb-3">Como funciona</p>
          <h2 className="text-3xl font-semibold max-w-xl">Três camadas. Um produto estável primeiro.</h2>
          <div className="grid md:grid-cols-3 gap-5 mt-10">
            {[
              ["Base confiável", "Contas, categorias, receitas, despesas, orçamento e histórico — o chão firme do produto."],
              ["Camada inteligente", "Importação com validação, duplicatas, fluxo projetado e previsto × realizado."],
              ["Camada premium", "IA operacional depois: categorizar, alertar desvios e explicar os números. Sem chat no centro."],
            ].map(([title, body], i) => (
              <article key={title} className="card p-6">
                <div className="text-gold font-mono text-xs mb-3">0{i + 1}</div>
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
          <p className="text-muted mt-2">A versão gratuita precisa resolver o problema principal.</p>
          <div className="grid md:grid-cols-4 gap-4 mt-10">
            {[
              ["Free", "Contas, lançamentos, dashboard e exportação básica."],
              ["Pro", "Automação, previsões, alertas e relatórios mais completos."],
              ["Business", "Multiusuário, centros de custo e contas a pagar/receber."],
              ["Enterprise", "Governança, integrações e operação ampliada."],
            ].map(([title, body]) => (
              <article key={title} className="card p-5">
                <h3 className="font-semibold">{title}</h3>
                <p className="text-sm text-muted mt-2">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer className="px-8 py-8 text-sm text-[#9aabba] flex justify-between">
        <span>Finanças CodeCraft</span>
        <span>Fase 1 — MVP forte</span>
      </footer>
    </div>
  );
}
