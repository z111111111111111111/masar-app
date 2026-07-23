import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

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

    // Auto-expire if past expiresAt
    if (sub.status === "active" && new Date(sub.expiresAt) <= new Date()) {
      return { ...sub, status: "inactive" as const };
    }

    return sub;
  },
});

export const initiatePayment = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Check if already active
    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .unique();
    if (existing && existing.status === "active") {
      throw new Error("Already subscribed");
    }

    const now = new Date().toISOString();
    const expires = new Date();
    expires.setMonth(expires.getMonth() + 9);

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: "inactive",
        paidAt: now,
        expiresAt: expires.toISOString(),
      });
    } else {
      await ctx.db.insert("subscriptions", {
        userId: identity.subject,
        plan: "full_year",
        status: "inactive",
        amount: 15,
        paidAt: now,
        expiresAt: expires.toISOString(),
      });
    }
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

    if (sub && sub.status === "active" && new Date(sub.expiresAt) <= new Date()) {
      await ctx.db.patch(sub._id, { status: "inactive" });
    }
  },
});

export const activate = mutation({
  args: { paymentId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Validate paymentId format (alphanumeric, 8-64 chars)
    if (!/^[a-zA-Z0-9]{8,64}$/.test(args.paymentId)) {
      throw new Error("Invalid payment ID format");
    }

    // Must have an inactive subscription record (from initiatePayment)
    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .unique();

    if (!existing || existing.status !== "inactive") {
      throw new Error("No pending payment. Start payment flow first.");
    }

    // Check expiry of the pending subscription (5 min window)
    const pendingExpiry = new Date(existing.expiresAt);
    if (pendingExpiry <= new Date()) {
      throw new Error("Payment window expired. Please start payment again.");
    }

    const now = new Date();
    const expires = new Date();
    expires.setMonth(now.getMonth() + 9);

    await ctx.db.patch(existing._id, {
      status: "active",
      amount: 15,
      paidAt: now.toISOString(),
      expiresAt: expires.toISOString(),
      paymentId: args.paymentId,
    });
  },
});
