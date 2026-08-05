import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Better Auth manages its own tables: user, session, account, verification

  // --- Subscriptions ---
  // status: "pending" = payment requested, awaiting admin confirmation.
  // "active" = paid & within window. "inactive" = expired/revoked.
  subscriptions: defineTable({
    userId: v.string(),
    plan: v.string(),
    status: v.union(v.literal("active"), v.literal("inactive"), v.literal("pending")),
    amount: v.number(),
    paidAt: v.optional(v.union(v.number(), v.string())),
    expiresAt: v.string(),
    paymentId: v.optional(v.string()),
    paymentRef: v.optional(v.string()),
    requestedAt: v.optional(v.number()),
    checkoutId: v.optional(v.string()),
  }).index("by_userId", ["userId"])
    .index("by_paymentId", ["paymentId"])
    .index("by_status", ["status"]),

  // --- Chargily Pay checkouts (server-side record of created payments) ---
  // One row per checkout created for a user. `checkoutId` is Chargily's id and
  // `checkoutUrl` is the redirect URL we open in the new tab. Status is updated
  // only from verified webhook events (never from the browser success redirect),
  // and paid activation is idempotent so replayed/delayed webhooks are harmless.
  paymentCheckouts: defineTable({
    userId: v.string(),
    checkoutId: v.string(),
    checkoutUrl: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("paid"),
      v.literal("failed"),
      v.literal("canceled"),
      v.literal("refunded")
    ),
    amount: v.number(),
    currency: v.string(),
    plan: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_userId", ["userId"])
    .index("by_checkoutId", ["checkoutId"])
    .index("by_status", ["status"]),

  // --- User Progress ---
  userProgress: defineTable({
    userId: v.string(),
    name: v.string(),
    email: v.string(),
    startDate: v.string(),
    currentWeek: v.number(),
    totalScore: v.number(),
    totalXP: v.number(),
    streak: v.number(),
    bestStreak: v.number(),
    totalTimeSeconds: v.number(),
    jewels: v.optional(v.number()),
    hearts: v.optional(v.number()),
    lastHeartAt: v.optional(v.number()),
    rewardedStages: v.optional(v.array(v.string())),
    allowSharing: v.optional(v.boolean()),
    isVerified: v.optional(v.boolean()),
    lastMutationAt: v.optional(v.number()),
    signedUpAt: v.optional(v.number()),
    completedStages: v.optional(v.array(v.string())),
  }).index("by_userId", ["userId"])
    .index("by_xp", ["totalXP"]),

  // --- Free-trial usage counters (high-churn, kept separate from progress) ---
  // aiUsed/randomUsed/dailyUsed are per rolling 24h window whose start is stored
  // in aiWindowStart/randomWindowStart/dailyWindowStart (server clock).
  // aiLastAt/aiRateCount/aiRateStart back the per-user AI rate limiter
  // (cooldown between calls + hourly cap) that applies to paid accounts too.
  userLimits: defineTable({
    userId: v.string(),
    aiUsed: v.number(),
    randomUsed: v.number(),
    dailyUsed: v.optional(v.number()),
    aiWindowStart: v.optional(v.number()),
    randomWindowStart: v.optional(v.number()),
    dailyWindowStart: v.optional(v.number()),
    aiLastAt: v.optional(v.number()),
    aiRateCount: v.optional(v.number()),
    aiRateStart: v.optional(v.number()),
  }).index("by_userId", ["userId"]),

  // --- Referral codes (one per user, server-generated, tamper-proof) ---
  referralCodes: defineTable({
    userId: v.string(),
    code: v.string(),
  }).index("by_userId", ["userId"])
    .index("by_code", ["code"]),

  // --- Referral attribution events (one per referred user) ---
  // status: "registered" = signed up through the referrer's link.
  // "paid" = that invitee later paid (counts toward the 5000 DZD reward).
  referralEvents: defineTable({
    referredUserId: v.string(),
    referrerUserId: v.string(),
    status: v.union(v.literal("registered"), v.literal("paid")),
    paidAt: v.optional(v.number()),
  }).index("by_referredUserId", ["referredUserId"])
    .index("by_referrerUserId", ["referrerUserId"]),

  // --- Daily Records ---
  dailyRecords: defineTable({
    userId: v.string(),
    dateISO: v.string(),
    subject: v.string(),
    score: v.optional(v.number()),
    timeSeconds: v.optional(v.number()),
    timerStatus: v.optional(v.string()),
    runningSince: v.optional(v.number()),
    viaRandom: v.optional(v.boolean()),
  }).index("by_user_date", ["userId", "dateISO"])
    .index("by_user_subject", ["userId", "subject"])
    .index("by_user_date_subject", ["userId", "dateISO", "subject"]),

  // --- Exercise Bank (shared content) ---
  exerciseBank: defineTable({
    subject: v.string(),
    weekNumber: v.number(),
    lessonNumber: v.number(),
    difficulty: v.union(v.literal("easy"), v.literal("medium"), v.literal("hard")),
    title: v.string(),
    statement: v.string(),
    correction: v.optional(v.string()),
    estimatedMinutes: v.number(),
  }).index("by_subject_week", ["subject", "weekNumber"]),

  // --- Corrector Conversations ---
  correctorConversations: defineTable({
    userId: v.string(),
    title: v.string(),
    createdAt: v.number(),
    deleted: v.optional(v.boolean()),
  }).index("by_userId", ["userId"]),

  // --- Corrector Chat Messages ---
  correctorMessages: defineTable({
    userId: v.string(),
    conversationId: v.optional(v.id("correctorConversations")),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    createdAt: v.number(),
  }).index("by_conversation", ["conversationId"])
    .index("by_userId", ["userId"]),

  // --- Per-student lesson exercise mistakes (wrong materials + correct answers) ---
  // Each record is owned by the authenticated student; `correctAnswer` is written
  // once at creation and never modified afterwards (server-side only).
  exerciseMistakes: defineTable({
    userId: v.string(),
    flow: v.string(),
    flowIndex: v.number(),
    kind: v.string(),
    correctAnswer: v.string(),
    attemptCount: v.number(),
    resolved: v.boolean(),
    resolvedAt: v.optional(v.number()),
  }).index("by_user_flow", ["userId", "flow"])
    .index("by_user_flow_index", ["userId", "flow", "flowIndex"])
    .index("by_user_flow_resolved", ["userId", "flow", "resolved"]),

  // --- Lesson flow proof-of-work sessions (gate stage completion + rewards) ---
  // `startedAt` is (re)set server-side whenever the student begins a lesson flow;
  // `awardStageCompletion` marks the session spent via `finishedAt` so each run
  // can only be rewarded once.
  flowSessions: defineTable({
    userId: v.string(),
    flow: v.string(),
    startedAt: v.number(),
    finishedAt: v.optional(v.number()),
  }).index("by_user_flow", ["userId", "flow"]),
});
