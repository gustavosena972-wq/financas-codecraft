# Finanças CodeCraft

Produto de gestão financeira da CodeCraft Solutions, para pessoas e empresas. Repositório separado do site da empresa.

## Fase 1 (MVP)

- Cadastro, login e modos pessoal / empresarial
- Contas, receitas, despesas e transferências
- Dashboard, orçamento mensal e fluxo de caixa básico
- Importação Excel/CSV com validação e duplicatas
- Exportação para Excel

## Como rodar

```bash
npm install
npx prisma db push
npm run dev
```

Abra `http://localhost:3000`. Há uma **conta demonstração** na tela de login.

Copie `.env.example` para `.env` se o arquivo local não existir.
