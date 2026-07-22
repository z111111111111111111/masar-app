import { query, mutation } from "./_generated/server";

export const get = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const sub = await ctx.db
      .query("subscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .unique();
    return sub ?? null;
  },
});

export const activate = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const FIXED_AMOUNT = 15;

    const now = new Date();
    const expires = new Date();
    expires.setMonth(now.getMonth() + 9);

    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: "active",
        amount: FIXED_AMOUNT,
        paidAt: now.toISOString(),
        expiresAt: expires.toISOString(),
      });
    } else {
      await ctx.db.insert("subscriptions", {
        userId: identity.subject,
        plan: "full_year",
        status: "active",
        amount: FIXED_AMOUNT,
        paidAt: now.toISOString(),
        expiresAt: expires.toISOString(),
      });
    }
  },
});
