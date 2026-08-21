export function helpReply(message: string) {
  const text = message
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (/(senha|codigo do banco|token|cvv|cartao)/.test(text)) {
    return {
      auto: true,
      human: false,
      body: "Por segurança eu não peço senha, código do banco nem dado de cartão. A CodeCraft também não pede isso no chat.",
    };
  }
  if (/(transfer|pix para mim|me manda|chave de outro)/.test(text)) {
    return {
      auto: true,
      human: true,
      body: "Eu não faço transferência. O único PIX da compra é a chave 31999758385, da CodeCraft. Se alguém mandar outra chave, não pague.",
    };
  }
  if (/(paguei|comprovante|caiu|liberar plano)/.test(text)) {
    return {
      auto: true,
      human: true,
      body: "Se você já pagou, envie o comprovante no WhatsApp 31 99975-8385. O plano não libera sozinho pelo chat — isso é de propósito, para o dinheiro e a conta ficarem seguros.",
    };
  }
  if (/(plano|preco|pro|business|assinat)/.test(text)) {
    return {
      auto: true,
      human: false,
      body: "Pessoal R$ 19, Empresa R$ 49, Completo R$ 59. Completo junta os dois e ainda sai mais barato. Só no PIX 31999758385. Em Planos você gera o QR.",
    };
  }
  if (/(planilha|excel|import|orcamento)/.test(text)) {
    return {
      auto: true,
      human: false,
      body: "Três jeitos no chat: clipe para mandar a planilha, Colocar na mão se ainda não tem arquivo, ou fala o gasto. Sem baixar modelo.",
    };
  }
  if (/(ferramenta|simul|educacao|educação|50.30.20|reserva)/.test(text)) {
    return {
      auto: true,
      human: false,
      body: "Ferramentas testa o número (reserva, corte, dívida). Educação explica. O chat junta os dois com o seu mês. No grátis a reserva e o alerta já abrem; o resto entra no Pessoal (R$ 19).",
    };
  }
  if (/(agenda|recorrente|aluguel)/.test(text)) {
    return {
      auto: true,
      human: false,
      body: "Na Agenda você cadastra o que se repete, tipo aluguel. O Free cabe 3. Depois é só lançar o mês.",
    };
  }
  if (/(como usar|comecar|tutorial|o que faz|funcoes|ensina|guia|video)/.test(text)) {
    return {
      auto: true,
      human: false,
      body: "No chat o contador analisa o mês, os meses passados e o próximo trimestre. Manda a planilha no clipe ou lança na mão se ainda não tem nada salvo.",
    };
  }
  if (/(cortar|previsao|futuro|o que vou gastar|baixar conta)/.test(text)) {
    return {
      auto: true,
      human: false,
      body: "Pergunta no chat: o que cortar, como foram os meses, planeja o próximo trimestre, como está minha situação.",
    };
  }
  if (/(claro|escuro|tema|dark|light)/.test(text)) {
    return {
      auto: true,
      human: false,
      body: "No topo tem o botão Claro/Escuro. Ele guarda a escolha neste computador.",
    };
  }
  if (/(dre|titulo|pagar|receber|concili)/.test(text)) {
    return {
      auto: true,
      human: false,
      body: "DRE, títulos e conciliação são da empresa, no plano Empresa (R$ 49) ou Completo (R$ 59). No pessoal isso nem aparece no menu.",
    };
  }
  if (/(ia|inteligencia)/.test(text)) {
    return {
      auto: true,
      human: false,
      body: "No chat o contador lê os seus números, aponta o que cortar e lança o que você falar. Não mexe no dinheiro sozinho.",
    };
  }

  return {
    auto: true,
    human: true,
    body: "Essa parte eu não fecho sozinho. Fale com a CodeCraft no WhatsApp 31 99975-8385 que uma pessoa responde.",
  };
}
