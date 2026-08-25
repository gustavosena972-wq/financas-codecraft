// Webhook Asaas → ativa assinatura quando pagamento CONFIRMADO/RECEIVED
// Configure no Asaas: URL + header asaas-access-token = ASAAS_WEBHOOK_TOKEN
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, asaas-access-token",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const expected = Deno.env.get("ASAAS_WEBHOOK_TOKEN") || "";
  const got = req.headers.get("asaas-access-token") || "";
  if (expected && got !== expected) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey);

  const event = await req.json();
  const payment = event.payment || event;
  const status = String(payment.status || "");
  const eventName = String(event.event || "");

  const okStatuses = ["CONFIRMED", "RECEIVED", "RECEIVED_IN_CASH"];
  const okEvents = ["PAYMENT_CONFIRMED", "PAYMENT_RECEIVED", "PAYMENT_RECEIVED_IN_CASH"];
  if (!okStatuses.includes(status) && !okEvents.includes(eventName)) {
    return new Response(JSON.stringify({ ok: true, skipped: status || eventName }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const ref = String(payment.externalReference || "");
  const [userId, plan] = ref.split(":");
  if (!userId || !["START", "BUSINESS", "CORP"].includes(plan)) {
    return new Response(JSON.stringify({ error: "externalReference inválido" }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const next = new Date();
  next.setMonth(next.getMonth() + 1);
  const method = String(payment.billingType || "").toUpperCase() === "PIX" ? "pix" : "card";
  const amountCents = Math.round(Number(payment.value || 0) * 100);

  const { error } = await admin.from("cc_profiles").update({
    plan,
    billing_status: "active",
    billing_method: method,
    billed_at: new Date().toISOString(),
    next_charge_at: next.toISOString(),
  }).eq("id", userId);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  await admin.from("cc_charges").insert({
    owner_id: userId,
    amount: amountCents || (plan === "START" ? 28000 : plan === "CORP" ? 50000 : 39000),
    method,
    status: "paid",
    plan,
    card_last4: "",
  });

  return new Response(JSON.stringify({ ok: true }), {
    headers: { ...cors, "Content-Type": "application/json" },
  });
});
