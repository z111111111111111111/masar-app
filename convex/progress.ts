import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// ─── Hearts economy ─────────────────────────────────────────────
export const MAX_HEARTS = 15;
export const HEART_REFILL_MS = 10 * 60 * 60 * 1000; // 1 heart every 10 hours
export const FULL_REFILL_COST = 50; // refilling all 15 hearts costs 50 jewels
export const STAGE_REWARD = 100; // jewels earned for passing a stage
const STAGES = new Set(["derivative", "derivative-2", "derivative-3"]);

// Roadmap stage progress ids (server-side, tamper-proof). During the free
// trial only the first stage of each subject may be completed.
const ROADMAP_STAGES = new Set(["s1", "s2", "s3"]);
const FIRST_ROADMAP_STAGES = new Set(["s1"]);

// Roadmap stage ↔ lesson flow mapping. markStagePassed and awardStageCompletion
// share these maps so a stage can't be awarded without completing the
// prerequisite roadmap stage, and no stage can be skipped by calling the
// mutation directly.
const STAGE_FLOW: Record<string, string> = {
  s1: "derivative",
  s2: "derivative-2",
  s3: "derivative-3",
};
const FLOW_STAGE: Record<string, string> = {
  derivative: "s1",
  "derivative-2": "s2",
  "derivative-3": "s3",
};
const STAGE_PREREQ: Record<string, string | null> = {
  s1: null,
  s2: "s1",
  s3: "s2",
};

// A stage may only be completed/rewarded when its flow session was started on
// the server at least MIN_FLOW_TIME_MS ago and at most MAX_FLOW_TIME_MS ago
// (prevents "instant done" claims; the session is (re)started by startFlow).
const MIN_FLOW_TIME_MS = 20_000;
const MAX_FLOW_TIME_MS = 6 * 60 * 60 * 1000;

// Progress up to `now`: hearts regenerate 1 per 10h, capped at MAX_HEARTS.
function reconcileHearts(
  storedHearts: number | undefined,
  lastHeartAt: number | undefined,
  now: number
): { hearts: number; lastHeartAt: number } {
  const stored = typeof storedHearts === "number" && storedHearts >= 0 ? storedHearts : MAX_HEARTS;
  const base = typeof lastHeartAt === "number" ? lastHeartAt : now;
  const gained = Math.max(0, Math.floor((now - base) / HEART_REFILL_MS));
  const hearts = Math.min(MAX_HEARTS, stored + gained);
  // Advance the countdown base by whole regeneration periods; when full the
  // countdown starts from "now" so hearts never accumulate past the cap.
  const advanced = gained > 0 ? base + gained * HEART_REFILL_MS : base;
  return { hearts, lastHeartAt: hearts >= MAX_HEARTS ? now : advanced };
}

function heartRefillCost(heartsToAdd: number): number {
  return Math.ceil((heartsToAdd * FULL_REFILL_COST) / MAX_HEARTS);
}

// --- Hearts snapshot (server clock is authoritative; the client countdown
// extrapolates silently from lastHeartAt/serverNow, so no per-tick re-query) ---
export const getHearts = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const progress = await ctx.db
      .query("userProgress")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .unique();
    if (!progress) return null;
    const { hearts, lastHeartAt } = reconcileHearts(progress.hearts, progress.lastHeartAt, Date.now());
    const missing = Math.max(0, MAX_HEARTS - hearts);
    return {
      hearts,
      maxHearts: MAX_HEARTS,
      lastHeartAt,
      refillMs: HEART_REFILL_MS,
      nextRefillAt: hearts < MAX_HEARTS ? lastHeartAt + HEART_REFILL_MS : null,
      fullRefillCost: FULL_REFILL_COST,
      refillCost: heartRefillCost(missing),
      jewels: progress.jewels ?? 20,
      serverNow: Date.now(),
    };
  },
});

// --- Lose a heart on a wrong answer ---
export const loseHeart = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const progress = await ctx.db
      .query("userProgress")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .unique();
    if (!progress) throw new Error("Profile not found");
    const now = Date.now();
    const { hearts } = reconcileHearts(progress.hearts, progress.lastHeartAt, now);
    const next = Math.max(0, hearts - 1);
    await ctx.db.patch(progress._id, { hearts: next, lastHeartAt: now });
    return { hearts: next };
  },
});

