import { query } from "./_generated/server";

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
    }));
  },
});
