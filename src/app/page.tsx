import Link from "next/link";
import { PlansGrid } from "@/components/plans-grid";
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
          <a href="#ferramentas">Ferramentas</a>
          <a href="#planos">Planos</a>
          <Link href="/login">Entrar</Link>
          <Link href="/cadastro" className="btn btn-primary">Começar</Link>
        </nav>
      </header>

      <section className="hero-stage px-8 py-24 max-w-6xl mx-auto grid lg:grid-cols-[1.1fr_.9fr] gap-14 items-center">
        <div className="rise">
          <p className="text-gold text-xs tracking-[0.2em] uppercase mb-4">Dois espaços. Um chat em cada.</p>
          <h1 className="text-4xl lg:text-5xl font-semibold tracking-tight leading-[1.12] text-white max-w-3xl hero-title">
            Pessoa de um lado.
            <br />
            Empresa do outro.
          </h1>
          <p className="mt-5 text-[#b7c4cf] text-lg max-w-2xl">
            Sem menu lateral. Você troca Pessoa e Empresa no topo. O chat abre a planilha, sugere, e só muda se você gostar.
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
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-10 items-start">
          <div>
            <p className="page-kicker">Para pessoa</p>
        <h2 className="text-3xl font-semibold mt-2">Um chat grande. Suas finanças no meio.</h2>
        <p className="text-muted mt-3">
          Manda a planilha, lança na mão ou pergunta. Ele olha o passado, planeja o próximo trimestre e avisa se está crítica, média ou boa.
        </p>
          </div>
          <div className="grid gap-4">
            {[
              ["1. Coloca os gastos", "Planilha no clipe, na mão ou falando no chat."],
              ["2. O contador analisa", "Meses passados, alerta e o que dá para cortar."],
              ["3. Planeja a frente", "Teto para baixar gasto e melhorar o mês que vem."],
            ].map(([title, body], i) => (
              <article key={title} className={`card p-5 rise rise-d${i + 1}`}>
                <h3 className="font-semibold">{title}</h3>
                <p className="text-sm text-muted mt-2">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="empresa" className="bg-bg-2/80 backdrop-blur-[2px] text-ink py-20 px-8">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-10 items-start">
          <div>
            <p className="page-kicker">Para empresa</p>
            <h2 className="text-3xl font-semibold mt-2">Tesouraria de verdade.</h2>
            <p className="text-muted mt-3">
              Títulos, DRE, giro e preço. Só no espaço Empresa. Pacotes Grátis, R$ 100 e R$ 200.
            </p>
          </div>
          <div className="grid gap-4">
            {[
              ["Chat e caixa", "Planilha, DRE, título e o próximo trimestre. Jarvis fica no site da CodeCraft."],
              ["Tesouraria", "Pagar, receber, conciliar com o banco."],
              ["Giro e preço", "Não gaste o que ainda não caiu. Precifique com imposto e margem."],
            ].map(([title, body]) => (
              <article key={title} className="card p-5">
                <h3 className="font-semibold">{title}</h3>
                <p className="text-sm text-muted mt-2">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="ferramentas" className="bg-bg/75 backdrop-blur-[2px] text-ink py-20 px-8">
        <div className="max-w-6xl mx-auto">
          <p className="page-kicker">Ferramentas</p>
          <h2 className="text-3xl font-semibold mt-2">Não é só conversa. É conta.</h2>
          <p className="text-muted mt-3 max-w-2xl">
            O chat pensa com você. As ferramentas testam o número: reserva, 50-30-20, corte, dívida, moradia, giro e preço de serviço.
          </p>
          <div className="grid md:grid-cols-3 gap-4 mt-10">
            {[
              ["Reserva e alerta", "Quantos meses o saldo cobre o essencial. Crítica, média ou boa."],
              ["Corte e teto", "E se baixar 20% do que mais pesa? 50-30-20 no mês real."],
              ["Dívida e preço", "Quando o cartão acaba. Empresa: o que cobrar com imposto e margem."],
            ].map(([title, body]) => (
              <article key={title} className="card p-5">
                <h3 className="font-semibold">{title}</h3>
                <p className="text-sm text-muted mt-2">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="planos" className="bg-bg/80 backdrop-blur-[2px] text-ink py-20 px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-semibold">Planos</h2>
          <p className="text-muted mt-2 max-w-2xl">
            Três pacotes para pessoa e três para empresa. Grátis, R$ 100 e R$ 200. O chat é o mesmo; o que muda são as ferramentas. PIX {PIX_PLAN_KEY}.
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
