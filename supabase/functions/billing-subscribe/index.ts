// Cobrança Asaas (produção). Secrets: ASAAS_API_KEY (+ SUPABASE_* automáticos)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ASAAS = "https://api.asaas.com/v3";
const PRICES: Record<string, number> = { START: 280, BUSINESS: 390, CORP: 500 };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const asaasKey = Deno.env.get("ASAAS_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    if (!asaasKey) return json({ error: "ASAAS_API_KEY não configurada." }, 503);

    const auth = req.headers.get("Authorization") || "";
    const userClient = createClient(supabaseUrl, anonKey || serviceKey, {
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
    if (cpf.length !== 11 && cpf.length !== 14) {
      return json({ error: "Informe um CPF válido do pagador." }, 400);
    }

    const headers = {
      access_token: asaasKey,
      "Content-Type": "application/json",
      "User-Agent": "CodeCraftGestao/1.0",
    };

    let customerId = "";
    const search = await fetch(`${ASAAS}/customers?email=${encodeURIComponent(email)}&limit=1`, { headers });
    const searchBody = await search.json();
    if (search.ok && searchBody?.data?.[0]?.id) {
      customerId = searchBody.data[0].id;
    } else {
      const customerRes = await fetch(`${ASAAS}/customers`, {
        method: "POST",
        headers,
        body: JSON.stringify({ name: holder, email, cpfCnpj: cpf }),
      });
      const customer = await customerRes.json();
      if (!customerRes.ok) {
        return json({ error: customer.errors?.[0]?.description || "Falha ao criar cliente Asaas" }, 400);
      }
      customerId = customer.id;
    }

    const paymentBody: Record<string, unknown> = {
      customer: customerId,
      billingType: method === "pix" ? "PIX" : "CREDIT_CARD",
      value: price,
      dueDate: new Date().toISOString().slice(0, 10),
      description: `CodeCraft Gestão · ${plan}`,
      externalReference: `${userData.user.id}:${plan}`,
    };

    if (method === "card") {
      const [mm, yy] = String(body.card?.exp || "").split("/");
      paymentBody.creditCard = {
        holderName: holder,
        number: String(body.card?.number || "").replace(/\D/g, ""),
        expiryMonth: mm,
        expiryYear: yy?.length === 2 ? `20${yy}` : yy,
        ccv: String(body.card?.cvv || ""),
      };
      paymentBody.creditCardHolderInfo = {
        name: holder,
        email,
        cpfCnpj: cpf,
        postalCode: "30130100",
        addressNumber: "100",
        phone: "31999999999",
      };
    }

    const payRes = await fetch(`${ASAAS}/payments`, {
      method: "POST",
      headers,
      body: JSON.stringify(paymentBody),
    });
    const payment = await payRes.json();
    if (!payRes.ok) {
      return json({ error: payment.errors?.[0]?.description || "Falha na cobrança Asaas" }, 400);
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const last4 = String(body.card?.number || "").replace(/\D/g, "").slice(-4);
    const next = new Date();
    next.setMonth(next.getMonth() + 1);

    let pixPayload: string | null = null;
    let pixImage: string | null = null;
    if (method === "pix" && payment.id) {
      const pixRes = await fetch(`${ASAAS}/payments/${payment.id}/pixQrCode`, { headers });
      const pix = await pixRes.json();
      if (pixRes.ok) {
        pixPayload = pix.payload || null;
        pixImage = pix.encodedImage ? `data:image/png;base64,${pix.encodedImage}` : null;
      }
    }

    const paid =
      method === "card" &&
      (payment.status === "CONFIRMED" || payment.status === "RECEIVED" || payment.status === "RECEIVED_IN_CASH");

    if (paid) {
      await admin.from("cc_profiles").update({
        plan,
        billing_status: "active",
        billing_method: "card",
        card_last4: last4,
        card_holder: holder,
        card_exp: String(body.card?.exp || ""),
        card_cpf: cpf,
        billed_at: new Date().toISOString(),
        next_charge_at: next.toISOString(),
      }).eq("id", userData.user.id);
      await admin.from("cc_charges").insert({
        owner_id: userData.user.id,
        amount: price * 100,
        method: "card",
        status: "paid",
        plan,
        card_last4: last4,
      });
    } else {
      // guarda cartão para renovação; plano ativa no webhook quando PIX/cartão confirmar
      await admin.from("cc_profiles").update({
        card_last4: last4 || "",
        card_holder: holder,
        card_cpf: cpf,
        card_exp: String(body.card?.exp || ""),
        billing_method: method === "pix" ? "pix" : "card",
      }).eq("id", userData.user.id);
    }

    return json({
      ok: true,
      paymentId: payment.id,
      status: payment.status,
      activated: paid,
      invoiceUrl: payment.invoiceUrl || null,
      pixPayload,
      pixImage,
    });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Erro Asaas" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
