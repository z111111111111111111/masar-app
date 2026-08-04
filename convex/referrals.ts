import { query, mutation, internalMutation, type MutationCtx, type QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// Referral system:
// - A code is minted only for users who are BOTH verified AND actively
//   subscribed (see eligibility below). No code is ever created for a
//   free/unverified account, so an invite link can't exist before payment.
// - A referral code is recorded when a new user signs up through someone's link
//   (attribution happens at signup, inside progress.create). Attribution is only
//   recorded if the referrer is eligible AT THAT MOMENT.
// - Counters are derived from referralEvents: "registered" = signed up through
//   the link, "paid" = that invitee later paid (counts toward the reward). A
//   "registered" event only advances to "paid" if the referrer is still
//   eligible when the invitee's payment is confirmed.
// - Reward: 5000 DZD per 10 paying invitees (payout is manual/out of scope).

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
const CODE_LENGTH = 10;
const REWARD_TARGET = 10;
const REWARD_DZD = 5000;

// ─── Referral eligibility ──────────────────────────────────────────
// Only accounts that are verified (owner-granted badge) AND actively paid may
// promote/refer. The check lives here server-side (not in the UI) so a tampered
// client can't mint a code, read a link or earn reward credit for an account
// that hasn't been verified and paid.
type DbCtx = { db: MutationCtx["db"] | QueryCtx["db"] };

async function eligibility(ctx: DbCtx, userId: string): Promise<{ verified: boolean; paid: boolean; ok: boolean }> {
  const progress = await ctx.db
    .query("userProgress")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .unique();
  const sub = await ctx.db
    .query("subscriptions")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .unique();
  const verified = progress?.isVerified === true;
  const paid = !!sub && sub.status === "active" && new Date(sub.expiresAt).getTime() > Date.now();
  return { verified, paid, ok: verified && paid };
}

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

// Mints a code for a user. Only ever reached through claimMyCode (which enforces
// verified+paid eligibility) — signup no longer mints codes for everyone.
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
    // Anti-abuse: only verified+paid accounts run a referral program, so a
    // signup is only attributed to a referrer who is eligible at this moment.
    const { ok } = await eligibility(ctx, codeDoc.userId);
    if (!ok) return;
    await ctx.db.insert("referralEvents", {
      referredUserId: args.referredUserId,
      referrerUserId: codeDoc.userId,
      status: "registered",
    });
  },
});

// Called by adminActivate when an invitee pays — flips their attribution to
// "paid" so it counts toward the referrer's reward (even if they signed up
// days before paying). Reward credit is only given if the referrer is STILL
// verified+paid at confirmation time, so an account that lapsed or lost its
// verification in between can't accumulate reward credit.
export const markPaid = internalMutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const events = await ctx.db
      .query("referralEvents")
      .withIndex("by_referredUserId", (q) => q.eq("referredUserId", args.userId))
      .take(200);
    for (const ev of events) {
      if (ev.status === "paid") continue;
      const { ok } = await eligibility(ctx, ev.referrerUserId);
      if (!ok) continue;
      await ctx.db.patch(ev._id, { status: "paid", paidAt: Date.now() });
    }
  },
});

// Public claim for accounts created before referral codes existed: mints the
// code on demand, but ONLY for accounts that are verified and paid. Everyone
// else gets a hard server-side rejection (no code is ever created for them).
export const claimMyCode = mutation({
  args: {},
  handler: async (ctx): Promise<string> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const { ok } = await eligibility(ctx, identity.subject);
    if (!ok) {
      throw new Error("الإحالة والترويج متاحان فقط للحسابات الموثّقة والمدفوعة الاشتراك.");
    }
    return await ctx.runMutation(internal.referrals.ensureCode, { userId: identity.subject });
  },
});

// Profile section: my code, share link and both counters. Blocked accounts get
// an explicit `blocked` result (never the code/link) so the UI can explain the
// requirement instead of silently showing nothing.
export const getMyStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const userId = identity.subject;
    const { ok, verified, paid: subscribed } = await eligibility(ctx, userId);

    const blockedResult = {
      blocked: true,
      verified,
      subscribed,
      code: null as string | null,
      link: null as string | null,
      registered: 0,
      paid: 0,
      rewardTarget: REWARD_TARGET,
      rewardAmountDZD: REWARD_DZD,
    };
    if (!ok) return blockedResult;

    const codeDoc = await ctx.db
      .query("referralCodes")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!codeDoc) {
      // Eligible but code not minted yet → the client calls claimMyCode.
      return { ...blockedResult, blocked: false };
    }
    const events = await ctx.db
      .query("referralEvents")
      .withIndex("by_referrerUserId", (q) => q.eq("referrerUserId", userId))
      .take(500);
    const paidCount = events.filter((e) => e.status === "paid").length;
    const siteUrl = process.env.SITE_URL ?? "https://masarlearn.vercel.app";
    return {
      blocked: false,
      verified,
      subscribed,
      code: codeDoc.code,
      link: `${siteUrl}/?ref=${codeDoc.code}`,
      registered: events.length,
      paid: paidCount,
      rewardTarget: REWARD_TARGET,
      rewardAmountDZD: REWARD_DZD,
    };
  },
});
