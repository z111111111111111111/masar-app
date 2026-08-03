import { query, mutation, internalMutation, internalQuery, type QueryCtx } from "./_generated/server";
import { v } from "convex/values";

// Free-trial policy:
// - 7 calendar days from account creation (signedUpAt).
// - Day 3+ → the app reminds the user to subscribe.
// - Day 7+ → everything is blocked until the user pays.
// - During the trial the user gets 5 AI messages and 3 random/timed practice
//   sessions (both enforced server-side).
export const TRIAL_DAYS = 7;
export const REMINDER_DAYS = 3;
export const AI_LIMIT = 5;
export const RANDOM_LIMIT = 3;
const DAY_MS = 24 * 60 * 60 * 1000;

type DbCtx = { db: QueryCtx["db"] };

async function loadState(ctx: DbCtx, userId: string) {
  const progress = await ctx.db
    .query("userProgress")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .unique();
  const sub = await ctx.db
    .query("subscriptions")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .unique();
  const limits = await ctx.db
    .query("userLimits")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .unique();
  return { progress, sub, limits };
}

function isPaid(sub: { status: string; expiresAt: string } | null | undefined, now: number): boolean {
  return !!sub && sub.status === "active" && new Date(sub.expiresAt).getTime() > now;
}

function trialDays(progress: { signedUpAt?: number } | null | undefined, fallbackCreationTime: number | undefined, now: number): number {
  const signedUpAt = progress?.signedUpAt ?? fallbackCreationTime ?? now;
  return Math.floor(Math.max(0, now - signedUpAt) / DAY_MS);
}

// ─── Public status used by the whole app ─────────────────────────────
// Time is passed in from the client so the query stays fresh without the
// server reading the wall clock.
export const get = query({
  args: { now: v.number() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const userId = identity.subject;
    const { progress, sub, limits } = await loadState(ctx, userId);
    const paid = isPaid(sub, args.now);
    const daysSince = trialDays(progress, progress?._creationTime, args.now);
    const trialExpired = !paid && daysSince >= TRIAL_DAYS;
    const aiUsed = limits?.aiUsed ?? 0;
    const randomUsed = limits?.randomUsed ?? 0;
    return {
      paid,
      signedUpAt: progress?.signedUpAt ?? progress?._creationTime ?? args.now,
      daysSince,
      trialDays: TRIAL_DAYS,
      reminderDays: REMINDER_DAYS,
      daysRemaining: Math.max(0, TRIAL_DAYS - daysSince),
      blocked: trialExpired,
      needsReminder: !paid && !trialExpired && daysSince >= REMINDER_DAYS,
      wasPaid: !!sub && sub.status === "active",
      limits: {
        aiLimit: AI_LIMIT,
        aiUsed,
        aiRemaining: paid ? null : Math.max(0, AI_LIMIT - aiUsed),
        randomLimit: RANDOM_LIMIT,
        randomUsed,
        randomRemaining: paid ? null : Math.max(0, RANDOM_LIMIT - randomUsed),
      },
      subscription: sub ? { status: sub.status, expiresAt: sub.expiresAt } : null,
    };
  },
});

// ─── Internal status used by actions (identity already verified) ────
export const getStatus = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const { progress, sub, limits } = await loadState(ctx, args.userId);
    const now = Date.now();
    const paid = isPaid(sub, now);
    const daysSince = trialDays(progress, progress?._creationTime, now);
    return {
      paid,
      trialExpired: !paid && daysSince >= TRIAL_DAYS,
      aiUsed: limits?.aiUsed ?? 0,
      randomUsed: limits?.randomUsed ?? 0,
    };
  },
});

// ─── Atomic AI consumption (chat + exercise explanations share one pool) ──
export const consumeAi = internalMutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const userId = args.userId;
    const { progress, sub, limits } = await loadState(ctx, userId);
    const now = Date.now();
    const paid = isPaid(sub, now);
    if (paid) return { allowed: true, remaining: null };
    const daysSince = trialDays(progress, progress?._creationTime, now);
    if (daysSince >= TRIAL_DAYS) {
      throw new Error("انتهت فترة التجربة المجانية. فعّل اشتراكك للمتابعة.");
    }
    const used = limits?.aiUsed ?? 0;
    if (used >= AI_LIMIT) {
      throw new Error("استنفدت رسائل الذكاء الاصطناعي المجانية (5). فعّل اشتراكك لفتح المزيد.");
    }
    const next = used + 1;
    if (limits) {
      await ctx.db.patch(limits._id, { aiUsed: next });
    } else {
      await ctx.db.insert("userLimits", { userId, aiUsed: next, randomUsed: 0 });
    }
    return { allowed: true, remaining: AI_LIMIT - next };
  },
});

// ─── Public consumption of a random/timed practice session ───────────
export const consumeRandom = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const userId = identity.subject;
    const { progress, sub, limits } = await loadState(ctx, userId);
    const now = Date.now();
    const paid = isPaid(sub, now);
    if (paid) return { allowed: true, remaining: null };
    const daysSince = trialDays(progress, progress?._creationTime, now);
    if (daysSince >= TRIAL_DAYS) {
      throw new Error("انتهت فترة التجربة المجانية. فعّل اشتراكك للمتابعة.");
    }
    const used = limits?.randomUsed ?? 0;
    if (used >= RANDOM_LIMIT) {
      throw new Error("استنفدت استخدامات التمرين العشوائي (3). فعّل اشتراكك لفتح المزيد.");
    }
    const next = used + 1;
    if (limits) {
      await ctx.db.patch(limits._id, { randomUsed: next });
    } else {
      await ctx.db.insert("userLimits", { userId, aiUsed: 0, randomUsed: next });
    }
    return { allowed: true, remaining: RANDOM_LIMIT - next };
  },
});
