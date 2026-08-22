import Link from "next/link";
import { PlansGrid } from "@/components/plans-grid";
import { ProductGrid } from "@/components/product-grid";
import { PIX_PLAN_KEY } from "@/lib/plans";
import { HeroPreview } from "@/components/hero-preview";

export default function HomePage() {
  return (
    <div className="land min-h-screen text-[#e8edf2]">
      <header className="flex items-center justify-between px-8 py-5 border-b border-[#2c4458] sticky top-0 z-20 bg-panel/90 backdrop-blur">
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

      <section className="hero-stage px-8 py-24 max-w-6xl mx-auto grid lg:grid-cols-[1.1fr_.9fr] gap-14 items-center">
        <div className="rise">
          <p className="text-gold text-xs tracking-[0.2em] uppercase mb-4">Pessoa e empresa. Um login. Dois espaços.</p>
          <h1 className="text-4xl lg:text-5xl font-semibold tracking-tight leading-[1.12] text-white max-w-3xl hero-title">
            Não é outro app de gasto.
            <br />
            É PF e PJ com o mesmo padrão.
          </h1>
          <p className="mt-5 text-[#b7c4cf] text-lg max-w-2xl">
            Chat, planilha e tesouraria no mesmo produto. A IA sugere. Você confirma. Sem misturar o bolso da casa com o CNPJ.
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

      <section id="pessoa" className="bg-bg/80 backdrop-blur-[2px] text-ink py-20 px-8">
        <div className="max-w-6xl mx-auto">
          <p className="page-kicker">Produto pessoa</p>
          <h2 className="text-3xl font-semibold mt-2">O que cada ferramenta faz na vida pessoal</h2>
          <p className="text-muted mt-3 max-w-2xl">
            Autônomo, família ou quem ganha salário. Grátis para entrar. Pro (R$ 27,90) libera os dois perfis, exportar e as contas 50-30-20.
          </p>
          <div className="mt-10">
            <ProductGrid audience="person" />
          </div>
        </div>
      </section>

      <section id="empresa" className="bg-bg-2/80 backdrop-blur-[2px] text-ink py-20 px-8">
        <div className="max-w-6xl mx-auto">
          <p className="page-kicker">Produto empresa</p>
          <h2 className="text-3xl font-semibold mt-2">O que cada ferramenta faz no CNPJ</h2>
          <p className="text-muted mt-3 max-w-2xl">
            MEI, prestador e empresa pequena. Análise do porte no grátis. Business (R$ 69,90) entra tesouraria, DRE e equipe. Contador é white-label.
          </p>
          <div className="mt-10">
            <ProductGrid audience="company" />
          </div>
        </div>
      </section>

      <section id="planos" className="bg-bg/80 backdrop-blur-[2px] text-ink py-20 px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-semibold">Planos</h2>
          <p className="text-muted mt-2 max-w-2xl">
            Grátis, Pro R$ 27,90, Business R$ 69,90 e Contador a combinar. PIX {PIX_PLAN_KEY}. A IA não move dinheiro.
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
