import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Better Auth manages its own tables: user, session, account, verification

  // --- Subscriptions ---
  subscriptions: defineTable({
    userId: v.string(),
    plan: v.string(),
    status: v.union(v.literal("active"), v.literal("inactive")),
    amount: v.number(),
    paidAt: v.string(),
    expiresAt: v.string(),
    paymentId: v.optional(v.string()),
  }).index("by_userId", ["userId"])
    .index("by_paymentId", ["paymentId"]),

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
    allowSharing: v.optional(v.boolean()),
    lastMutationAt: v.optional(v.number()),
  }).index("by_userId", ["userId"])
    .index("by_xp", ["totalXP"]),

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
});
