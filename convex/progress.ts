import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// --- Get current user's progress ---
export const get = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const progress = await ctx.db
      .query("userProgress")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .unique();
    return progress ?? null;
  },
});

// --- Quick auth check (no cross-origin HTTP needed) ---
export const getAuth = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    return { userId: identity.subject, email: identity.email, name: identity.name };
  },
});

// --- Get a user's public profile for leaderboard viewing ---
export const getPublicProfile = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const caller = await ctx.auth.getUserIdentity();

    const progress = await ctx.db
      .query("userProgress")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();
    if (!progress) return null;

    if (progress.allowSharing !== true) {
      return { private: true as const, name: progress.name, xp: progress.totalXP };
    }

    const records = await ctx.db
      .query("dailyRecords")
      .withIndex("by_user_date", (q) => q.eq("userId", args.userId))
      .take(365);

    return {
      progress: {
        name: progress.name,
        startDate: progress.startDate,
        currentWeek: progress.currentWeek,
        totalScore: progress.totalScore,
        totalXP: progress.totalXP,
        streak: progress.streak,
        bestStreak: progress.bestStreak,
        totalTimeSeconds: progress.totalTimeSeconds,
      },
      records,
      private: false as const,
    };
  },
});

// --- Toggle sharing permission ---
export const setAllowSharing = mutation({
  args: { allow: v.boolean() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const progress = await ctx.db
      .query("userProgress")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .unique();
    if (progress) {
      await ctx.db.patch(progress._id, { allowSharing: args.allow });
    }
  },
});

// --- Create profile (first login after payment) ---
export const create = mutation({
  args: { name: v.string(), email: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const trimmedName = args.name.trim();
    if (trimmedName.length === 0 || trimmedName.length > 100) {
      throw new Error("Invalid name");
    }
    if (args.email.length > 254 || !args.email.includes("@")) {
      throw new Error("Invalid email");
    }

    const existing = await ctx.db
      .query("userProgress")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .unique();
    if (existing) return existing._id;

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);

    return await ctx.db.insert("userProgress", {
      userId: identity.subject,
      name: trimmedName,
      email: args.email,
      startDate: dateStr,
      currentWeek: 1,
      totalScore: 0,
      totalXP: 0,
      streak: 0,
      bestStreak: 0,
      totalTimeSeconds: 0,
      lastMutationAt: Date.now(),
    });
  },
});

// --- Valid subjects list (server-side allowlist) ---
const VALID_SUBJECTS = new Set([
  "arabic","english","french","math","physics","chemistry",
  "biology","history","geography","civics","philosophy","it",
]);

// --- Update progress after finishing a subject (IMMUTABLE) ---
export const recordFinish = mutation({
  args: {
    dateISO: v.string(),
    subject: v.string(),
    score: v.number(),
    timeSeconds: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // --- Input validation ---
    if (args.score < 0 || args.score > 100) throw new Error("Invalid score");
    if (args.timeSeconds < 0 || args.timeSeconds > 86400) throw new Error("Invalid time");
    if (args.dateISO.length !== 10) throw new Error("Invalid date");
    if (!VALID_SUBJECTS.has(args.subject)) throw new Error("Invalid subject");

    // --- Date bounds: only today or yesterday allowed ---
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (args.dateISO !== today && args.dateISO !== yesterday) {
      throw new Error("Date must be today or yesterday");
    }

    const userId = identity.subject;

    // --- Rate limit: 3 seconds cooldown between submissions ---
    const userProgress = await ctx.db
      .query("userProgress")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (userProgress && userProgress.lastMutationAt) {
      const elapsed = Date.now() - userProgress.lastMutationAt;
      if (elapsed < 3000) {
        throw new Error("Too fast, please wait before submitting again");
      }
    }

    // --- Check if record already exists and is FINISHED (immutable) ---
    const existing = await ctx.db
      .query("dailyRecords")
      .withIndex("by_user_date_subject", (q) =>
        q.eq("userId", userId).eq("dateISO", args.dateISO).eq("subject", args.subject)
      )
      .unique();

    // If record exists and already has a score → IMMUTABLE, reject
    if (existing && typeof existing.score === "number") {
      throw new Error("Score already recorded for this subject on this date");
    }

    // XP per record
    const xp = args.score * 10;

    if (existing) {
      // Record exists but no score yet (timer was running) → finalize it
      await ctx.db.patch(existing._id, {
        score: args.score,
        timeSeconds: args.timeSeconds,
        timerStatus: "finished",
        runningSince: undefined,
      });
    } else {
      // New record
      await ctx.db.insert("dailyRecords", {
        userId,
        dateISO: args.dateISO,
        subject: args.subject,
        score: args.score,
        timeSeconds: args.timeSeconds,
        timerStatus: "finished",
      });
    }

    // --- Recalculate user totals from scratch (immune to manipulation) ---
    const progress = await ctx.db
      .query("userProgress")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (!progress) return;

    const allRecords = await ctx.db
      .query("dailyRecords")
      .withIndex("by_user_date", (q) => q.eq("userId", userId))
      .take(365);

    // Sum all scores and XP from actual records (not additive)
    let totalScore = 0;
    let totalXP = 0;
    let totalTimeSeconds = 0;
    const streakDays = new Set<string>();

    for (const rec of allRecords) {
      if (typeof rec.score === "number") {
        totalScore += rec.score;
        totalXP += rec.score * 10;
        // Only count days with ACTUAL completed scores for streak
        streakDays.add(rec.dateISO);
      }
      if (typeof rec.timeSeconds === "number") {
        totalTimeSeconds += rec.timeSeconds;
      }
    }

    const streak = computeStreak(streakDays);
    const bestStreak = Math.max(progress.bestStreak, streak);

    await ctx.db.patch(progress._id, {
      totalScore,
      totalXP,
      streak,
      bestStreak,
      totalTimeSeconds,
      lastMutationAt: Date.now(),
    });
  },
});

