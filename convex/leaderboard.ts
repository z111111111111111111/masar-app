import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { OWNER_SUBJECT } from "./owners";

// League XP thresholds (ascending), mirroring LEAGUES in src/lib/dates.ts.
const LEAGUE_MINS = [0, 300, 900, 2000, 4000];
const ROOM_SIZE = 20;

export const list = query({
  args: {},
  handler: async (ctx) => {
    const caller = await ctx.auth.getUserIdentity();
    if (!caller) return null;

    const myProgress = await ctx.db
      .query("userProgress")
      .withIndex("by_userId", (q) => q.eq("userId", caller.subject))
      .unique();
    const myXp = myProgress?.totalXP ?? 0;

    // Which league the caller currently sits in (by XP).
    let leagueIdx = 0;
    for (let i = 0; i < LEAGUE_MINS.length; i++) {
      if (myXp >= LEAGUE_MINS[i]) leagueIdx = i;
    }
    const leagueMin = LEAGUE_MINS[leagueIdx];
    const leagueMax =
      leagueIdx + 1 < LEAGUE_MINS.length ? LEAGUE_MINS[leagueIdx + 1] : Number.MAX_SAFE_INTEGER;

    // Only the caller's own league is ever shown; leagues never mix.
    const leagueEntries = await ctx.db
      .query("userProgress")
      .withIndex("by_xp")
      .order("desc")
      .filter((q) =>
        q.and(q.gte(q.field("totalXP"), leagueMin), q.lt(q.field("totalXP"), leagueMax))
      )
      .collect();

    const mapped = leagueEntries.map((e) => ({
      userId: e.userId,
      name: e.name,
      xp: e.totalXP,
      verified: !!e.isVerified,
    }));

    let myIndex = mapped.findIndex((e) => e.userId === caller.subject);
    if (myIndex === -1) {
      // No progress record yet: rank the caller at the bottom of their league.
      mapped.push({
        userId: caller.subject,
        name: caller.name ?? caller.email?.split("@")[0] ?? "أنت",
        xp: myXp,
        verified: false,
      });
      myIndex = mapped.length - 1;
    }

    // Chunk the league into fixed rooms of ROOM_SIZE, positioned by XP rank.
    const roomIndex = Math.floor(myIndex / ROOM_SIZE);
    const start = roomIndex * ROOM_SIZE;
    const room = mapped.slice(start, start + ROOM_SIZE);

    return {
      leagueIndex: leagueIdx,
      roomNumber: roomIndex + 1,
      totalRooms: Math.max(1, Math.ceil(mapped.length / ROOM_SIZE)),
      myRankInLeague: myIndex + 1,
      totalInLeague: mapped.length,
      entries: room.map((e, i) => ({ ...e, rank: start + i + 1 })),
    };
  },
});

// Grants/revokes the verified badge. Restricted to the owner identity so a
// random user can't fake it; the admin tool runs it with the owner identity.
export const setVerified = mutation({
  args: { userId: v.string(), verified: v.boolean() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity || identity.subject !== OWNER_SUBJECT) {
      throw new Error("Not authorized");
    }

    const progress = await ctx.db
      .query("userProgress")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();
    if (!progress) throw new Error("User not found");

    await ctx.db.patch(progress._id, { isVerified: args.verified });
  },
});
