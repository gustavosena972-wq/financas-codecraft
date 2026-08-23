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
    title: "Manda a planilha uma vez",
    body: "É o ponto de partida. O app não serve para repetir a tabela.",
    href: "/app/importar",
  },
  {
    n: "2",
    title: "Olha o que vai sobrar",
    body: "Este mês e o ano: quanto ainda sai, quanto sobra. A IA avalia isso todo dia.",
    href: "/app",
  },
  {
    n: "3",
    title: "Baixa o cartão",
    body: "A dica do dia diz onde cortar. Sem parcela nova. A sobra amortiza a maior fatura.",
    href: "/app/dividas",
  },
];

export const GUIDE: GuideItem[] = [
  { href: "/app", title: "O que sobra", does: "Este mês e o ano: o que vai gastar, o que vai sobrar. A IA avalia todo dia e diz o que fazer.", tip: "A planilha entra uma vez. A tela não copia a tabela." },
  { href: "/app/chat", title: "IA", does: "Pergunta o que vai sobrar até dezembro. Ela lê o ano da casa e dá a dica do dia.", tip: "Experimentar: 8/dia. Casa 40. Casa Plus 80. Empresa 120. Completo sem teto. Sem senha. Sem PIX." },
  { href: "/app/lancamentos", title: "Anotar", does: "Se faltou na planilha, anota aqui: o que foi e quanto.", tip: "Um de cada vez. Saiu ou entrou." },
  { href: "/app/contas", title: "Onde está", does: "Banco, dinheiro na mão e cartão. O número é quanto tem agora.", tip: "Um lugar de cada vez." },
  { href: "/app/agenda", title: "Contas do mês", does: "O que se repete, tipo aluguel ou internet.", tip: "No mês, lance o recorrente. Não sai sozinho do banco." },
  { href: "/app/orcamento", title: "Este mês", does: "Primeiro o resumo: vai gastar e vai sobrar. Embaixo, cartão, contas da casa e o resto, um grupo de cada vez.", tip: "Não é a planilha copiada. É o que ainda sai neste mês." },
  { href: "/app/investimentos", title: "Investimentos", does: "Saldo da carteira, se você tiver. Não é o centro do produto da casa.", tip: "Lance o saldo de hoje. Open Finance vem depois, por agregador." },
  { href: "/app/dividas", title: "Cartões", does: "Cada cartão mês a mês. A meta é reduzir a fatura, sem parcela nova.", tip: "Quite o rotativo primeiro.", audience: "personal" },
  { href: "/app/ferramentas", title: "Ferramentas", does: "Extras: dívida, reserva, giro. Não é o centro do app. A casa é sobra + cartão. A empresa é títulos + DRE.", tip: "Casa Plus R$ 200 e Empresa R$ 305 liberam os simuladores." },
  { href: "/app/educacao", title: "Educação", does: "Banco de reserva, cartão, DRE, MEI e o que o chat também usa.", tip: "Aperte Perguntar no chat para cruzar com os seus números." },
  { href: "/app/importar", title: "Mandar planilha", does: "Manda o Excel da casa. Quando o ano acabar, apaga a antiga: o app zera na hora. Depois entra a planilha nova.", tip: "Apagar primeiro. Mandar depois." },
  { href: "/app/titulos", title: "Títulos", does: "O que a empresa ainda vai pagar ou receber.", tip: "Quando pagar, use Baixar. O caixa atualiza.", audience: "company" },
  { href: "/app/dre", title: "DRE", does: "Resultado da empresa: sobrou ou faltou, e por quê.", tip: "Use no fim do mês. Dá para imprimir.", audience: "company" },
  { href: "/app/fluxo", title: "Fluxo de caixa", does: "Saldo de agora e o que ainda entra ou sai.", tip: "Olhe antes de um pagamento grande.", audience: "company" },
  { href: "/app/conciliacao", title: "Conciliação", does: "Bate o app com o extrato do banco.", tip: "Marque o que já conferiu.", audience: "company" },
  { href: "/app/centros", title: "Centros e parceiros", does: "Cliente, fornecedor e onde o gasto pesa.", tip: "Cadastre o nome. O título fica claro.", audience: "company" },
  { href: "/app/auditoria", title: "Auditoria", does: "Quem fez o quê neste espaço da empresa.", tip: "Plano Completo (R$ 400).", audience: "company" },
  { href: "/app/equipe", title: "Equipe", does: "Quem pode ver ou lançar na empresa.", tip: "No começo, só você já resolve.", audience: "company" },
  { href: "/app/planos", title: "Planos", does: "Experimentar, Casa R$ 107, Casa Plus R$ 200, Empresa R$ 305, Completo R$ 400. Renova sozinho todo mês.", tip: "Cartão de crédito ou PIX 31999758385. A IA não move dinheiro." },
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
    voice: "Cinco planos. Experimentar de graça. Casa 107, Casa Plus 200, Empresa 305, Completo 400. Renova sozinho todo mês no cartão ou no PIX da CodeCraft. O chat não pede senha.",
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
