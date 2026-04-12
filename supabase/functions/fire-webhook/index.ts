import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

async function hmacSha256(key: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(message));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  if (authHeader !== `Bearer ${supabaseServiceKey}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body: { event_type: string; coach_id: string; payload: unknown };
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const { event_type, coach_id, payload } = body;
  if (!event_type || !coach_id) {
    return new Response("Missing event_type or coach_id", { status: 400 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data: webhooks, error } = await supabase
    .from("webhooks")
    .select("*")
    .eq("coach_id", coach_id)
    .eq("event_type", event_type)
    .eq("active", true);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!webhooks || webhooks.length === 0) {
    return new Response(JSON.stringify({ sent: 0 }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const timestamp = new Date().toISOString();
  const results = await Promise.allSettled(
    webhooks.map(async (webhook: { id: string; url: string; secret: string | null }) => {
      const outgoing = JSON.stringify({ event: event_type, payload, timestamp });
      const headers: Record<string, string> = { "Content-Type": "application/json" };

      if (webhook.secret) {
        headers["X-Webhook-Signature"] = await hmacSha256(webhook.secret, outgoing);
      }

      const resp = await fetch(webhook.url, {
        method: "POST",
        headers,
        body: outgoing,
      });

      return { webhook_id: webhook.id, status: resp.status };
    }),
  );

  const summary = results.map((r, i) => {
    if (r.status === "fulfilled") return r.value;
    return { webhook_id: webhooks[i].id, error: String(r.reason) };
  });

  return new Response(JSON.stringify({ sent: webhooks.length, results: summary }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
