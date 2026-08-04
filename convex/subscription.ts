import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { isOwner } from "./owners";

// ─── Subscription flow ────────────────────────────────────────────
// Payment is a manual CCP/EDAHABIA bank transfer: the user requests a
// subscription (status "pending"), the admin sees the pending request with the
// transfer reference, verifies the money arrived manually, then activates the
// subscription from the admin panel. Payout of the 5000 DZD referral reward
// happens manually (out of scope); activating a subscription marks the user's
// referral attribution as "paid" so the referrer's counter advances.
export const PLAN_DZD = 3000;
export const PLAN_DAYS = 90;

// Strong subscription status used by the app gateway.
export const verifySubscription = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { status: "unauthenticated" as const };

    const sub = await ctx.db
      .query("subscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .unique();

    if (!sub) {
      return { status: "never_paid" as const, userId: identity.subject };
    }

    const now = Date.now();
    const expiresAt = new Date(sub.expiresAt).getTime();

    if (sub.status === "active" && expiresAt > now) {
      return {
        status: "active" as const,
        expiresAt: sub.expiresAt,
        daysRemaining: Math.max(0, Math.ceil((expiresAt - now) / 86400000)),
        plan: sub.plan,
        userId: identity.subject,
      };
    }

    if (sub.status === "pending") {
      return { status: "pending" as const, userId: identity.subject };
    }

    return {
      status: "expired" as const,
      expiresAt: sub.expiresAt,
      daysRemaining: 0,
      wasActive: sub.status === "active",
      userId: identity.subject,
    };
  },
});

// Read-only subscription row (auto-expire report only).
export const get = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const sub = await ctx.db
      .query("subscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .unique();
    if (!sub) return null;
    if (sub.status === "active" && new Date(sub.expiresAt).getTime() <= Date.now()) {
      return { ...sub, status: "inactive" as const };
    }
    return sub;
  },
});

// User requests a subscription after making the manual transfer.
export const initiatePayment = mutation({
  args: { reference: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const reference = args.reference.trim();
    if (reference.length < 4 || reference.length > 100) {
      throw new Error("أدخل رقم/مرجع العملية (بين 4 و 100 حرف).");
    }

    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .unique();
    if (existing && existing.status === "active") {
      throw new Error("اشتراكك مفعّل بالفعل.");
    }
    if (existing && existing.status === "pending") {
      throw new Error("طلبك قيد المراجعة الإدارية. تحقق لاحقاً أو تواصل مع الدعم.");
    }

    const now = Date.now();
    const expires = new Date(now + PLAN_DAYS * 24 * 60 * 60 * 1000);

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: "pending",
        plan: "quarterly",
        amount: PLAN_DZD,
        paymentRef: reference,
        paidAt: undefined,
        requestedAt: now,
        expiresAt: expires.toISOString(),
      });
    } else {
      await ctx.db.insert("subscriptions", {
        userId: identity.subject,
        plan: "quarterly",
        status: "pending",
        amount: PLAN_DZD,
        paymentRef: reference,
        paidAt: undefined,
        requestedAt: now,
        expiresAt: expires.toISOString(),
      });
    }
  },
});

// Admin panel ─────────────────────────────────────────────────────
// All admin operations are restricted to the owner identity server-side, so a
// random user can't activate their own subscription, cancel others' requests or
// read the pending requests (names, emails, transfer references).

export const adminListPending = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!isOwner(identity)) throw new Error("Not authorized");

    const subs = await ctx.db
      .query("subscriptions")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .take(200);
    const rows = [];
    for (const sub of subs) {
      const profile = await ctx.db
        .query("userProgress")
        .withIndex("by_userId", (q) => q.eq("userId", sub.userId))
        .unique();
      rows.push({
        _id: sub._id,
        userId: sub.userId,
        plan: sub.plan,
        amount: sub.amount,
        paymentRef: sub.paymentRef ?? null,
        requestedAt: sub.requestedAt ?? null,
        expiresAt: sub.expiresAt,
        name: profile?.name ?? "غير معروف",
        email: profile?.email ?? "",
      });
    }
    return rows;
  },
});

// Admin confirms the money arrived → activate for 3 months from now and advance
// the referrer's paid counter.
export const adminActivate = mutation({
  args: { subscriptionId: v.id("subscriptions") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!isOwner(identity)) throw new Error("Not authorized");

    const sub = await ctx.db.get(args.subscriptionId);
    if (!sub) throw new Error("Subscription not found");

    const now = Date.now();
    const expires = new Date(now + PLAN_DAYS * 24 * 60 * 60 * 1000);

    await ctx.db.patch(sub._id, {
      status: "active",
      paidAt: now,
      expiresAt: expires.toISOString(),
    });

    // The invitee is now paying → count toward the referrer's reward.
    await ctx.runMutation(internal.referrals.markPaid, { userId: sub.userId });
  },
});

// Admin rejects/cancels a pending request.
export const adminCancelPending = mutation({
  args: { subscriptionId: v.id("subscriptions") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!isOwner(identity)) throw new Error("Not authorized");

    const sub = await ctx.db.get(args.subscriptionId);
    if (!sub) throw new Error("Subscription not found");
    if (sub.status !== "pending") throw new Error("Only pending requests can be cancelled");
    await ctx.db.patch(sub._id, { status: "inactive" });
  },
});

export const enforceExpiry = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const sub = await ctx.db
      .query("subscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .unique();

    if (sub && sub.status === "active" && new Date(sub.expiresAt).getTime() <= Date.now()) {
      await ctx.db.patch(sub._id, { status: "inactive" });
    }
  },
});

// Legacy fake activation kept for compatibility (used by nothing now).
export const activate = mutation({
  args: { paymentId: v.string() },
  handler: async () => {
    throw new Error("تم استبدال الدفع الفوري بتحويل يدوي مع تفعيل إداري.");
  },
});

export { internalMutation };
