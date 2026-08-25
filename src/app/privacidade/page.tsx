export default function PrivacidadePage() {
  return (
    <main className="min-h-screen p-6 sm:p-10 max-w-3xl mx-auto space-y-4">
      <p className="kicker">Legal</p>
      <h1 className="title">Privacidade</h1>
      <p className="text-sm text-muted">CodeCraft Gestão · tratamento de dados da conta e da empresa.</p>
      <div className="card p-6 space-y-3 text-sm leading-relaxed">
        <p>
          Tratamos dados cadastrais (nome, e-mail), dados da empresa (CNPJ, razão social, endereço) e dados operacionais
          que você inserir (lançamentos, colaboradores, ponto), para prestar o serviço.
        </p>
        <p>
          Autenticação e banco ficam no Supabase do projeto deste produto, com isolamento por empresa (RLS). Não vendemos
          dados a terceiros. Não há IA no painel do cliente processando seus dados.
        </p>
        <p>
          Cartão: guardamos apenas metadados necessários à renovação (últimos 4 dígitos, bandeira, validade, titular e
          CPF informado). Não armazenamos o número completo nem o CVV.
        </p>
        <p>
          Você pode solicitar exclusão da conta pelos canais da CodeCraft Solutions. Logs técnicos podem ser retidos pelo
          tempo necessário à segurança e à operação.
        </p>
      </div>
    </main>
  );
}
