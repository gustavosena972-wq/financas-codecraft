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

Para cobrar de verdade (assinatura mensal PIX ou cartão):

1. Crie conta [Asaas](https://www.asaas.com/) e pegue a API key de **produção**.
2. Secrets no Supabase (Edge Functions → Secrets): `ASAAS_API_KEY`, `ASAAS_WEBHOOK_TOKEN`.
3. Rode `supabase/upgrade-asaas-recurring.sql` no SQL Editor.
4. Deploy: `billing-subscribe`, `billing-cancel` (JWT on) e `billing-webhook` (JWT **off**).
5. No Asaas → Integrações → Webhook:
   - URL: `https://eqaoanbanhryhbldlbhc.supabase.co/functions/v1/billing-webhook?apikey=ANON_KEY`
   - Header `asaas-access-token` = valor de `ASAAS_WEBHOOK_TOKEN`
   - Eventos: `PAYMENT_CONFIRMED`, `PAYMENT_RECEIVED`
6. Defina `NEXT_PUBLIC_BILLING_PROVIDER=asaas` no `.env.local` e no build Pages.

Com Asaas, o app cria **subscription MONTHLY**:
- **PIX (sem cartão):** todo mês o Asaas gera um novo PIX; ao pagar, o webhook renova o plano.
- **Cartão:** o Asaas debita sozinho todo mês e o webhook confirma a renovação.

**Sem dinheiro / testes:** use `NEXT_PUBLIC_BILLING_PROVIDER=local` (ativa plano sem cobrança)
ou Asaas **sandbox** (chave `$aact_hmlg_…` + secret `ASAAS_ENV=sandbox`). A function escolhe
`sandbox.asaas.com` automaticamente com chave de homologação.

Enquanto o provider for `local`, o app usa RPC honor (`cc_subscribe`).

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
