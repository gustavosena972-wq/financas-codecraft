# Finanças CodeCraft

Sistema da empresa da CodeCraft Solutions: pessoas, vendas, projetos, caixa, estoque e IA autônoma (95%).

Banco **próprio** no Supabase, separado do site.

## Subir o banco (projeto deste app)

1. Abra [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. **New project** → nome `financas-codecraft`
3. **Não** escolha o projeto do site
4. SQL Editor → cole `supabase/schema.sql` → Run (pode rodar de novo; ele só adiciona o que falta)
5. Authentication → Providers → Email → desligue **Confirm email**
6. Project Settings → API → copie URL e anon key
7. Crie `.env.local` a partir de `.env.example`

Depois do login, a plataforma pede o **CNPJ** e os dados da empresa. Sem isso os setores não abrem.

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`.
