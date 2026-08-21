export type GuideItem = {
  href: string;
  title: string;
  does: string;
  tip: string;
};

export const START_STEPS = [
  {
    n: "1",
    title: "Cadastre suas contas",
    body: "Banco, caixa, cartão. Sem isso o saldo não tem de onde sair.",
    href: "/app/contas",
  },
  {
    n: "2",
    title: "Lance o que moveu",
    body: "O que entrou é receita. O que saiu é despesa. Uma linha por fato.",
    href: "/app/lancamentos",
  },
  {
    n: "3",
    title: "Olhe a visão geral",
    body: "Se o número fizer sentido, você já está usando o app do jeito certo.",
    href: "/app",
  },
];

export const GUIDE: GuideItem[] = [
  { href: "/app", title: "Visão geral", does: "Mostra o mês inteiro: saldo, o que entrou e o que saiu.", tip: "Comece sempre daqui." },
  { href: "/app/lancamentos", title: "Lançamentos", does: "É o caderno do dia. Cada movimento vira uma linha.", tip: "Descreva simples: “Aluguel”, “Cliente João”." },
  { href: "/app/titulos", title: "Títulos", does: "O que ainda vai pagar ou receber, com a data.", tip: "Quando pagar, use Baixar. O caixa atualiza sozinho." },
  { href: "/app/contas", title: "Contas", does: "Onde o dinheiro mora: banco, caixa, cartão.", tip: "Uma conta por lugar real. Não misture." },
  { href: "/app/agenda", title: "Agenda", does: "O que se repete todo mês, tipo aluguel.", tip: "No mês, lance o recorrente. Não fica automático no banco." },
  { href: "/app/dre", title: "DRE", does: "Conta o resultado: sobrou ou faltou, e por quê.", tip: "Use no fim do mês. Dá para imprimir." },
  { href: "/app/orcamento", title: "Orçamento", does: "Você diz o teto. O app mostra se passou.", tip: "Ponha um valor só nas categorias que importam." },
  { href: "/app/fluxo", title: "Fluxo de caixa", does: "O saldo de agora e o que ainda deve entrar ou sair.", tip: "Olhe antes de um pagamento grande." },
  { href: "/app/conciliacao", title: "Conciliação", does: "Bate o app com o extrato do banco.", tip: "Marque o que já conferiu. Se não bater, tem linha faltando." },
  { href: "/app/centros", title: "Centros e parceiros", does: "Quem é cliente ou fornecedor, e onde o gasto pesa.", tip: "Cadastre o nome. Depois o título fica claro." },
  { href: "/app/metas", title: "Metas", does: "Um alvo de caixa. O progresso usa o saldo de agora.", tip: "Uma meta boa já basta no começo." },
  { href: "/app/importar", title: "Planilha", does: "Pega o Excel do computador, organiza e manda para o app.", tip: "Olhe o resumo antes de enviar." },
  { href: "/app/exportar", title: "Exportar", does: "Tira o mês em Excel, para o contador ou para você.", tip: "Escolha o mês e baixe." },
  { href: "/app/auditoria", title: "Auditoria", does: "Quem fez o quê. Serve para não perder o rastro.", tip: "Business para cima." },
  { href: "/app/equipe", title: "Equipe", does: "Quem pode ver ou lançar neste espaço.", tip: "No começo, só você já resolve." },
  { href: "/app/planos", title: "Planos", does: "Free, Pro R$ 99, Business R$ 150, Enterprise R$ 300.", tip: "Pague no PIX 31999758385." },
  { href: "/app/configuracoes", title: "Configurações", does: "Seu login e os espaços pessoal / empresa.", tip: "Empresa e pessoal não misturam lançamento." },
  { href: "/app/ajuda", title: "Ajuda", does: "Chat para dúvida simples. Dinheiro e senha vão para uma pessoa.", tip: "Ninguém da CodeCraft pede senha." },
  { href: "/app/comecar", title: "Como usar", does: "Guia curto e um vídeo de um minuto, se não quiser ler.", tip: "Aperte play. A voz explica os três passos." },
];

export const VIDEO_SCENES = [
  {
    image: "/guide/scene-1.png",
    title: "O app em um minuto",
    voice: "Finanças CodeCraft. Três passos. Sem pressa.",
  },
  {
    image: "/guide/scene-2.png",
    title: "1. Contas",
    voice: "Primeiro, cadastre suas contas. Banco, caixa ou cartão. É de onde o saldo sai.",
  },
  {
    image: "/guide/scene-3.png",
    title: "2. Lançamentos",
    voice: "Depois, lance o que moveu. O que entrou é receita. O que saiu é despesa.",
  },
  {
    image: "/guide/scene-4.png",
    title: "3. Visão geral",
    voice: "Por fim, olhe a visão geral. Se o número fizer sentido, você já está no caminho. Títulos e DRE ficam para quando precisar.",
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