// --- Timer actions ---
export const startTimer = mutation({
  args: { dateISO: v.string(), subject: v.string(), viaRandom: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    if (!VALID_SUBJECTS.has(args.subject)) throw new Error("Invalid subject");

    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (args.dateISO !== today && args.dateISO !== yesterday) {
      throw new Error("Date must be today or yesterday");
    }

    const userId = identity.subject;

    const existing = await ctx.db
      .query("dailyRecords")
      .withIndex("by_user_date_subject", (q) =>
        q.eq("userId", userId).eq("dateISO", args.dateISO).eq("subject", args.subject)
      )
      .unique();

    if (existing && existing.timerStatus && existing.timerStatus !== "idle") return;

    if (existing) {
      await ctx.db.patch(existing._id, {
        timerStatus: "running",
        runningSince: Date.now(),
      });
    } else {
      await ctx.db.insert("dailyRecords", {
        userId,
        dateISO: args.dateISO,
        subject: args.subject,
        timerStatus: "running",
        runningSince: Date.now(),
        viaRandom: args.viaRandom,
      });
    }
  },
});

export const pauseTimer = mutation({
  args: { dateISO: v.string(), subject: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const record = await ctx.db
      .query("dailyRecords")
      .withIndex("by_user_date_subject", (q) =>
        q.eq("userId", identity.subject).eq("dateISO", args.dateISO).eq("subject", args.subject)
      )
      .unique();

    if (!record || record.timerStatus !== "running") return;

    const elapsed = record.runningSince
      ? (record.timeSeconds ?? 0) + Math.floor((Date.now() - record.runningSince) / 1000)
      : record.timeSeconds ?? 0;

    await ctx.db.patch(record._id, {
      timerStatus: "paused",
      timeSeconds: elapsed,
      runningSince: undefined,
    });
  },
});

export const resumeTimer = mutation({
  args: { dateISO: v.string(), subject: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const record = await ctx.db
      .query("dailyRecords")
      .withIndex("by_user_date_subject", (q) =>
        q.eq("userId", identity.subject).eq("dateISO", args.dateISO).eq("subject", args.subject)
      )
      .unique();

    if (!record || record.timerStatus !== "paused") return;

    await ctx.db.patch(record._id, {
      timerStatus: "running",
      runningSince: Date.now(),
    });
  },
});

// --- Get all records for a user (for Profile/Dashboard) ---
export const getRecords = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    return await ctx.db
      .query("dailyRecords")
      .withIndex("by_user_date", (q) => q.eq("userId", identity.subject))
      .take(365);
  },
});

// --- Helper: compute streak ---
function computeStreak(days: Set<string>): number {
  if (days.size === 0) return 0;
  const sorted = Array.from(days).sort().reverse();
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  if (sorted[0] !== today && sorted[0] !== yesterday) return 0;

  let streak = 1;
  for (let i = 0; i < sorted.length - 1; i++) {
    const curr = new Date(sorted[i]);
    const prev = new Date(sorted[i + 1]);
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86400000);
    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}
