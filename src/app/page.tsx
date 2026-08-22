import Link from "next/link";
import { PlansGrid } from "@/components/plans-grid";
import { PIX_PLAN_KEY } from "@/lib/plans";
import { HeroPreview } from "@/components/hero-preview";
import { BrandLogo } from "@/components/brand-logo";

export default function HomePage() {
  return (
    <div className="land min-h-screen">
      <header className="ccs-top">
        <BrandLogo tone="dark" />
        <nav className="flex items-center gap-6 text-sm text-muted flex-wrap justify-end">
          <a href="#produto">Pessoa e empresa</a>
          <a href="#planos">Planos</a>
          <Link href="/login">Entrar</Link>
          <a href="#planos" className="btn btn-ghost">
            Ver planos
          </a>
          <Link href="/cadastro" className="btn btn-primary">
            Começar
          </Link>
        </nav>
      </header>

      <section className="ccs-hero">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-[1.1fr_.9fr] gap-14 items-center">
          <div className="rise">
            <p className="page-kicker">Finanças CodeCraft · o que vai sobrar</p>
            <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.12] text-white max-w-3xl hero-title mt-3">
              O que vai gastar.
              <br />
              <span className="text-gold">O que vai sobrar.</span> Todo dia.
            </h1>
            <p className="mt-5 text-[#B9BEDB] text-lg max-w-2xl">
              A planilha entra uma vez. O app não copia a tabela: conta o mês, o ano, e avalia sozinho o que cortar — principalmente o cartão.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/cadastro" className="btn btn-primary">
                Criar conta
              </Link>
              <Link href="/login" className="btn btn-ghost" style={{ color: "#fff", borderColor: "#2C3358" }}>
                Já tenho conta
              </Link>
            </div>
          </div>
          <HeroPreview />
        </div>
      </section>

      <section id="produto" className="bg-bg text-ink py-20 px-8">
        <div className="max-w-6xl mx-auto">
          <p className="page-kicker">O que o app faz</p>
          <h2 className="text-3xl font-extrabold mt-2">Não é para ver a mesma planilha.</h2>
          <p className="text-muted mt-3 max-w-2xl">
            Você manda o Excel da casa. O app diz o que ainda vai sair, o que sobra, e o que fazer hoje. Empresa fica em outro espaço.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-10">
            {[
              ["01", "Este mês", "Vai gastar X. Vai sobrar Y. Faltam N dias. Sem gasto novo no cartão, o número se segura."],
              ["02", "Mês a mês", "Janeiro a dezembro: o que já saiu, o que ainda vem, e o que sobra em cada um."],
              ["03", "No ano", "Quanto vai gastar no total e quanto sobra no fim. Se o cartão cair 10%, quanto a mais sobra."],
              ["04", "Avaliação todo dia", "A IA lê o ano da casa de novo cada dia. Dica concreta: amortizar, não abrir parcela."],
              ["05", "Cartões", "Qual fatura mais come. A meta é baixar. Sem parcela nova enquanto as atuais não acabam."],
              ["06", "Manda o Excel uma vez", "Ponto de partida, não a tela. Depois o app trabalha em cima dos números."],
            ].map(([num, title, body]) => (
              <article key={title} className="card p-6">
                <div className="page-kicker text-gold">{num}</div>
                <h3 className="font-bold mt-2">{title}</h3>
                <p className="text-sm text-muted mt-2">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-bg-2 text-ink py-20 px-8">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16">
          <div>
            <p className="page-kicker">Pessoa</p>
            <h2 className="text-2xl font-extrabold mt-2">O que vai sobrar na casa.</h2>
            <p className="text-muted mt-3">Mês, ano e dica do dia. Pessoa e empresa não se misturam.</p>
          </div>
          <div className="lg:border-l lg:border-line lg:pl-16">
            <p className="page-kicker">Empresa</p>
            <h2 className="text-2xl font-extrabold mt-2">MEI, prestador, caixa.</h2>
            <p className="text-muted mt-3">Títulos, DRE e fluxo. O mesmo login, outro espaço.</p>
          </div>
        </div>
      </section>

      <section id="planos" className="bg-bg text-ink py-20 px-8">
        <div className="max-w-6xl mx-auto">
          <p className="page-kicker">Assinatura</p>
          <h2 className="text-3xl font-extrabold mt-2">Planos</h2>
          <p className="text-muted mt-2 max-w-2xl">
            Experimentar grátis. Casa R$ 107, Casa Plus R$ 200, Empresa R$ 305, Completo R$ 400 — por mês.
            Renovação automática. PIX cai na conta da CodeCraft. Cartão pelo WhatsApp, como nos projetos da empresa.
          </p>
          <div className="mt-10">
            <PlansGrid mode="public" />
          </div>
        </div>
      </section>

      <footer className="px-10 py-8 text-sm text-muted flex justify-between border-t border-line bg-bg flex-wrap gap-3">
        <span>Finanças CodeCraft · CodeCraft Solutions</span>
        <span>PIX {PIX_PLAN_KEY}</span>
      </footer>
    </div>
  );
}
