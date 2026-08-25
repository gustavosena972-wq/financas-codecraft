// Supabase Edge Function: cria cobrança Asaas e ativa plano via service role.
// Secrets: ASAAS_API_KEY, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PRICES: Record<string, number> = { START: 280, BUSINESS: 390, CORP: 500 };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const asaasKey = Deno.env.get("ASAAS_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || Deno.env.get("NEXT_PUBLIC_SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!asaasKey || !supabaseUrl || !serviceKey) {
      return json({ error: "Asaas/Supabase secrets não configurados." }, 503);
    }

    const auth = req.headers.get("Authorization") || "";
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") || serviceKey, {
      global: { headers: { Authorization: auth } },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) return json({ error: "Não autenticado" }, 401);

    const body = await req.json();
    const plan = String(body.plan || "");
    const method = String(body.method || "pix");
    const price = PRICES[plan];
    if (!price) return json({ error: "Plano inválido" }, 400);

    const email = userData.user.email || "";
    const cpf = String(body.card?.cpf || "").replace(/\D/g, "");
    const holder = String(body.card?.holder || userData.user.user_metadata?.name || "Cliente");

    const customerRes = await fetch("https://api.asaas.com/v3/customers", {
      method: "POST",
      headers: { access_token: asaasKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        name: holder,
        email,
        cpfCnpj: cpf || undefined,
      }),
    });
    const customer = await customerRes.json();
    if (!customerRes.ok) return json({ error: customer.errors?.[0]?.description || "Falha ao criar cliente Asaas" }, 400);

    const paymentBody: Record<string, unknown> = {
      customer: customer.id,
      billingType: method === "pix" ? "PIX" : "CREDIT_CARD",
      value: price,
      dueDate: new Date().toISOString().slice(0, 10),
      description: `CodeCraft Gestão · ${plan}`,
      externalReference: `${userData.user.id}:${plan}`,
    };
    if (method === "card" && body.card?.number) {
      const [mm, yy] = String(body.card.exp || "").split("/");
      paymentBody.creditCard = {
        holderName: holder,
        number: String(body.card.number).replace(/\D/g, ""),
        expiryMonth: mm,
        expiryYear: yy?.length === 2 ? `20${yy}` : yy,
        ccv: String(body.card.cvv || ""),
      };
      paymentBody.creditCardHolderInfo = {
        name: holder,
        email,
        cpfCnpj: cpf,
        postalCode: "30130100",
        addressNumber: "0",
        phone: "31999999999",
      };
    }

    const payRes = await fetch("https://api.asaas.com/v3/payments", {
      method: "POST",
      headers: { access_token: asaasKey, "Content-Type": "application/json" },
      body: JSON.stringify(paymentBody),
    });
    const payment = await payRes.json();
    if (!payRes.ok) return json({ error: payment.errors?.[0]?.description || "Falha na cobrança Asaas" }, 400);

    const admin = createClient(supabaseUrl, serviceKey);
    // libera billing só se cartão confirmado ou PIX criado (webhook confirma pago)
    if (method === "card" && (payment.status === "CONFIRMED" || payment.status === "RECEIVED")) {
      await activate(admin, userData.user.id, plan, method, body.card);
    } else {
      await admin.from("cc_profiles").update({
        card_last4: String(body.card?.number || "").replace(/\D/g, "").slice(-4),
        card_holder: holder,
        card_cpf: cpf,
        card_exp: String(body.card?.exp || ""),
        billing_method: method,
      }).eq("id", userData.user.id);
    }

    return json({
      ok: true,
      paymentId: payment.id,
      status: payment.status,
      invoiceUrl: payment.invoiceUrl || null,
      pixQrCode: payment.pixQrCodeId || null,
    });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Erro Asaas" }, 500);
  }
});

async function activate(
  admin: ReturnType<typeof createClient>,
  userId: string,
  plan: string,
  method: string,
  card: { number?: string; holder?: string; exp?: string; cpf?: string; brand?: string },
) {
  const last4 = String(card?.number || "").replace(/\D/g, "").slice(-4);
  const next = new Date();
  next.setMonth(next.getMonth() + 1);
  await admin.rpc("cc_subscribe", {
    p_plan: plan,
    p_method: method,
    p_card_last4: last4,
    p_card_brand: card?.brand || "",
    p_card_exp: card?.exp || "",
    p_card_holder: card?.holder || "",
    p_card_cpf: card?.cpf || "",
  }).then(async (r) => {
    if (r.error) {
      // service role bypass: update direto + set_config não disponível; use SQL
      await admin.from("cc_profiles").update({
        plan,
        billing_status: "active",
        billing_method: method,
        card_last4: last4,
        card_holder: card?.holder || "",
        card_exp: card?.exp || "",
        card_cpf: card?.cpf || "",
        billed_at: new Date().toISOString(),
        next_charge_at: next.toISOString(),
      }).eq("id", userId);
    }
  });
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
