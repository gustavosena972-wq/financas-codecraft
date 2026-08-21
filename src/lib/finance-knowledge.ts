export type KnowledgeItem = {
  id: string;
  title: string;
  tags: string[];
  body: string;
};

export const FINANCE_KNOWLEDGE: KnowledgeItem[] = [
  {
    id: "reserva",
    title: "Reserva de emergência",
    tags: ["reserva", "emergencia", "guardar", "poupanca", "colchao"],
    body: "Reserva de emergência é dinheiro parado para imprevisto: demissão, doença, conserto. Pessoa: 3 a 6 meses do gasto essencial. Empresa: 2 a 3 meses de custo fixo. Fica em conta fácil de sacar, não em ação. Monte antes de investir o resto.",
  },
  {
    id: "503020",
    title: "Regra 50-30-20",
    tags: ["50", "30", "20", "dividir", "salario", "organizar"],
    body: "Do que entra: cerca de 50% no essencial (moradia, luz, comida, transporte), 30% no que você escolhe (lazer, assinatura), 20% para reserva e dívida. Se o essencial passar de 50%, o corte começa em lazer e delivery, não em saúde.",
  },
  {
    id: "moradia",
    title: "Teto de moradia",
    tags: ["aluguel", "moradia", "financiamento", "imovel", "iptu", "condominio", "casa", "apartamento"],
    body: "Moradia saudável cabe em até 30% do que entra, somando aluguel ou parcela, condomínio, IPTU e conta da casa. Acima disso o mês aperta. Dá para negociar aluguel, amortizar financiamento com FGTS no principal, ou reduzir extra do condomínio. Não cancela moradia: baixa o preço.",
  },
  {
    id: "cartao",
    title: "Cartão e rotativo",
    tags: ["cartao", "rotativo", "fatura", "juros", "credito", "parcelar"],
    body: "Juro de cartão é dos mais altos do Brasil. Pague a fatura inteira. Se não der, negocie no banco um crédito mais barato e quite o rotativo. Parcelar compra cara no cartão esconde o custo. Use o cartão como prazo, não como empréstimo.",
  },
  {
    id: "divida",
    title: "Como sair da dívida",
    tags: ["divida", "endividado", "atraso", "negativado", "boleto", "cobranca"],
    body: "Lista tudo o que deve, do juro maior para o menor. Paga o mínimo do resto e ataca o mais caro primeiro (avalanche). Se a cabeça não aguenta, quite o menor para ganhar fôlego (bola de neve). Não faça dívida nova enquanto limpa. Combine desconto à vista no credor.",
  },
  {
    id: "selic",
    title: "Selic e o seu bolso",
    tags: ["selic", "juros", "banco central", "credito"],
    body: "Selic alta deixa empréstimo e financiamento mais caros e favorece quem aplica em Tesouro Selic. Selic em queda barateia crédito e pede cuidado com dívida longa tomada no juro alto. PIX à vista fecha mais quando o juro está pesado.",
  },
  {
    id: "inflacao",
    title: "Inflação",
    tags: ["inflacao", "ipca", "preco", "poder de compra"],
    body: "IPCA mede a inflação. Se o seu gasto sobe mais que o salário, você empobrece mesmo ganhando o mesmo. Reajuste teto todo ano. Prefira preço fechado e PIX. Empresa: reajuste contrato e não engole custo parado.",
  },
  {
    id: "fluxo",
    title: "Fluxo de caixa",
    tags: ["fluxo", "caixa", "saldo", "entrar", "sair"],
    body: "Fluxo de caixa é o filme do dinheiro: o que entra, o que sai e o que sobra em cada dia. Lucro no papel e caixa vazio é comum. Olhe o saldo projetado antes de um pagamento grande. Empresa: título a receber não é dinheiro até cair.",
  },
  {
    id: "dre",
    title: "DRE",
    tags: ["dre", "resultado", "lucro", "prejuizo", "margem"],
    body: "DRE mostra se o período deu lucro ou prejuízo: receita menos custo e despesa. Margem é quanto sobra de cada real que entra. Caixa e DRE andam juntos, mas não são a mesma coisa. Feche o mês, leia a DRE, aí corte ou invista.",
  },
  {
    id: "giro",
    title: "Capital de giro",
    tags: ["giro", "capital", "fornecedor", "receber"],
    body: "Capital de giro é o oxigênio da empresa: pagar fornecedor e folha antes do cliente pagar você. Se o prazo de receber é maior que o de pagar, o caixa sangra. Encurte recebimento, alongue pagamento com acordo, não com juro de cartão.",
  },
  {
    id: "prolabore",
    title: "Pró-labore e lucro",
    tags: ["prolabore", "pro labore", "socio", "retirada", "lucro"],
    body: "Pró-labore é o salário do sócio. Lucro é o que sobra depois. Misturar os dois esvazia a empresa. Defina um pró-labore e só retire lucro quando o caixa aguentar. Pessoa e empresa neste app ficam em espaços separados de propósito.",
  },
  {
    id: "juros-compostos",
    title: "Juros compostos",
    tags: ["juros compostos", "investir", "rendimento", "tempo"],
    body: "Juros compostos: o rendimento rende em cima do rendimento. A favor, no investimento. Contra, na dívida. Começar cedo pesa mais que acertar o produto perfeito. Primeiro quite juro alto, depois invista o que sobrar.",
  },
  {
    id: "tesouro",
    title: "Tesouro e poupança",
    tags: ["tesouro", "poupanca", "investir", "cdb", "renda fixa"],
    body: "Poupança rende pouco. Tesouro Selic é o caminho simples para reserva que precisa de liquidez. CDB de banco grande com liquidez diária também serve. Não ponha a reserva de emergência em ação ou fundo travado.",
  },
  {
    id: "ifood",
    title: "Gastos que somem",
    tags: ["ifood", "delivery", "assinatura", "netflix", "spotify", "lazer", "invisivel"],
    body: "Delivery, app e assinatura que você quase não usa somem no mês. Corte 20% disso sem mudar de vida. Revise fatura e cartão uma vez por mês. O que não dói cancelar, cancela.",
  },
  {
    id: "orcamento",
    title: "Orçamento que cola",
    tags: ["orcamento", "teto", "planejar", "limite", "categoria"],
    body: "Orçamento não é palpite: é teto por categoria, comparado com o que já saiu. Comece por moradia, alimentação e transporte. Se passar, o alerta vem no mês, não em dezembro. Ajuste o teto no mês seguinte, não finja que o estouro não existiu.",
  },
  {
    id: "passado",
    title: "Ler os meses passados",
    tags: ["passado", "historico", "meses", "tendencia", "comparar"],
    body: "Três meses já mostram o padrão: o que sempre sobe, o que é pico, o que é conta fixa. Se a despesa cresce e a receita não, o futuro aperta. Planeje o próximo trimestre com a média real, não com o mês bom.",
  },
  {
    id: "futuro",
    title: "Planejar o próximo trimestre",
    tags: ["futuro", "proximo", "trimestre", "previsao", "meta"],
    body: "Some o gasto médio dos últimos meses, tire 10% do que dá para cortar, e veja se a receita segura. Marque um alvo de sobra (10% do que entra). Empresa: reserve imposto e pró-labore no plano, senão o lucro some na guia.",
  },
  {
    id: "mei",
    title: "MEI e guia",
    tags: ["mei", "das", "simples", "imposto", "inss"],
    body: "MEI paga DAS todo mês. Atrasou, junta multa. Guarde o DAS no orçamento como conta fixa. Não misture o PIX da empresa com o da pessoa. Quando crescer, fale com contador sobre Simples — não decida só no feeling.",
  },
  {
    id: "irpf",
    title: "Imposto de renda",
    tags: ["ir", "irpf", "imposto de renda", "restituicao", "declaracao"],
    body: "Guarde comprovante de saúde, educação e dependente. Restituição não é 13º: é o que você adiantou. Empresa e pessoa têm regras diferentes. Este chat orienta organização; declaração formal é com contador e programa da Receita.",
  },
  {
    id: "fgts",
    title: "FGTS",
    tags: ["fgts", "amortizar", "casa", "demissao"],
    body: "FGTS pode amortizar financiamento da casa no principal — isso reduz juro, não só prazo, se a regra do contrato deixar. Em demissão, é colchão, não festa. Não conte FGTS como salário do mês.",
  },
  {
    id: "precificacao",
    title: "Precificar serviço",
    tags: ["preco", "precificar", "orcamento de servico", "hora", "proposta"],
    body: "Preço de serviço cobre custo, imposto, seu tempo e margem. Se o juro está alto, à vista com desconto pequeno fecha melhor que parcelar no cartão. Não copie o vizinho: some a sua conta real.",
  },
  {
    id: "conciliacao",
    title: "Conciliação",
    tags: ["conciliar", "extrato", "banco", "bater"],
    body: "Conciliação é bater o app com o extrato. Se não bate, o relatório mente. Marque o que já conferiu. Empresa faz isso toda semana; pessoa, no fechamento do cartão.",
  },
  {
    id: "receber",
    title: "Contas a receber",
    tags: ["receber", "cliente atrasado", "inadimplencia", "titulo"],
    body: "Conta a receber atrasada é empréstimo sem juro que você fez ao cliente. Cobre cedo, ofereça PIX à vista, pare de entregar se o atraso vira hábito. Não gaste o que ainda não caiu.",
  },
  {
    id: "educacao",
    title: "Educação financeira",
    tags: ["educacao", "aprender", "comecar", "principio"],
    body: "Educação financeira é hábito: anotar o que sai, separar pessoa e empresa, pagar a si mesmo (reserva) e não financiar consumo no juro do cartão. Ferramenta ajuda; a decisão é semanal, não uma vez por ano.",
  },
  {
    id: "alerta",
    title: "Quando a situação é crítica",
    tags: ["critica", "alerta", "vermelha", "sufoco", "apertada"],
    body: "Crítico: despesa maior que receita, saldo negativo, ou moradia acima de metade do que entra. Aí a ordem é: essencial, negociar dívida cara, cortar lazer e delivery, não investir, não parcelar. Médio: sobra pouco. Bom: sobra pelo menos 10% e as contas fixas cabem.",
  },
];

function norm(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function searchKnowledge(question: string, limit = 2): KnowledgeItem[] {
  const q = norm(question);
  if (q.length < 3) return [];
  const scored = FINANCE_KNOWLEDGE.map((item) => {
    let score = 0;
    if (q.includes(norm(item.title))) score += 8;
    for (const tag of item.tags) {
      if (q.includes(tag) || tag.split(" ").every((w) => q.includes(w))) score += 5;
    }
    for (const word of q.split(/\s+/).filter((w) => w.length > 3)) {
      if (norm(item.body).includes(word) || item.tags.some((t) => t.includes(word))) score += 1;
    }
    return { item, score };
  })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((row) => row.item);
}
