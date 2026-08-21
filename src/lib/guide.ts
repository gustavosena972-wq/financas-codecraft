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
    body: "Manda o Excel ou lança na mão. Conta, aluguel, mercado, tudo.",
    href: "/app/importar",
  },
  {
    n: "2",
    title: "A planilha monta o caixa",
    body: "Saldo, o que sai em cada mês e a previsão dos próximos três.",
    href: "/app",
  },
  {
    n: "3",
    title: "A IA diz o que cortar",
    body: "Onde o dinheiro pesa e quanto você baixa se negociar a conta.",
    href: "/app",
  },
];

export const GUIDE: GuideItem[] = [
  { href: "/app", title: "Visão geral", does: "É a planilha: caixa, previsão dos próximos meses e o que cortar.", tip: "Manda os gastos e volta aqui." },
  { href: "/app/lancamentos", title: "Lançar na mão", does: "Uma linha por movimento: salário, aluguel, mercado.", tip: "Descreva simples: “Aluguel”, “iFood”." },
  { href: "/app/contas", title: "Contas", does: "Onde o dinheiro mora: banco, carteira, cartão.", tip: "Uma conta por lugar real." },
  { href: "/app/agenda", title: "Contas do mês", does: "O que se repete, tipo aluguel ou internet.", tip: "No mês, lance o recorrente. Não sai sozinho do banco." },
  { href: "/app/orcamento", title: "Teto do mês", does: "Você diz o limite. O app mostra se passou.", tip: "Ponha valor só no que importa." },
  { href: "/app/metas", title: "Metas", does: "Um alvo de caixa. O progresso usa o saldo de agora.", tip: "Uma meta já basta no começo.", audience: "personal" },
  { href: "/app/importar", title: "Colocar gastos", does: "Manda o Excel. O app organiza e joga no caixa.", tip: "Depois abra a visão geral." },
  { href: "/app/exportar", title: "Baixar Excel", does: "Tira o mês em planilha, para você ou o contador.", tip: "Escolha o mês e baixe." },
  { href: "/app/titulos", title: "Títulos", does: "O que a empresa ainda vai pagar ou receber.", tip: "Quando pagar, use Baixar. O caixa atualiza.", audience: "company" },
  { href: "/app/dre", title: "DRE", does: "Resultado da empresa: sobrou ou faltou, e por quê.", tip: "Use no fim do mês. Dá para imprimir.", audience: "company" },
  { href: "/app/fluxo", title: "Fluxo de caixa", does: "Saldo de agora e o que ainda entra ou sai.", tip: "Olhe antes de um pagamento grande.", audience: "company" },
  { href: "/app/conciliacao", title: "Conciliação", does: "Bate o app com o extrato do banco.", tip: "Marque o que já conferiu.", audience: "company" },
  { href: "/app/centros", title: "Centros e parceiros", does: "Cliente, fornecedor e onde o gasto pesa.", tip: "Cadastre o nome. O título fica claro.", audience: "company" },
  { href: "/app/auditoria", title: "Auditoria", does: "Quem fez o quê neste espaço da empresa.", tip: "Business para cima.", audience: "company" },
  { href: "/app/equipe", title: "Equipe", does: "Quem pode ver ou lançar na empresa.", tip: "No começo, só você já resolve.", audience: "company" },
  { href: "/app/planos", title: "Planos", does: "Pessoa: Grátis ou R$ 29. Empresa: R$ 199 ou R$ 399.", tip: "Pague só no PIX 31999758385." },
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
    title: "O app em um minuto",
    voice: "Finanças CodeCraft. Três passos. Sem pressa.",
  },
  {
    image: "/guide/scene-2.png",
    title: "1. Gastos",
    voice: "Primeiro, coloca seus gastos. Planilha do computador ou lançamento na mão.",
  },
  {
    image: "/guide/scene-3.png",
    title: "2. Gastos",
    voice: "O app organiza. Vira caixa, previsão do mês e o que dá para cortar.",
  },
  {
    image: "/guide/scene-4.png",
    title: "3. Planilha",
    voice: "Na visão geral está a planilha. Olhe o futuro e o que cortar. Títulos e DRE ficam para a empresa.",
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
