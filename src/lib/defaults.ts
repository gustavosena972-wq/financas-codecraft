export type AccountType = "CHECKING" | "SAVINGS" | "WALLET" | "CASH" | "CREDIT";
export type WorkspaceType = "PERSONAL" | "BUSINESS";

export const PERSONAL_CATEGORIES = [
  { name: "Receita", kind: "INCOME", color: "#2A9D6E" },
  { name: "Salário", kind: "INCOME", color: "#2A9D6E" },
  { name: "Freelance", kind: "INCOME", color: "#3D8B7A" },
  { name: "Rendimentos", kind: "INCOME", color: "#4C7A6A" },
  { name: "Outras receitas", kind: "INCOME", color: "#6B8F71" },
  { name: "Cartões de crédito", kind: "EXPENSE", color: "#ED7D31" },
  { name: "Fixas / financiamentos", kind: "EXPENSE", color: "#5B9BD5" },
  { name: "Outras / variáveis", kind: "EXPENSE", color: "#70AD47" },
  { name: "Moradia", kind: "EXPENSE", color: "#8A6B4A" },
  { name: "Alimentação", kind: "EXPENSE", color: "#C45C4A" },
  { name: "Transporte", kind: "EXPENSE", color: "#3D6B8A" },
  { name: "Saúde", kind: "EXPENSE", color: "#6A4C8A" },
  { name: "Educação", kind: "EXPENSE", color: "#4A6B8A" },
  { name: "Lazer", kind: "EXPENSE", color: "#C4A35A" },
  { name: "Assinaturas", kind: "EXPENSE", color: "#7A6B5C" },
  { name: "Compras", kind: "EXPENSE", color: "#A35A6B" },
  { name: "Contas", kind: "EXPENSE", color: "#5C6B75" },
  { name: "Outras despesas", kind: "EXPENSE", color: "#8C97A3" },
] as const;

export const BUSINESS_CATEGORIES = [
  { name: "Serviços", kind: "INCOME", color: "#2A9D6E" },
  { name: "Vendas", kind: "INCOME", color: "#3D8B7A" },
  { name: "Outras receitas", kind: "INCOME", color: "#6B8F71" },
  { name: "Fornecedores", kind: "EXPENSE", color: "#C45C4A" },
  { name: "Pró-labore", kind: "EXPENSE", color: "#8A6B4A" },
  { name: "Folha", kind: "EXPENSE", color: "#7A5A3A" },
  { name: "DAS / Impostos", kind: "EXPENSE", color: "#6A4C8A" },
  { name: "Ferramentas", kind: "EXPENSE", color: "#3D6B8A" },
  { name: "Marketing", kind: "EXPENSE", color: "#C4A35A" },
  { name: "Aluguel", kind: "EXPENSE", color: "#5C6B75" },
  { name: "Operacional", kind: "EXPENSE", color: "#4A6B8A" },
  { name: "Outras despesas", kind: "EXPENSE", color: "#8C97A3" },
] as const;

export const PERSONAL_ACCOUNTS: { name: string; type: AccountType }[] = [
  { name: "Carteira", type: "WALLET" },
  { name: "Conta corrente", type: "CHECKING" },
  { name: "Cartão de crédito", type: "CREDIT" },
];

export const BUSINESS_ACCOUNTS: { name: string; type: AccountType }[] = [
  { name: "Conta PJ", type: "CHECKING" },
  { name: "Caixa", type: "CASH" },
];

export function defaultsFor(type: WorkspaceType) {
  if (type === "BUSINESS") {
    return { categories: BUSINESS_CATEGORIES, accounts: BUSINESS_ACCOUNTS };
  }
  return { categories: PERSONAL_CATEGORIES, accounts: PERSONAL_ACCOUNTS };
}

export const ACCOUNT_LABEL: Record<AccountType, string> = {
  CHECKING: "Conta corrente",
  SAVINGS: "Poupança",
  WALLET: "Carteira",
  CASH: "Caixa",
  CREDIT: "Cartão",
};
