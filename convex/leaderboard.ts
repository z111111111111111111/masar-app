import { query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const entries = await ctx.db.query("userProgress").collect();
    return entries
      .map((e) => ({
        userId: e.userId,
        name: e.name,
        xp: e.totalXP,
      }))
      .sort((a, b) => b.xp - a.xp);
  },
});
