import type { PlanId } from "./plans";

export type ProductAudience = "person" | "company";

export type Product = {
  id: string;
  name: string;
  does: string;
  audience: ProductAudience;
  plan: PlanId;
  href?: string;
};

export const PRODUCTS: Product[] = [
  {
    id: "chat-pessoa",
    name: "Chat da pessoa",
    does: "Você manda a planilha ou pergunta. Ele lê o mês, sugere corte e só muda se você gostar.",
    audience: "person",
    plan: "FREE",
    href: "/app",
  },
  {
    id: "contas",
    name: "Contas",
    does: "Onde o dinheiro mora: banco, carteira, poupança e cartão. Cada lugar real vira uma conta.",
    audience: "person",
    plan: "FREE",
    href: "/app/contas",
  },
  {
    id: "lancar",
    name: "Lançar na mão",
    does: "Uma linha por movimento: salário, aluguel, mercado. Sem limite de lançamento no grátis.",
    audience: "person",
    plan: "FREE",
    href: "/app/lancamentos",
  },
  {
    id: "saldo-inicial",
    name: "Saldo inicial",
    does: "Você diz quanto já tem na conta. O gráfico e a reserva partem desse número, não de zero.",
    audience: "person",
    plan: "FREE",
    href: "/app/contas",
  },
  {
    id: "graficos",
    name: "Gráficos entra e sai",
    does: "Barras do que entrou e do que saiu. Mostra se o mês está no azul ou no vermelho.",
    audience: "person",
    plan: "FREE",
    href: "/app",
  },
  {
    id: "cartao",
    name: "Cartão e parcelas",
    does: "Acompanha fatura e compra parcelada para o rotativo não virar surpresa no mês que vem.",
    audience: "person",
    plan: "PRO",
    href: "/app/contas",
  },
  {
    id: "agenda",
    name: "Contas do mês",
    does: "Aluguel, internet, DAS. Você cadastra uma vez. No mês, lança — o banco não sai sozinho.",
    audience: "person",
    plan: "PRO",
    href: "/app/agenda",
  },
  {
    id: "orcamento",
    name: "Teto do mês (envelope)",
    does: "Você põe um limite por categoria. O app avisa se passou. Serve para desapertar o mês.",
    audience: "person",
    plan: "PRO",
    href: "/app/orcamento",
  },
  {
    id: "metas",
    name: "Metas",
    does: "Um alvo de caixa, tipo reserva até dezembro. O progresso usa o saldo de agora.",
    audience: "person",
    plan: "PRO",
    href: "/app/metas",
  },
  {
    id: "importar",
    name: "Importar extrato",
    does: "Manda OFX, CSV ou Excel. O app lê, sugere categoria e só lança se você aceitar.",
    audience: "person",
    plan: "PRO",
    href: "/app/importar",
  },
  {
    id: "ocr",
    name: "Foto do comprovante",
    does: "Tira foto da nota. O Pro lê valor e data para você conferir antes de lançar.",
    audience: "person",
    plan: "PRO",
    href: "/app/lancamentos",
  },
  {
    id: "exportar",
    name: "Exportar",
    does: "Baixa a planilha do seu espaço para o contador ou para o Excel de casa.",
    audience: "person",
    plan: "PRO",
    href: "/app/exportar",
  },
  {
    id: "503020",
    name: "50-30-20",
    does: "Divide o que entra: 50% essencial, 30% escolha, 20% reserva. Compara com o que você realmente gastou.",
    audience: "person",
    plan: "PRO",
    href: "/app/ferramentas",
  },
  {
    id: "corte",
    name: "Corte",
    does: "Mostra o que mais pesa no mês e quanto sobra se baixar 20% disso. Não corta sozinho.",
    audience: "person",
    plan: "PRO",
    href: "/app/ferramentas",
  },
  {
    id: "moradia",
    name: "Teto de moradia",
    does: "Aluguel + casa deve caber em 30% do que entra. Se passou, avisa — não cancela a casa.",
    audience: "person",
    plan: "PRO",
    href: "/app/ferramentas",
  },
  {
    id: "reserva",
    name: "Reserva e alerta",
    does: "Quantos meses o saldo cobre o essencial. Crítica, média ou boa. É o pulso do caixa.",
    audience: "person",
    plan: "PRO",
    href: "/app/ferramentas",
  },
  {
    id: "divida",
    name: "Simulador de dívida",
    does: "Você diz saldo, parcela e juro. Ele conta em quantos meses acaba e quanto de juro vai embora.",
    audience: "person",
    plan: "PRO",
    href: "/app/ferramentas",
  },
  {
    id: "chat-ia",
    name: "Chat com IA",
    does: "Pergunta em português: quanto saiu em transporte, o que cortar, como está o mês. Sem mexer em PIX.",
    audience: "person",
    plan: "PRO",
    href: "/app",
  },
  {
    id: "analise",
    name: "Análise do porte",
    does: "Autônomo, MEI, pequena ou grande. Lê receita, DAS, folha e o dinheiro livre do mês que vem.",
    audience: "company",
    plan: "FREE",
    href: "/app",
  },
  {
    id: "fluxo",
    name: "Fluxo de caixa",
    does: "Saldo de agora e o que ainda entra ou sai. Olhe antes de um pagamento grande.",
    audience: "company",
    plan: "BUSINESS",
    href: "/app/fluxo",
  },
  {
    id: "titulos",
    name: "Contas a pagar e receber",
    does: "Título do cliente e do fornecedor. Quando pagar, use Baixar. Título a receber não é caixa até cair.",
    audience: "company",
    plan: "BUSINESS",
    href: "/app/titulos",
  },
  {
    id: "centros",
    name: "Centros de custo",
    does: "Cliente, projeto ou área. Mostra onde o gasto pesa para você não misturar tudo no mesmo bolo.",
    audience: "company",
    plan: "BUSINESS",
    href: "/app/centros",
  },
  {
    id: "dre",
    name: "DRE",
    does: "Receita menos despesa do período. Diz se sobrou ou faltou, e a margem. Use no fechamento do mês.",
    audience: "company",
    plan: "BUSINESS",
    href: "/app/dre",
  },
  {
    id: "giro",
    name: "Giro da tesouraria",
    does: "A pagar versus a receber. Se o cliente demora e o fornecedor cobra já, o caixa sangra.",
    audience: "company",
    plan: "BUSINESS",
    href: "/app/ferramentas",
  },
  {
    id: "preco",
    name: "Precificar serviço",
    does: "Custo + imposto + margem = o que cobrar. À vista no PIX fecha melhor quando o juro está alto.",
    audience: "company",
    plan: "BUSINESS",
    href: "/app/ferramentas",
  },
  {
    id: "equipe",
    name: "Equipe (vários usuários)",
    does: "Dono, financeiro, contador ou quem só lança. Cada um vê o que a função deixa.",
    audience: "company",
    plan: "BUSINESS",
    href: "/app/equipe",
  },
  {
    id: "relatorio",
    name: "Relatório do contador",
    does: "Excel e CSV no padrão de quem fecha o mês. O contador recebe o arquivo, não um print.",
    audience: "company",
    plan: "BUSINESS",
    href: "/app/relatorio",
  },
  {
    id: "conciliacao",
    name: "Conciliação",
    does: "Bate o livro do app com o extrato do banco. Marque o que já conferiu.",
    audience: "company",
    plan: "ENTERPRISE",
    href: "/app/conciliacao",
  },
  {
    id: "auditoria",
    name: "Auditoria",
    does: "Quem lançou, quem baixou, quem mudou. Trilha para o dono e para o contador.",
    audience: "company",
    plan: "ENTERPRISE",
    href: "/app/auditoria",
  },
  {
    id: "fechar",
    name: "Fechar mês",
    does: "Trava lançamento do período quando o banco bater com o livro. Reabre só se precisar corrigir.",
    audience: "company",
    plan: "ENTERPRISE",
    href: "/app/dre",
  },
];

export function productsFor(audience: ProductAudience) {
  return PRODUCTS.filter((item) => item.audience === audience);
}

export function productByHref(href: string) {
  const clean = href.replace(/\/$/, "") || "/app";
  return PRODUCTS.find((item) => item.href === clean) ?? null;
}

export function planLabel(plan: PlanId) {
  if (plan === "FREE") return "Grátis";
  if (plan === "PRO" || plan === "PLUS") return "Pro";
  if (plan === "BUSINESS") return "Business";
  return "Contador";
}
