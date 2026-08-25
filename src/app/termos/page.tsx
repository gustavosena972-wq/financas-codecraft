export default function TermosPage() {
  return (
    <main className="min-h-screen p-6 sm:p-10 max-w-3xl mx-auto space-y-4">
      <p className="kicker">Legal</p>
      <h1 className="title">Termos de uso</h1>
      <p className="text-sm text-muted">CodeCraft Gestão · CodeCraft Solutions · vigente em 2026.</p>
      <div className="card p-6 space-y-3 text-sm leading-relaxed">
        <p>
          O CodeCraft Gestão é um software B2B para empresas brasileiras (CNPJ). Ao criar conta, você declara ser
          responsável legal ou autorizado a representar a empresa cadastrada.
        </p>
        <p>
          A assinatura mensal libera os módulos Financeiro e Pessoas conforme o plano escolhido. O cancelamento pode
          ser feito no painel a qualquer momento; o acesso permanece até o fim do ciclo já pago.
        </p>
        <p>
          Você é responsável pelos dados lançados (caixa, títulos, colaboradores e ponto). A CodeCraft Solutions não
          presta contabilidade nem substitui obrigações fiscais/trabalhistas.
        </p>
        <p>
          É proibido uso abusivo, engenharia reversa indevida ou tentativa de burlar cobrança e limites do plano. Podemos
          suspender contas que violem estes termos ou a legislação.
        </p>
        <p>
          Contato: site da CodeCraft Solutions. Estes termos podem ser atualizados; o uso contínuo após publicação
          implica ciência.
        </p>
      </div>
    </main>
  );
}
