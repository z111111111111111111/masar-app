import { action, internalMutation, internalQuery, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { PLAN_DZD, PLAN_DAYS } from "./subscription";

// ─── Chargily Pay v2 integration ──────────────────────────────────
// Checkout flow: the client calls createCheckout → we create a Chargily
// checkout server-side (amount/currency always server-set) and return the
// checkout URL to open in a new tab. The account is activated ONLY by the
// signed webhook (convex/http.ts → processWebhook), never by the browser
// success redirect, so a tampered/cloned success URL can't grant access.
//
// Security notes:
//  - The Chargily API secret lives in the CHARGILY_API_SECRET env var and is
//    never exposed to the client.
//  - The webhook HMAC signature is verified against the raw request body.
//  - Activation is idempotent per checkout row: a replayed/delayed webhook
//    finds the row already "paid" and skips, so no double activation.
//  - The user↔checkout binding comes from OUR stored row, not from any
//    client-supplied metadata, so a forged event can't target another user.
const CHARGILY_TEST_BASE = "https://pay.chargily.net/test/api/v2";
const CHARGILY_LIVE_BASE = "https://pay.chargily.net/api/v2";
const CHECKOUT_REUSE_MS = 30 * 60 * 1000; // reuse a pending checkout for 30 min

// Chargily's test API returns http://pay.chargily.dz/... — a popup opened from
// our HTTPS site won't navigate to an http:// URL (HTTPS-First/mixed content),
// so normalize every checkout URL to https:// before it reaches the client.
function toHttps(url: string): string {
  return url.replace(/^http:\/\//i, "https://");
}

function chargilyBaseUrl(): string {
  return process.env.CHARGILY_MODE === "live" ? CHARGILY_LIVE_BASE : CHARGILY_TEST_BASE;
}

type PaymentCheckoutStatus =
  | "pending"
  | "paid"
  | "failed"
  | "canceled"
  | "refunded";

export type PaymentCheckoutRow = {
  _id: string;
  userId: string;
  checkoutId: string;
  checkoutUrl: string;
  status: PaymentCheckoutStatus;
  amount: number;
  currency: string;
  plan: string;
  createdAt: number;
  updatedAt: number;
};

// ─── Internal lookups (used by the action / webhook) ──────────────

export const lookupLatestCheckout = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, args): Promise<PaymentCheckoutRow | null> => {
    const row = await ctx.db
      .query("paymentCheckouts")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .first();
    return row ?? null;
  },
});

export const lookupCheckoutById = internalQuery({
  args: { checkoutId: v.string() },
  handler: async (ctx, args): Promise<PaymentCheckoutRow | null> => {
    const row = await ctx.db
      .query("paymentCheckouts")
      .withIndex("by_checkoutId", (q) => q.eq("checkoutId", args.checkoutId))
      .unique();
    return row ?? null;
  },
});

