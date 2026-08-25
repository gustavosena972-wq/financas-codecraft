# CodeCraft Gestão

SaaS B2B da **CodeCraft Solutions** para empresas (CNPJ): Financeiro, RH (ponto/folha) e assinatura mensal.

Stack: Next.js (static export → GitHub Pages) + Supabase (Auth, Postgres, RLS). **Sem IA no painel do cliente.**

Live: https://gustavosena972-wq.github.io/financas-codecraft/

## Subir o banco

1. Crie um projeto Supabase **só deste app** (não use o do site).
2. SQL Editor → cole e rode `supabase/schema.sql` (já inclui billing RPC, membros, folha e centros).
3. Auth → URL Configuration:
   - Site URL: `https://gustavosena972-wq.github.io/financas-codecraft/`
   - Redirect: `…/redefinir-senha/` e a URL base do app
4. (Opcional) Auth → Providers → Email → Confirm email off, ou rode o trigger já no schema.
5. Copie URL + anon key → `.env.local` a partir de `.env.example`

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`. Fluxo: cadastro → ligar CNPJ → assinar plano → módulos.

## Publicar no GitHub Pages

```bash
# Windows PowerShell
$env:GITHUB_PAGES="true"
npm run build
Remove-Item -Recurse -Force docs\* -ErrorAction SilentlyContinue
Copy-Item -Recurse -Force out\* docs\
```

Commit + push em `main` (Pages aponta para `/docs`).

## Cobrança (Asaas opcional)

Sem gateway, a assinatura usa RPC `cc_subscribe` (honor + cartão só last4).

Para cobrar de verdade:

1. Crie conta [Asaas](https://www.asaas.com/) e pegue a API key.
2. Deploy das Edge Functions em `supabase/functions/` (`billing-subscribe`, `billing-webhook`, `send-invite`).
3. Secrets: `ASAAS_API_KEY`, `ASAAS_WEBHOOK_TOKEN`, `SUPABASE_SERVICE_ROLE_KEY`.
4. Defina `NEXT_PUBLIC_BILLING_PROVIDER=asaas` no build.

Enquanto Asaas não estiver ligado, o app continua no fluxo local seguro (RPC + trigger).

## Módulos

| Área | O que tem |
|------|-----------|
| Empresa | CNPJ + dados cadastrais |
| Financeiro | Caixa, títulos, centros de custo, DRE, export CSV |
| Pessoas | Colaboradores, ponto, espelho, folha, export |
| Assinatura | Planos R$ 280–500, PIX/cartão, cancelamento |
| Ajustes | Senha, convites de equipe |

## Arquivos úteis

- `supabase/schema.sql` — schema completo
- `supabase/upgrade-product.sql` — upgrade isolado (já espelhado no schema)
- `supabase/functions/` — Asaas + e-mail de convite
