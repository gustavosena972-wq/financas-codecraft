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
      body: "Free é grátis. Pro R$ 29,90 e Business R$ 79,90, no PIX 31999758385. Em Planos você gera o QR. Enterprise combinamos no WhatsApp.",
    };
  }
  if (/(planilha|excel|import|orcamento)/.test(text)) {
    return {
      auto: true,
      human: false,
      body: "Em Planilha você escolhe o arquivo do computador. O app organiza, mostra o resumo, deixa baixar claro e mandar para o app.",
    };
  }
  if (/(agenda|recorrente|aluguel)/.test(text)) {
    return {
      auto: true,
      human: false,
      body: "Na Agenda você cadastra o que se repete, tipo aluguel. O Free cabe 3. Depois é só lançar o mês.",
    };
  }
  if (/(ia|inteligencia)/.test(text)) {
    return {
      auto: true,
      human: false,
      body: "A IA do Pro explica o mês e sugere categoria. Ela não é um chat livre e não mexe sozinha no seu dinheiro.",
    };
  }

  return {
    auto: true,
    human: true,
    body: "Essa parte eu não fecho sozinho. Fale com a CodeCraft no WhatsApp 31 99975-8385 que uma pessoa responde.",
  };
}
