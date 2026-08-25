// Envia e-mail de convite (Resend). Sem RESEND_API_KEY → 204 e o app usa mailto.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const resendKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("INVITE_FROM_EMAIL") || "CodeCraft Gestão <onboarding@resend.dev>";

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anon = Deno.env.get("SUPABASE_ANON_KEY") || "";
  const auth = req.headers.get("Authorization") || "";
  const userClient = createClient(supabaseUrl, anon, {
    global: { headers: { Authorization: auth } },
  });
  const { data: userData } = await userClient.auth.getUser();
  if (!userData.user) {
    return new Response(JSON.stringify({ error: "Não autenticado" }), {
      status: 401,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const body = await req.json();
  const email = String(body.email || "").trim().toLowerCase();
  const link = String(body.link || "");
  const orgName = String(body.orgName || "sua empresa");
  if (!email || !link) {
    return new Response(JSON.stringify({ error: "Dados incompletos" }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  if (!resendKey) {
    return new Response(JSON.stringify({ ok: true, emailed: false }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const send = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: `Convite · ${orgName} no CodeCraft Gestão`,
      html: `<p>Você foi convidado para <strong>${orgName}</strong> no CodeCraft Gestão.</p>
             <p><a href="${link}">Aceitar convite</a></p>
             <p>Se o botão não abrir: ${link}</p>`,
    }),
  });

  if (!send.ok) {
    const err = await send.text();
    return new Response(JSON.stringify({ error: err }), {
      status: 502,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true, emailed: true }), {
    headers: { ...cors, "Content-Type": "application/json" },
  });
});
