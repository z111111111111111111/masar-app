import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Lesson flow allowlist — add new lesson flows here.
const FLOWS = new Set(["derivative", "derivative-2", "derivative-3", "derivative-4", "derivative-5"]);

// Exercise kinds — matches ExerciseData['kind'] in the client.
const KINDS = new Set(["mcq", "rule", "fill", "truefalse", "sort"]);

// --- Record a wrong answer (append the mistake for the current student) ---
// The `correctAnswer` is stored on first insert and never overwritten:
// later wrong attempts only bump `attemptCount`. All writes are scoped to the
// authenticated user server-side — no user identifier is accepted as an argument.
export const recordMistake = mutation({
  args: {
    flow: v.string(),
    flowIndex: v.number(),
    kind: v.string(),
    correctAnswer: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    if (!FLOWS.has(args.flow)) throw new Error("Invalid flow");
    if (!Number.isInteger(args.flowIndex) || args.flowIndex < 0 || args.flowIndex > 200) {
      throw new Error("Invalid flowIndex");
    }
    if (!KINDS.has(args.kind)) throw new Error("Invalid kind");
    if (args.correctAnswer.length === 0 || args.correctAnswer.length > 2000) {
      throw new Error("Invalid answer");
    }

    const userId = identity.subject;

    const existing = await ctx.db
      .query("exerciseMistakes")
      .withIndex("by_user_flow_index", (q) =>
        q.eq("userId", userId).eq("flow", args.flow).eq("flowIndex", args.flowIndex)
      )
      .unique();

    if (existing) {
      // correctAnswer stays immutable — only the attempt counter is updated.
      await ctx.db.patch(existing._id, { attemptCount: existing.attemptCount + 1 });
    } else {
      await ctx.db.insert("exerciseMistakes", {
        userId,
        flow: args.flow,
        flowIndex: args.flowIndex,
        kind: args.kind,
        correctAnswer: args.correctAnswer,
        attemptCount: 1,
        resolved: false,
      });
    }
  },
});

// --- Mark a mistake as corrected (server-side, own records only) ---
export const resolveMistake = mutation({
  args: { flow: v.string(), flowIndex: v.number() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    if (!FLOWS.has(args.flow)) throw new Error("Invalid flow");
    if (!Number.isInteger(args.flowIndex) || args.flowIndex < 0 || args.flowIndex > 200) {
      throw new Error("Invalid flowIndex");
    }

    const existing = await ctx.db
      .query("exerciseMistakes")
      .withIndex("by_user_flow_index", (q) =>
        q.eq("userId", identity.subject).eq("flow", args.flow).eq("flowIndex", args.flowIndex)
      )
      .unique();

    if (existing && !existing.resolved) {
      await ctx.db.patch(existing._id, { resolved: true, resolvedAt: Date.now() });
    }
  },
});

// --- Fetch the exercises the student answered wrong (unresolved) for a flow ---
export const getUnresolved = query({
  args: { flow: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    if (!FLOWS.has(args.flow)) return [];

    const rows = await ctx.db
      .query("exerciseMistakes")
      .withIndex("by_user_flow", (q) => q.eq("userId", identity.subject).eq("flow", args.flow))
      .take(200);

    return rows
      .filter((r) => !r.resolved)
      .sort((a, b) => a.flowIndex - b.flowIndex)
      .map((r) => ({ flowIndex: r.flowIndex, kind: r.kind, correctAnswer: r.correctAnswer }));
  },
});

// --- Start a fresh attempt: clear this session's unresolved mistakes ---
// Resolved records (history) are kept; only pending mistakes from previous
// sessions are cleared so each entry begins a full exercise set from scratch.
export const resetSession = mutation({
  args: { flow: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    if (!FLOWS.has(args.flow)) throw new Error("Invalid flow");

    const rows = await ctx.db
      .query("exerciseMistakes")
      .withIndex("by_user_flow", (q) => q.eq("userId", identity.subject).eq("flow", args.flow))
      .take(200);

    for (const row of rows) {
      if (!row.resolved) await ctx.db.delete("exerciseMistakes", row._id);
    }
  },
});
