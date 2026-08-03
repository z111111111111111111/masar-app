import { query, mutation, internalMutation, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// Referral system:
// - Every user gets a unique ~10-char code (server-generated, tamper-proof).
// - A referral code is recorded when a new user signs up through someone's link
//   (attribution happens at signup, inside progress.create).
// - Counters are derived from referralEvents: "registered" = signed up through
//   the link, "paid" = that invitee later paid (counts toward the reward).
// - Reward: 5000 DZD per 10 paying invitees (payout is manual/out of scope).

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
const CODE_LENGTH = 10;
const REWARD_TARGET = 10;
const REWARD_DZD = 5000;

function randomCode(): string {
  let out = "";
  const len = CODE_ALPHABET.length;
  for (let i = 0; i < CODE_LENGTH; i++) {
    out += CODE_ALPHABET[Math.floor(Math.random() * len)];
  }
  return out;
}

async function uniqueCode(ctx: { db: MutationCtx["db"] }): Promise<string> {
  for (let i = 0; i < 20; i++) {
    const code = randomCode();
    const hit = await ctx.db
      .query("referralCodes")
      .withIndex("by_code", (q) => q.eq("code", code))
      .unique();
    if (!hit) return code;
  }
  throw new Error("Could not generate a unique referral code");
}

// Called by progress.create right after the profile is created.
export const ensureCode = internalMutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("referralCodes")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();
    if (existing) return existing.code;
    const code = await uniqueCode(ctx);
    await ctx.db.insert("referralCodes", { userId: args.userId, code });
    return code;
  },
});

// Called by progress.create when a new user signed up through a referral link.
// Records the attribution once (first code wins); invalid or self codes are
// silently ignored so profile creation never fails because of a bad link.
export const recordReferral = internalMutation({
  args: { referredUserId: v.string(), code: v.string() },
  handler: async (ctx, args) => {
    if (args.code.length < 5 || args.code.length > 40) return;
    const existing = await ctx.db
      .query("referralEvents")
      .withIndex("by_referredUserId", (q) => q.eq("referredUserId", args.referredUserId))
      .unique();
    if (existing) return;
    const codeDoc = await ctx.db
      .query("referralCodes")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .unique();
    if (!codeDoc) return;
    if (codeDoc.userId === args.referredUserId) return;
    await ctx.db.insert("referralEvents", {
      referredUserId: args.referredUserId,
      referrerUserId: codeDoc.userId,
      status: "registered",
    });
  },
});

// Called by adminActivate when an invitee pays — flips their attribution to
// "paid" so it counts toward the referrer's reward (even if they signed up
// days before paying).
export const markPaid = internalMutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const events = await ctx.db
      .query("referralEvents")
      .withIndex("by_referredUserId", (q) => q.eq("referredUserId", args.userId))
      .take(200);
    for (const ev of events) {
      if (ev.status !== "paid") {
        await ctx.db.patch(ev._id, { status: "paid", paidAt: Date.now() });
      }
    }
  },
});

// Public claim for accounts created before referral codes existed: mints the
// code on demand so every existing user can start inviting right away.
export const claimMyCode = mutation({
  args: {},
  handler: async (ctx): Promise<string> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    return await ctx.runMutation(internal.referrals.ensureCode, { userId: identity.subject });
  },
});

// Profile section: my code, share link and both counters.
export const getMyStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const userId = identity.subject;
    const codeDoc = await ctx.db
      .query("referralCodes")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!codeDoc) return null;
    const events = await ctx.db
      .query("referralEvents")
      .withIndex("by_referrerUserId", (q) => q.eq("referrerUserId", userId))
      .take(500);
    const paid = events.filter((e) => e.status === "paid").length;
    const siteUrl = process.env.SITE_URL ?? "https://masarlearn.vercel.app";
    return {
      code: codeDoc.code,
      link: `${siteUrl}/?ref=${codeDoc.code}`,
      registered: events.length,
      paid,
      rewardTarget: REWARD_TARGET,
      rewardAmountDZD: REWARD_DZD,
    };
  },
});
