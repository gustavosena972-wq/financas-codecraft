export type GuideAudience = "all" | "personal" | "company";

export type GuideItem = {
  href: string;
  title: string;
  does: string;
  tip: string;
  audience?: GuideAudience;
};

export const START_STEPS = [
  {
    n: "1",
    title: "Manda a planilha da casa",
    body: "Uma aba por mês: cartão, contas fixas e o que varia. O app lê sozinho.",
    href: "/app/importar",
  },
  {
    n: "2",
    title: "Olha se o mês fecha",
    body: "Receita, fixas, cartão e o saldo. O trabalho é ir baixando a fatura.",
    href: "/app",
  },
  {
    n: "3",
    title: "Confere os cartões",
    body: "Cada cartão, mês a mês. Sem parcela nova enquanto as atuais não acabam.",
    href: "/app/dividas",
  },
];

export const GUIDE: GuideItem[] = [
  { href: "/app", title: "Resumo da casa", does: "Receita, contas fixas, cartões e o saldo do mês. Igual à aba Resumo da planilha.", tip: "Pessoa e Empresa no topo. Os números não se misturam." },
  { href: "/app/chat", title: "IA", does: "Pergunta quanto saiu no cartão. A IA mostra a linha. Não é a tela principal.", tip: "Grátis: 8 perguntas/dia. Pro 40, Business 80. Sem senha. Sem PIX." },
  { href: "/app/lancamentos", title: "Lançar na mão", does: "Uma linha por movimento: salário, aluguel, mercado.", tip: "Descreva simples: “Aluguel”, “iFood”." },
  { href: "/app/contas", title: "Contas", does: "Onde o dinheiro mora: banco, carteira, cartão.", tip: "Uma conta por lugar real." },
  { href: "/app/agenda", title: "Contas do mês", does: "O que se repete, tipo aluguel ou internet.", tip: "No mês, lance o recorrente. Não sai sozinho do banco." },
  { href: "/app/orcamento", title: "Este mês", does: "Três grupos: cartão, contas da casa e o que varia. Como a aba do mês na planilha.", tip: "Parcela e status vêm do Excel. Confira o saldo no fim." },
  { href: "/app/investimentos", title: "Investimentos", does: "Saldo da carteira, se você tiver. Não é o centro do produto da casa.", tip: "Lance o saldo de hoje. Open Finance vem depois, por agregador." },
  { href: "/app/dividas", title: "Cartões", does: "Cada cartão mês a mês. A meta é reduzir a fatura, sem parcela nova.", tip: "Quite o rotativo primeiro.", audience: "personal" },
  { href: "/app/ferramentas", title: "Ferramentas", does: "Pessoa: reserva, 50-30-20, corte, dívida, moradia. Empresa: giro e preço. Cada uma tem uma linha dizendo o que faz.", tip: "No grátis o chat lê a planilha. Pro R$ 27,90 e Business R$ 69,90 liberam o resto." },
  { href: "/app/educacao", title: "Educação", does: "Banco de reserva, cartão, DRE, MEI e o que o chat também usa.", tip: "Aperte Perguntar no chat para cruzar com os seus números." },
  { href: "/app/importar", title: "Mandar planilha", does: "Manda o Excel da casa: uma aba por mês. O app lê cartão, fixas e o resto.", tip: "Depois abra o Resumo e veja se o mês fecha." },
  { href: "/app/titulos", title: "Títulos", does: "O que a empresa ainda vai pagar ou receber.", tip: "Quando pagar, use Baixar. O caixa atualiza.", audience: "company" },
  { href: "/app/dre", title: "DRE", does: "Resultado da empresa: sobrou ou faltou, e por quê.", tip: "Use no fim do mês. Dá para imprimir.", audience: "company" },
  { href: "/app/fluxo", title: "Fluxo de caixa", does: "Saldo de agora e o que ainda entra ou sai.", tip: "Olhe antes de um pagamento grande.", audience: "company" },
  { href: "/app/conciliacao", title: "Conciliação", does: "Bate o app com o extrato do banco.", tip: "Marque o que já conferiu.", audience: "company" },
  { href: "/app/centros", title: "Centros e parceiros", does: "Cliente, fornecedor e onde o gasto pesa.", tip: "Cadastre o nome. O título fica claro.", audience: "company" },
  { href: "/app/auditoria", title: "Auditoria", does: "Quem fez o quê neste espaço da empresa.", tip: "Business para cima.", audience: "company" },
  { href: "/app/equipe", title: "Equipe", does: "Quem pode ver ou lançar na empresa.", tip: "No começo, só você já resolve.", audience: "company" },
  { href: "/app/planos", title: "Planos", does: "Grátis, Pro R$ 27,90, Business R$ 69,90 e Contador a combinar.", tip: "Pague só no PIX 31999758385. A IA não move dinheiro." },
  { href: "/app/configuracoes", title: "Configurações", does: "Seu login e os espaços Pessoal e Empresa.", tip: "Troque no topo. Os lançamentos não se misturam." },
  { href: "/app/ajuda", title: "Ajuda", does: "Chat para dúvida simples. Dinheiro e senha vão para uma pessoa.", tip: "Ninguém da CodeCraft pede senha." },
  { href: "/app/comecar", title: "Como usar", does: "Guia curto e um vídeo de um minuto.", tip: "Aperte play. A voz explica os três passos." },
];

export function guideForMode(type: "PERSONAL" | "BUSINESS") {
  return GUIDE.filter((item) => {
    const who = item.audience ?? "all";
    if (who === "all") return true;
    return type === "BUSINESS" ? who === "company" : who === "personal";
  });
}

export const VIDEO_SCENES = [
  {
    image: "/guide/scene-1.png",
    title: "O app inteiro",
    voice: "Finanças CodeCraft. Pessoa de um lado, empresa do outro. Autônomo, MEI, pequena ou grande. Vamos testar o projeto e os planos.",
  },
  {
    image: "/guide/scene-2.png",
    title: "Pessoa",
    voice: "No espaço pessoa você manda a planilha da casa. Cartão, contas fixas e o saldo do mês. O trabalho é ir baixando a fatura.",
  },
  {
    image: "/guide/scene-3.png",
    title: "Empresa",
    voice: "No espaço empresa escolhe o porte: autônomo, MEI, pequena ou grande. A aba Análise mostra receita, DAS, folha, giro e o dinheiro livre do mês que vem.",
  },
  {
    image: "/guide/scene-4.png",
    title: "Planos",
    voice: "Quatro planos. Grátis, Pro 27 reais e 90, Business 69 reais e 90, Contador a combinar. Você assina, abre o QR, paga no PIX da CodeCraft. O chat não pede senha.",
  },
];

export function guideAsset(path: string) {
  const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
  return `${base}${path}`;
}

export function guideForPath(pathname: string) {
  const clean = pathname.replace(/\/$/, "") || "/app";
  return (
    GUIDE.find((item) => item.href !== "/app" && clean.startsWith(item.href)) ??
    GUIDE.find((item) => item.href === "/app") ??
    null
  );
}
