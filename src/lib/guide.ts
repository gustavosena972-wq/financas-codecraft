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
    title: "Coloca os gastos",
    body: "Importe o extrato, lance na mão ou fale no assistente.",
    href: "/app/lancamentos",
  },
  {
    n: "2",
    title: "Olha o patrimônio",
    body: "A tela de entrada é o que você tem menos o que deve.",
    href: "/app",
  },
  {
    n: "3",
    title: "Põe teto e pergunta",
    body: "Orçamento avisa se passou. O assistente mostra o lançamento.",
    href: "/app/chat",
  },
];

export const GUIDE: GuideItem[] = [
  { href: "/app", title: "Patrimônio", does: "Tela central: o que você tem menos o que deve. Gráfico, orçamento e lançamentos.", tip: "Pessoa e Empresa no topo. Os números não se misturam." },
  { href: "/app/chat", title: "IA", does: "Pergunta em português. A IA mostra o lançamento real por trás do número.", tip: "Ex.: quanto gastei com iFood. Sem senha. Sem PIX." },
  { href: "/app/lancamentos", title: "Lançar na mão", does: "Uma linha por movimento: salário, aluguel, mercado.", tip: "Descreva simples: “Aluguel”, “iFood”." },
  { href: "/app/contas", title: "Contas", does: "Onde o dinheiro mora: banco, carteira, cartão.", tip: "Uma conta por lugar real." },
  { href: "/app/agenda", title: "Contas do mês", does: "O que se repete, tipo aluguel ou internet.", tip: "No mês, lance o recorrente. Não sai sozinho do banco." },
  { href: "/app/orcamento", title: "Teto do mês", does: "Você diz o limite. O app mostra se passou.", tip: "Ponha valor só no que importa." },
  { href: "/app/investimentos", title: "Investimentos", does: "O valor da carteira entra no patrimônio líquido. Sem conexão de corretora ainda.", tip: "Lance o saldo de hoje. Open Finance vem depois, por agregador." },
  { href: "/app/dividas", title: "Dívidas", does: "Cartão no passivo e simulador de quitação com parcela e juro.", tip: "Quite o rotativo primeiro.", audience: "personal" },
  { href: "/app/ferramentas", title: "Ferramentas", does: "Pessoa: reserva, 50-30-20, corte, dívida, moradia. Empresa: giro e preço. Cada uma tem uma linha dizendo o que faz.", tip: "No grátis o chat lê a planilha. Pro R$ 27,90 e Business R$ 69,90 liberam o resto." },
  { href: "/app/educacao", title: "Educação", does: "Banco de reserva, cartão, DRE, MEI e o que o chat também usa.", tip: "Aperte Perguntar no chat para cruzar com os seus números." },
  { href: "/app/importar", title: "Mandar planilha", does: "Manda o Excel que você já tem. O app lê e joga nos gastos.", tip: "Depois volte ao chat." },
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
    voice: "No espaço pessoa você manda a planilha, preenche o orçamento mês a mês ou lança na mão. O chat analisa e só muda se você gostar.",
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