// --- Refill hearts with jewels: each heart costs proportionally so the full
// 15-heart recharge is exactly FULL_REFILL_COST (50) jewels. ---
export const refillHearts = mutation({
  args: { hearts: v.number() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    if (!Number.isInteger(args.hearts) || args.hearts < 1 || args.hearts > MAX_HEARTS) {
      throw new Error("Invalid hearts");
    }
    const progress = await ctx.db
      .query("userProgress")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .unique();
    if (!progress) throw new Error("Profile not found");
    const now = Date.now();
    const { hearts } = reconcileHearts(progress.hearts, progress.lastHeartAt, now);
    const fill = Math.min(args.hearts, Math.max(0, MAX_HEARTS - hearts));
    const cost = heartRefillCost(fill);
    const balance = progress.jewels ?? 20;
    if (balance < cost) throw new Error("Insufficient jewels");
    await ctx.db.patch(progress._id, {
      hearts: hearts + fill,
      lastHeartAt: now,
      jewels: balance - cost,
      lastMutationAt: now,
    });
    return { hearts: hearts + fill, jewels: balance - cost };
  },
});

// --- Award 100 jewels once per passed stage (deduplicated server-side) ---
export const awardStageCompletion = mutation({
  args: { stageId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const stageId = args.stageId.trim();
    if (!STAGES.has(stageId)) throw new Error("Invalid stage");
    const progress = await ctx.db
      .query("userProgress")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .unique();
    if (!progress) throw new Error("Profile not found");

    // Don't award a later stage before the previous roadmap stage is done.
    const roadmapStage = FLOW_STAGE[stageId];
    const prereq = roadmapStage ? STAGE_PREREQ[roadmapStage] : null;
    const completed = progress.completedStages ?? [];
    if (prereq && !completed.includes(prereq)) {
      throw new Error("أكمل المرحلة السابقة أولاً");
    }

    // Proof of work: the flow session must have been started server-side within
    // the valid window and must not already be spent (finishedAt).
    const session = await ctx.db
      .query("flowSessions")
      .withIndex("by_user_flow", (q) => q.eq("userId", identity.subject).eq("flow", stageId))
      .unique();
    const now = Date.now();
    const elapsed = session ? now - session.startedAt : 0;
    if (!session || elapsed < MIN_FLOW_TIME_MS || elapsed > MAX_FLOW_TIME_MS) {
      throw new Error("لم يتم العثور على جلسة تمرين نشطة لهذه المرحلة.");
    }
    if (session.finishedAt) {
      throw new Error("تمت مكافأة هذه الجلسة مسبقاً.");
    }

    const rewarded = progress.rewardedStages ?? [];
    if (rewarded.includes(stageId)) return { jewels: progress.jewels ?? 20, awarded: false };
    const newBalance = (progress.jewels ?? 20) + STAGE_REWARD;
    await ctx.db.patch(progress._id, {
      rewardedStages: [...rewarded, stageId],
      jewels: newBalance,
      lastMutationAt: now,
    });
    await ctx.db.patch(session._id, { finishedAt: now });
    return { jewels: newBalance, awarded: true };
  },
});

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
        totalScore: progress.totalScore,
        totalXP: progress.totalXP,
        streak: progress.streak,
        bestStreak: progress.bestStreak,
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
  args: { name: v.string(), referralCode: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Server-side backstop for the signup name. The client enforces letters
    // only + max 20 chars with visible messages; here we strip anything that
    // isn't a letter or space, collapse runs of spaces and cap at 20 chars so
    // a tampered client (or Google sign-up name) can never reach the leader-
    // board as-is. Fall back to a generic label if nothing survives.
    const name =
      args.name
        .trim()
        .replace(/[^\p{L}\p{M}\s]/gu, "")
        .replace(/\s+/g, " ")
        .slice(0, 20) || "طالب";

    const email = identity.email ?? "";
    if (email.length > 254 || !email.includes("@")) {
      throw new Error("Invalid email");
    }

    const existing = await ctx.db
      .query("userProgress")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .unique();
    if (existing) return existing._id;

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);

    const profileId = await ctx.db.insert("userProgress", {
      userId: identity.subject,
      name,
      email: email,
      startDate: dateStr,
      currentWeek: 1,
      totalScore: 0,
      totalXP: 0,
      streak: 0,
      bestStreak: 0,
      totalTimeSeconds: 0,
      jewels: 20,
      hearts: MAX_HEARTS,
      lastHeartAt: Date.now(),
      rewardedStages: [],
      lastMutationAt: Date.now(),
      signedUpAt: Date.now(),
      completedStages: [],
    });

    // Server-side referral setup: mint this user's own code and (if they came
    // through a link) record the attribution at signup time.
    await ctx.runMutation(internal.referrals.ensureCode, { userId: identity.subject });
    const referralCode = args.referralCode?.trim();
    if (referralCode) {
      await ctx.runMutation(internal.referrals.recordReferral, {
        referredUserId: identity.subject,
        code: referralCode,
      });
    }

    return profileId;
  },
});

