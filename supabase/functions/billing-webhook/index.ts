// Webhook Asaas → ativa assinatura quando pagamento CONFIRMADO/RECEIVED
// Header: asaas-access-token = ASAAS_WEBHOOK_TOKEN
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, asaas-access-token",
      },
    });
  }
  const expected = Deno.env.get("ASAAS_WEBHOOK_TOKEN") || "";
  const got = req.headers.get("asaas-access-token") || "";
  if (expected && got !== expected) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey);

  const event = await req.json();
  const payment = event.payment || event;
  const status = String(payment.status || "");
  if (!["CONFIRMED", "RECEIVED"].includes(status)) {
    return new Response(JSON.stringify({ ok: true, skipped: status }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const ref = String(payment.externalReference || "");
  const [userId, plan] = ref.split(":");
  if (!userId || !plan) {
    return new Response(JSON.stringify({ error: "externalReference inválido" }), { status: 400 });
  }

  const next = new Date();
  next.setMonth(next.getMonth() + 1);
  const method = String(payment.billingType || "").toUpperCase() === "PIX" ? "pix" : "card";

  // service_role bypassa o billing_guard (ver patch no schema)
  const { error } = await admin.from("cc_profiles").update({
    plan,
    billing_status: "active",
    billing_method: method,
    billed_at: new Date().toISOString(),
    next_charge_at: next.toISOString(),
  }).eq("id", userId);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  await admin.from("cc_charges").insert({
    owner_id: userId,
    amount: Math.round(Number(payment.value || 0) * 100),
    method,
    status: "paid",
    plan,
    card_last4: "",
  });

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
