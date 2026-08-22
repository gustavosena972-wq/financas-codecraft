import Link from "next/link";
import { PlansGrid } from "@/components/plans-grid";
import { PIX_PLAN_KEY } from "@/lib/plans";
import { HeroPreview } from "@/components/hero-preview";
import { BrandLogo } from "@/components/brand-logo";

export default function HomePage() {
  return (
    <div className="land min-h-screen text-[#e8edf2]">
      <header className="flex items-center justify-between px-8 py-5 border-b border-[#2c4458] sticky top-0 z-20 bg-panel/90 backdrop-blur">
        <BrandLogo tone="light" />
        <nav className="flex items-center gap-6 text-sm text-[#b7c4cf]">
          <a href="#produto">Pessoa e empresa</a>
          <a href="#planos">Planos</a>
          <Link href="/login">Entrar</Link>
          <a href="#planos" className="btn btn-ghost" style={{ color: "#fff", borderColor: "#2c4458" }}>
            Ver planos
          </a>
          <Link href="/cadastro" className="btn btn-primary">Começar</Link>
        </nav>
      </header>

      <section className="hero-stage px-8 py-24 max-w-6xl mx-auto grid lg:grid-cols-[1.1fr_.9fr] gap-14 items-center">
        <div className="rise">
          <p className="text-gold text-xs tracking-[0.2em] uppercase mb-4">Finanças CodeCraft · o orçamento da casa</p>
          <h1 className="text-4xl lg:text-5xl font-semibold tracking-tight leading-[1.12] text-white max-w-3xl hero-title">
            Receita, contas fixas e cartão.
            <br />
            O mês fecha ou não.
          </h1>
          <p className="mt-5 text-[#b7c4cf] text-lg max-w-2xl">
            É a planilha da família no app: um mês por aba, cartão separado das contas da casa, e o saldo no fim. O trabalho é ir baixando a fatura sem furar a prestação.
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

      <section id="produto" className="bg-bg/80 backdrop-blur-[2px] text-ink py-20 px-8">
        <div className="max-w-6xl mx-auto">
          <p className="page-kicker">O que o app faz</p>
          <h2 className="text-3xl font-semibold mt-2">O controle financeiro da casa, mês a mês.</h2>
          <p className="text-muted mt-3 max-w-2xl">
            Não é um painel genérico. É receita prevista, contas que quase não mudam, fatura de cada cartão e o que sobrou. Empresa fica em outro espaço, se você tiver.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-10">
            {[
              ["Resumo anual", "Jan a dez numa tabela: receita, fixas, cartões, outras, saldo e quanto o cartão come do mês."],
              ["Este mês", "Três caixas, como na planilha: cartão (laranja), contas da casa (fixas) e o que aparece uma vez."],
              ["Cartões", "Nubank, Inter, loja — mês a mês. A meta é reduzir. Sem parcela nova enquanto as atuais não acabam."],
              ["Contas fixas", "Prestação da casa, luz, água, internet, IPTU. Você confere o valor. Não mistura com fatura."],
              ["Manda o Excel", "Uma aba por mês. O app lê sozinho. Não precisa lançar linha por linha."],
              ["IA da casa", "Pergunta quanto saiu no cartão. Ela mostra a linha. Não pede senha e não move PIX."],
            ].map(([title, body]) => (
              <article key={title} className="card p-5">
                <h3 className="font-semibold">{title}</h3>
                <p className="text-sm text-muted mt-2">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-bg-2/80 backdrop-blur-[2px] text-ink py-20 px-8">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-10">
          <div>
            <p className="page-kicker">Pessoa</p>
            <h2 className="text-2xl font-semibold mt-2">A planilha da família.</h2>
            <p className="text-muted mt-3">Receita, prestação, luz e cartão. Pessoa e empresa não se misturam.</p>
          </div>
          <div>
            <p className="page-kicker">Empresa</p>
            <h2 className="text-2xl font-semibold mt-2">MEI, prestador, caixa.</h2>
            <p className="text-muted mt-3">Títulos, DRE, giro e centros. O Plus dos apps de fora chegou tarde. Aqui PF e PJ já são o produto.</p>
          </div>
        </div>
      </section>

      <section id="planos" className="bg-bg/80 backdrop-blur-[2px] text-ink py-20 px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-semibold">Planos</h2>
          <p className="text-muted mt-2 max-w-2xl">
            Grátis para entrar. Pro e Business para o pacote cheio. PIX {PIX_PLAN_KEY}. A IA não move dinheiro.
          </p>
          <div className="mt-10">
            <PlansGrid mode="public" />
          </div>
        </div>
      </section>

      <footer className="px-8 py-8 text-sm text-[#9aabba] flex justify-between border-t border-[#2c4458] bg-panel/80 backdrop-blur">
        <span>Finanças CodeCraft · CodeCraft Solutions</span>
        <span>PIX {PIX_PLAN_KEY}</span>
      </footer>
    </div>
  );
}
