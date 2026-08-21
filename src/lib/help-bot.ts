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
      body: "Pessoa: Grátis ou Pessoal R$ 29. Empresa: R$ 199 ou Empresa Plus R$ 399. Só no PIX 31999758385. Em Planos você gera o QR.",
    };
  }
  if (/(planilha|excel|import|orcamento)/.test(text)) {
    return {
      auto: true,
      human: false,
      body: "Em Planilha você manda o Excel. O app organiza, joga no caixa e na visão geral aparece a previsão do mês e o que dá para cortar.",
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
      body: "São três passos: coloca os gastos, olha a planilha na visão geral, segue o que a IA apontou para cortar. Em Como usar tem um vídeo de um minuto.",
    };
  }
  if (/(cortar|previsao|futuro|o que vou gastar|baixar conta)/.test(text)) {
    return {
      auto: true,
      human: false,
      body: "Isso fica na visão geral, na planilha de cima. Tem o que sai em cada mês e dicas para baixar conta. Primeiro manda os gastos em Planilha.",
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
      body: "DRE, títulos e conciliação são da empresa, no plano Empresa (R$ 199). No pessoal isso nem aparece no menu. PIX 31999758385.",
    };
  }
  if (/(ia|inteligencia)/.test(text)) {
    return {
      auto: true,
      human: false,
      body: "Na visão geral a IA monta a planilha e aponta o que cortar. No plano Pessoal (R$ 29) ela também explica desvio do teto. Não mexe no dinheiro. PIX 31999758385.",
    };
  }

  return {
    auto: true,
    human: true,
    body: "Essa parte eu não fecho sozinho. Fale com a CodeCraft no WhatsApp 31 99975-8385 que uma pessoa responde.",
  };
}
