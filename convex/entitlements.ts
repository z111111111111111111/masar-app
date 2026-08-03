import { query, mutation, internalMutation, internalQuery, type QueryCtx } from "./_generated/server";
import { v } from "convex/values";

// Free-trial policy:
// - 7 calendar days from account creation (signedUpAt).
// - Day 3+ → the app reminds the user to subscribe.
// - Day 7+ → everything is blocked until the user pays.
// - During the trial the user gets 5 AI messages, 3 random/timed practice
//   sessions and 3 daily timed sessions. Each quota is a rolling 24h window
//   (server clock), so it refills automatically ~24h after first use.
export const TRIAL_DAYS = 7;
export const REMINDER_DAYS = 3;
export const AI_LIMIT = 5;
export const RANDOM_LIMIT = 3;
export const DAILY_LIMIT = 3;
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

// Rolling 24h window based purely on the server clock (Date.now()). The stored
// windowStart keeps the phase of the window, so the quota refills ~24h after
// the first use and the client cannot shift it by changing the phone clock.
function windowInfo(windowStart: number | undefined, now: number): { windowStart: number; resetAt: number; rolled: boolean } {
  if (!windowStart || windowStart > now) {
    return { windowStart: now, resetAt: now + DAY_MS, rolled: true };
  }
  const elapsed = now - windowStart;
  if (elapsed < DAY_MS) {
    return { windowStart, resetAt: windowStart + DAY_MS, rolled: false };
  }
  const k = Math.floor(elapsed / DAY_MS);
  return {
    windowStart: windowStart + k * DAY_MS,
    resetAt: windowStart + (k + 1) * DAY_MS,
    rolled: true,
  };
}

// ─── Public status used by the whole app ─────────────────────────────
// `now` is passed from the client only to force the query to re-evaluate on a
// timer (Convex won't rerun a query just because time advances). All policy
// decisions (paid, trial days, 24h windows) are derived from the server clock,
// so a tampered device clock can't extend the trial or shift the quotas.
export const get = query({
  args: { now: v.number() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const userId = identity.subject;
    const { progress, sub, limits } = await loadState(ctx, userId);
    const serverNow = Date.now();
    const paid = isPaid(sub, serverNow);
    const daysSince = trialDays(progress, progress?._creationTime, serverNow);
    const trialExpired = !paid && daysSince >= TRIAL_DAYS;

    const aiW = windowInfo(limits?.aiWindowStart, Date.now());
    const randomW = windowInfo(limits?.randomWindowStart, Date.now());
    const dailyW = windowInfo(limits?.dailyWindowStart, Date.now());
    const aiUsed = aiW.rolled ? 0 : (limits?.aiUsed ?? 0);
    const randomUsed = randomW.rolled ? 0 : (limits?.randomUsed ?? 0);
    const dailyUsed = dailyW.rolled ? 0 : (limits?.dailyUsed ?? 0);

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
        aiResetAt: paid ? null : aiW.resetAt,
        randomLimit: RANDOM_LIMIT,
        randomUsed,
        randomRemaining: paid ? null : Math.max(0, RANDOM_LIMIT - randomUsed),
        randomResetAt: paid ? null : randomW.resetAt,
        dailyLimit: DAILY_LIMIT,
        dailyUsed,
        dailyRemaining: paid ? null : Math.max(0, DAILY_LIMIT - dailyUsed),
        dailyResetAt: paid ? null : dailyW.resetAt,
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
      dailyUsed: limits?.dailyUsed ?? 0,
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
    if (paid) return { allowed: true, remaining: null, resetAt: null };
    const daysSince = trialDays(progress, progress?._creationTime, now);
    if (daysSince >= TRIAL_DAYS) {
      throw new Error("انتهت فترة التجربة المجانية. فعّل اشتراكك للمتابعة.");
    }
    const w = windowInfo(limits?.aiWindowStart, now);
    const used = w.rolled ? 0 : (limits?.aiUsed ?? 0);
    if (used >= AI_LIMIT) {
      throw new Error("استنفدت رسائل الذكاء الاصطناعي المجانية (5). يعود رصيدك تلقائياً بعد 24 ساعة (بتوقيت الخادم).");
    }
    const next = used + 1;
    if (limits) {
      await ctx.db.patch(limits._id, { aiUsed: next, aiWindowStart: w.windowStart });
    } else {
      await ctx.db.insert("userLimits", {
        userId,
        aiUsed: next,
        randomUsed: 0,
        dailyUsed: 0,
        aiWindowStart: w.windowStart,
      });
    }
    return { allowed: true, remaining: AI_LIMIT - next, resetAt: w.resetAt };
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
    if (paid) return { allowed: true, remaining: null, resetAt: null };
    const daysSince = trialDays(progress, progress?._creationTime, now);
    if (daysSince >= TRIAL_DAYS) {
      throw new Error("انتهت فترة التجربة المجانية. فعّل اشتراكك للمتابعة.");
    }
    const w = windowInfo(limits?.randomWindowStart, now);
    const used = w.rolled ? 0 : (limits?.randomUsed ?? 0);
    if (used >= RANDOM_LIMIT) {
      throw new Error("استنفدت استخدامات التمرين العشوائي (3). يعود رصيدك تلقائياً بعد 24 ساعة (بتوقيت الخادم).");
    }
    const next = used + 1;
    if (limits) {
      await ctx.db.patch(limits._id, { randomUsed: next, randomWindowStart: w.windowStart });
    } else {
      await ctx.db.insert("userLimits", {
        userId,
        aiUsed: 0,
        randomUsed: next,
        dailyUsed: 0,
        randomWindowStart: w.windowStart,
      });
    }
    return { allowed: true, remaining: RANDOM_LIMIT - next, resetAt: w.resetAt };
  },
});

// ─── Public consumption of a daily timed session (Today's Timers) ────
// Separate quota (3) from the random exercises, same rolling-24h model.
export const consumeDaily = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const userId = identity.subject;
    const { progress, sub, limits } = await loadState(ctx, userId);
    const now = Date.now();
    const paid = isPaid(sub, now);
    if (paid) return { allowed: true, remaining: null, resetAt: null };
    const daysSince = trialDays(progress, progress?._creationTime, now);
    if (daysSince >= TRIAL_DAYS) {
      throw new Error("انتهت فترة التجربة المجانية. فعّل اشتراكك للمتابعة.");
    }
    const w = windowInfo(limits?.dailyWindowStart, now);
    const used = w.rolled ? 0 : (limits?.dailyUsed ?? 0);
    if (used >= DAILY_LIMIT) {
      throw new Error("استنفدت استخدامات التمرين اليومي (3). يعود رصيدك تلقائياً بعد 24 ساعة (بتوقيت الخادم).");
    }
    const next = used + 1;
    if (limits) {
      await ctx.db.patch(limits._id, { dailyUsed: next, dailyWindowStart: w.windowStart });
    } else {
      await ctx.db.insert("userLimits", {
        userId,
        aiUsed: 0,
        randomUsed: 0,
        dailyUsed: next,
        dailyWindowStart: w.windowStart,
      });
    }
    return { allowed: true, remaining: DAILY_LIMIT - next, resetAt: w.resetAt };
  },
});
