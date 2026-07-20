import { query } from "./_generated/server";
import { v } from "convex/values";

export const getBySubjectWeek = query({
  args: { subject: v.string(), weekNumber: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("exerciseBank")
      .withIndex("by_subject_week", (q) =>
        q.eq("subject", args.subject).eq("weekNumber", args.weekNumber)
      )
      .collect();
  },
});

export const getRandom = query({
  args: { subject: v.string(), weekNumber: v.number() },
  handler: async (ctx, args) => {
    const exercises = await ctx.db
      .query("exerciseBank")
      .withIndex("by_subject_week", (q) =>
        q.eq("subject", args.subject).eq("weekNumber", args.weekNumber)
      )
      .collect();

    if (exercises.length === 0) return null;
    return exercises[Math.floor(Math.random() * exercises.length)];
  },
});