export const storeCheckout = internalMutation({
  args: {
    userId: v.string(),
    checkoutId: v.string(),
    checkoutUrl: v.string(),
    amount: v.number(),
    currency: v.string(),
    plan: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    await ctx.db.insert("paymentCheckouts", {
      userId: args.userId,
      checkoutId: args.checkoutId,
      checkoutUrl: args.checkoutUrl,
      status: "pending",
      amount: args.amount,
      currency: args.currency,
      plan: args.plan,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// ─── Public API ───────────────────────────────────────────────────

// Create (or reuse) a pending checkout for the authenticated user. The client
// never sends the amount/currency — they come from the server plan constants.
export const createCheckout = action({
  args: {},
  handler: async (ctx): Promise<{ checkoutId: string; checkoutUrl: string; reused: boolean }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const secret = process.env.CHARGILY_API_SECRET;
    if (!secret) {
      throw new Error("الدفع الإلكتروني غير مفعّل حالياً. تواصل مع الدعم.");
    }

    const now = Date.now();
    const latest: PaymentCheckoutRow | null = await ctx.runQuery(
      internal.payments.lookupLatestCheckout,
      { userId: identity.subject }
    );
    if (latest && latest.status === "pending" && now - latest.createdAt < CHECKOUT_REUSE_MS) {
      return {
        checkoutId: latest.checkoutId,
        checkoutUrl: toHttps(latest.checkoutUrl),
        reused: true,
      };
    }

    const siteUrl = process.env.SITE_URL ?? "https://masarlearn.vercel.app";
    const webhookUrl =
      process.env.CHARGILY_WEBHOOK_URL ??
      "https://adamant-panda-562.eu-west-1.convex.site/webhooks/chargily";

    const payload = {
      amount: PLAN_DZD,
      currency: "dzd",
      success_url: `${siteUrl}/?payment=success`,
      failure_url: `${siteUrl}/?payment=failure`,
      webhook_endpoint: webhookUrl,
      locale: "ar",
      metadata: {
        userId: identity.subject,
      },
    };

    const res = await fetch(`${chargilyBaseUrl()}/checkouts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Chargily create checkout failed", res.status, text.slice(0, 500));
      throw new Error("تعذّر إنشاء عملية الدفع. حاول مجدداً.");
    }

    const data: unknown = await res.json();
    const checkoutId = (data as { id?: unknown }).id;
    const rawUrl = (data as { checkout_url?: unknown }).checkout_url;
    const checkoutUrl = typeof rawUrl === "string" ? toHttps(rawUrl) : undefined;
    if (typeof checkoutId !== "string" || typeof checkoutUrl !== "string") {
      console.error("Chargily unexpected response", JSON.stringify(data).slice(0, 500));
      throw new Error("استجابة غير متوقعة من بوابة الدفع.");
    }

    await ctx.runMutation(internal.payments.storeCheckout, {
      userId: identity.subject,
      checkoutId,
      checkoutUrl,
      amount: PLAN_DZD,
      currency: "dzd",
      plan: "quarterly",
    });

    return { checkoutId, checkoutUrl, reused: false };
  },
});

// Live status used by the payment screen: subscription state + latest checkout.
export const getCheckoutStatus = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { subscriptionStatus: "unauthenticated" as const, checkoutStatus: null };
    }

    const sub = await ctx.db
      .query("subscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .unique();

    let subscriptionStatus: "active" | "pending" | "inactive";
    if (sub && sub.status === "active" && new Date(sub.expiresAt).getTime() > Date.now()) {
      subscriptionStatus = "active";
    } else if (sub && sub.status === "pending") {
      subscriptionStatus = "pending";
    } else {
      subscriptionStatus = "inactive";
    }

    const latest = await ctx.db
      .query("paymentCheckouts")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .first();

    return {
      subscriptionStatus,
      checkoutStatus: latest ? latest.status : null,
      checkoutId: latest ? latest.checkoutId : null,
      checkoutUrl: latest && latest.status === "pending" ? toHttps(latest.checkoutUrl) : null,
    };
  },
});

// ─── Webhook processing ───────────────────────────────────────────
// Called (scheduled) by the httpAction only AFTER the HMAC signature of the
// raw body has been verified. The payload is treated as untrusted JSON and
// narrowed field by field; nothing here trusts the browser.
export const processWebhook = internalMutation({
  args: { event: v.any() },
  handler: async (ctx, args) => {
    const event = args.event as Record<string, unknown> | null;
    if (!event || typeof event !== "object") return;

    const type = event.type;
    if (typeof type !== "string") return;
    // The checkout id lives in the nested `data` object (Chargily v2 payload:
    // { type: "checkout.paid", data: { id: "<checkoutId>", ... }, ... }).
    const data = event.data;
    const entityId =
      typeof data === "object" && data !== null
        ? (data as { id?: unknown }).id
        : undefined;
    if (typeof entityId !== "string") return;

    const row = await ctx.db
      .query("paymentCheckouts")
      .withIndex("by_checkoutId", (q) => q.eq("checkoutId", entityId))
      .unique();
    if (!row) {
      // Webhook for a checkout we never created (or already removed) — ignore.
      console.log("Chargily webhook for unknown checkout", entityId, type);
      return;
    }

    if (type === "checkout.paid") {
      if (row.status === "paid") return; // idempotency: replay of the same event

      const now = Date.now();
      const expires = new Date(now + PLAN_DAYS * 24 * 60 * 60 * 1000);
      await ctx.db.patch(row._id, { status: "paid", updatedAt: now });

      const sub = await ctx.db
        .query("subscriptions")
        .withIndex("by_userId", (q) => q.eq("userId", row.userId))
        .unique();
      if (sub) {
        await ctx.db.patch(sub._id, {
          status: "active",
          plan: "quarterly",
          amount: row.amount,
          paidAt: now,
          requestedAt: sub.requestedAt ?? now,
          expiresAt: expires.toISOString(),
          paymentId: row.checkoutId,
          paymentRef: sub.paymentRef,
          checkoutId: row.checkoutId,
        });
      } else {
        await ctx.db.insert("subscriptions", {
          userId: row.userId,
          plan: "quarterly",
          status: "active",
          amount: row.amount,
          paidAt: now,
          requestedAt: now,
          expiresAt: expires.toISOString(),
          paymentId: row.checkoutId,
          checkoutId: row.checkoutId,
        });
      }

      // The invitee paid → advance the referrer's reward counter (idempotent).
      await ctx.runMutation(internal.referrals.markPaid, { userId: row.userId });

      // Payment received → the account becomes officially verified automatically,
      // which immediately unlocks the referral program (no manual admin step).
      const profile = await ctx.db
        .query("userProgress")
        .withIndex("by_userId", (q) => q.eq("userId", row.userId))
        .unique();
      if (profile) {
        await ctx.db.patch(profile._id, { isVerified: true });
      }
      return;
    }

    if (type === "checkout.failed") {
      if (row.status === "paid") return;
      await ctx.db.patch(row._id, { status: "failed", updatedAt: Date.now() });
      return;
    }

    if (type === "checkout.canceled") {
      if (row.status === "paid") return;
      await ctx.db.patch(row._id, { status: "canceled", updatedAt: Date.now() });
      return;
    }

    if (type === "checkout.refunded") {
      await ctx.db.patch(row._id, { status: "refunded", updatedAt: Date.now() });
      // A refund of the checkout that granted the active subscription revokes
      // access: subscription -> inactive and the verified badge is dropped so a
      // paid-then-refunded account can't keep paid features. A refund of any
      // other (superseded) checkout doesn't affect access.
      const sub = await ctx.db
        .query("subscriptions")
        .withIndex("by_userId", (q) => q.eq("userId", row.userId))
        .unique();
      if (sub && sub.checkoutId === row.checkoutId && sub.status === "active") {
        await ctx.db.patch(sub._id, { status: "inactive" });
        const profile = await ctx.db
          .query("userProgress")
          .withIndex("by_userId", (q) => q.eq("userId", row.userId))
          .unique();
        if (profile) {
          await ctx.db.patch(profile._id, { isVerified: false });
        }
        // Keep the referral ledger honest: the invitee no longer counts as paid.
        const events = await ctx.db
          .query("referralEvents")
          .withIndex("by_referredUserId", (q) => q.eq("referredUserId", row.userId))
          .take(200);
        for (const ev of events) {
          if (ev.status === "paid") {
            await ctx.db.patch(ev._id, { status: "registered", paidAt: undefined });
          }
        }
      }
      return;
    }

    console.log("Chargily unhandled webhook type", type, entityId);
  },
});