// --- Announce that a lesson flow started (server-side proof-of-work) ---
// (Re)starts the flow session so a stage can only be completed/rewarded after
// the student actually began the lesson. Called by the lesson when it starts.
export const startFlow = mutation({
  args: { flow: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    if (!STAGES.has(args.flow)) throw new Error("Invalid flow");
    const now = Date.now();
    const existing = await ctx.db
      .query("flowSessions")
      .withIndex("by_user_flow", (q) => q.eq("userId", identity.subject).eq("flow", args.flow))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { startedAt: now, finishedAt: undefined });
    } else {
      await ctx.db.insert("flowSessions", {
        userId: identity.subject,
        flow: args.flow,
        startedAt: now,
      });
    }
  },
});

// --- Mark a roadmap stage as passed (server-side, tamper-proof) ---
export const markStagePassed = mutation({
  args: { stageId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const stageId = args.stageId.trim();
    if (!ROADMAP_STAGES.has(stageId)) throw new Error("Invalid stage");
    const progress = await ctx.db
      .query("userProgress")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .unique();
    if (!progress) throw new Error("Profile not found");

    // Free trial users may only complete the first stage of a subject.
    const status = await ctx.runQuery(internal.entitlements.getStatus, { userId: identity.subject });
    if (!status.paid && !FIRST_ROADMAP_STAGES.has(stageId)) {
      throw new Error("هذه المرحلة مقفلة في النسخة المجانية. فعّل اشتراكك لفتح كل المراحل.");
    }

    // Stages must be completed in order (no skipping s2/s3 via direct calls).
    const prereq = STAGE_PREREQ[stageId];
    const completed = progress.completedStages ?? [];
    if (prereq && !completed.includes(prereq)) {
      throw new Error("أكمل المرحلة السابقة أولاً");
    }
    if (completed.includes(stageId)) {
      return { completedStages: completed };
    }

    // Proof of work: the lesson flow for this stage must have been started
    // server-side within the valid window (no instant "done").
    const flow = STAGE_FLOW[stageId];
    const session = flow
      ? await ctx.db
          .query("flowSessions")
          .withIndex("by_user_flow", (q) => q.eq("userId", identity.subject).eq("flow", flow))
          .unique()
      : null;
    const now = Date.now();
    const elapsed = session ? now - session.startedAt : 0;
    if (!session || elapsed < MIN_FLOW_TIME_MS || elapsed > MAX_FLOW_TIME_MS) {
      throw new Error("لم يتم العثور على جلسة تمرين نشطة لهذه المرحلة.");
    }

    await ctx.db.patch(progress._id, {
      completedStages: [...completed, stageId],
      lastMutationAt: now,
    });
    return { completedStages: [...completed, stageId] };
  },
});

// --- Spend jewels (hints / AI in exercises) ---
export const spendJewels = mutation({
  args: { amount: v.number() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    if (!Number.isInteger(args.amount) || args.amount <= 0 || args.amount > 100) {
      throw new Error("Invalid amount");
    }
    const progress = await ctx.db
      .query("userProgress")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .unique();
    if (!progress) throw new Error("Profile not found");
    // Users created before the jewels field existed have it missing → treat as the
    // initial balance and backfill on the first spend.
    const current = progress.jewels ?? 20;
    if (current < args.amount) throw new Error("Insufficient jewels");
    await ctx.db.patch(progress._id, { jewels: current - args.amount });
    return current - args.amount;
  },
});

// --- Valid subjects list (server-side allowlist) ---
const VALID_SUBJECTS = new Set([
  "math","physics","nature","philo","social",
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
    if (args.timeSeconds < 0 || args.timeSeconds > 3600) throw new Error("Invalid time");
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

    // --- Race condition fix: pause any other running timer first ---
    if (existing && existing.timerStatus && existing.timerStatus !== "idle") return;

    const runningTimers = await ctx.db
      .query("dailyRecords")
      .withIndex("by_user_date", (q) => q.eq("userId", userId))
      .collect();

    for (const rec of runningTimers) {
      if (rec.timerStatus === "running" && rec._id !== existing?._id) {
        const elapsed = rec.runningSince
          ? (rec.timeSeconds ?? 0) + Math.floor((Date.now() - rec.runningSince) / 1000)
          : rec.timeSeconds ?? 0;
        await ctx.db.patch(rec._id, {
          timerStatus: "paused",
          timeSeconds: elapsed,
          runningSince: undefined,
        });
      }
    }

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
