import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { OWNER_SUBJECT } from "./owners";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const caller = await ctx.auth.getUserIdentity();
    if (!caller) return [];

    const entries = await ctx.db
      .query("userProgress")
      .withIndex("by_xp")
      .order("desc")
      .take(100);

    return entries.map((e) => ({
      userId: e.userId,
      name: e.name,
      xp: e.totalXP,
      verified: !!e.isVerified,
    }));
  },
});

// Grants/revokes the verified badge. Restricted to the owner identity so a
// random user can't fake it; the admin tool runs it with the owner identity.
export const setVerified = mutation({
  args: { userId: v.string(), verified: v.boolean() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity || identity.subject !== OWNER_SUBJECT) {
      throw new Error("Not authorized");
    }

    const progress = await ctx.db
      .query("userProgress")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();
    if (!progress) throw new Error("User not found");

    await ctx.db.patch(progress._id, { isVerified: args.verified });
  },
});
