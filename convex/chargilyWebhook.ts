import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

// Signed webhook from Chargily Pay (v2). Every incoming request must carry the
// `signature` header: an HMAC-SHA256 of the RAW body using the API secret key.
// We verify it here (constant-time) and only then schedule the event for
// processing — so a forged/replayed/tampered event can never reach the
// activation logic. The browser success redirect is NEVER trusted.
export const chargilyWebhook = httpAction(async (ctx, request) => {
  const rawBody = await request.text();
  const signature =
    request.headers.get("signature") ?? request.headers.get("x-chargily-signature");
  const secret = process.env.CHARGILY_API_SECRET;

  if (!secret || !signature) {
    return new Response("missing signature", { status: 400 });
  }

  const computed = await hmacSha256Hex(secret, rawBody);
  if (!constantTimeEqualHex(computed, signature)) {
    return new Response("invalid signature", { status: 403 });
  }

  let event: unknown;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response("invalid json", { status: 400 });
  }
  if (!event || typeof event !== "object") {
    return new Response("invalid payload", { status: 400 });
  }

  // Acknowledge immediately; process in a fresh transaction. A slow or
  // replayed event can't block the gateway, and the mutation itself is
  // idempotent per checkout row.
  await ctx.scheduler.runAfter(0, internal.payments.processWebhook, { event });
  return new Response("ok", { status: 200 });
});

async function hmacSha256Hex(secret: string, payload: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function constantTimeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
