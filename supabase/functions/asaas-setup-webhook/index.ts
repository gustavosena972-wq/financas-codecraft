// One-shot: registra webhook Asaas → billing-webhook
// Secrets: ASAAS_API_KEY, ASAAS_WEBHOOK_TOKEN, ASAAS_SETUP_TOKEN
// Invoke: POST com { "setupToken": "..." }
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

function asaasBase(key: string) {
  const env = (Deno.env.get("ASAAS_ENV") || "").toLowerCase();
  if (env === "sandbox" || env === "homolog" || key.startsWith("$aact_hmlg_")) {
    return "https://sandbox.asaas.com/v3";
  }
  return "https://api.asaas.com/v3";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const setupExpected = Deno.env.get("ASAAS_SETUP_TOKEN") || "";
    const body = await req.json().catch(() => ({}));
    const setupGot = String(body.setupToken || req.headers.get("x-ccs-setup") || "");
    if (!setupExpected || setupGot !== setupExpected) {
      return json({ error: "setupToken inválido" }, 401);
    }

    const asaasKey = Deno.env.get("ASAAS_API_KEY") || "";
    const webhookToken = Deno.env.get("ASAAS_WEBHOOK_TOKEN") || "";
    if (!asaasKey) return json({ error: "ASAAS_API_KEY ausente" }, 503);
    if (!webhookToken || webhookToken.length < 32) {
      return json({ error: "ASAAS_WEBHOOK_TOKEN precisa ter 32+ caracteres" }, 503);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const anon = Deno.env.get("SUPABASE_ANON_KEY") || "";
    if (!supabaseUrl) return json({ error: "SUPABASE_URL ausente" }, 503);

    const webhookUrl =
      `${supabaseUrl.replace(/\/$/, "")}/functions/v1/billing-webhook` +
      (anon ? `?apikey=${encodeURIComponent(anon)}` : "");

    const ASAAS = asaasBase(asaasKey);
    const headers = {
      access_token: asaasKey,
      "Content-Type": "application/json",
      "User-Agent": "CodeCraftGestao/1.0",
    };

    // Lista webhooks existentes — atualiza se já tiver o nosso
    const listRes = await fetch(`${ASAAS}/webhooks`, { headers });
    const listBody = await listRes.json().catch(() => ({}));
    const existing = Array.isArray(listBody?.data) ? listBody.data : [];
    const ours = existing.find((w: { url?: string; name?: string }) =>
      String(w.url || "").includes("/functions/v1/billing-webhook") ||
      String(w.name || "").includes("CodeCraft Gestão")
    );

    const payload = {
      name: "CodeCraft Gestão · billing",
      url: webhookUrl,
      email: String(body.email || "gustavosena972@gmail.com"),
      enabled: true,
      interrupted: false,
      apiVersion: 3,
      authToken: webhookToken,
      sendType: "SEQUENTIALLY",
      events: [
        "PAYMENT_CONFIRMED",
        "PAYMENT_RECEIVED",
        "PAYMENT_RECEIVED_IN_CASH",
      ],
    };

    let res: Response;
    if (ours?.id) {
      res = await fetch(`${ASAAS}/webhooks/${ours.id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(payload),
      });
    } else {
      res = await fetch(`${ASAAS}/webhooks`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const desc =
        data?.errors?.[0]?.description ||
        data?.errors?.[0]?.code ||
        data?.message ||
        data?.error ||
        `Asaas HTTP ${res.status}`;
      return json({
        error: desc,
        status: res.status,
        actionAttempt: ours?.id ? "update" : "create",
        asaasBase: ASAAS,
        urlHost: (() => {
          try { return new URL(webhookUrl).host; } catch { return ""; }
        })(),
        details: data,
      }, 400);
    }

    // Smoke: confirma que o token bate no nosso endpoint (opcional, não dispara Asaas)
    return json({
      ok: true,
      action: ours?.id ? "updated" : "created",
      webhookId: data.id || ours?.id || null,
      url: webhookUrl.replace(/apikey=[^&]+/, "apikey=***"),
      events: payload.events,
      enabled: true,
      note: "Token asaas-access-token já sincronizado com ASAAS_WEBHOOK_TOKEN no Supabase.",
    });
  } catch (e) {
    return json({
      error: e instanceof Error ? e.message : String(e),
    }, 500);
  }
});
