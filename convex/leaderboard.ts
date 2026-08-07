import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { OWNER_SUBJECT } from "./owners";

// League XP thresholds (ascending), mirroring LEAGUES in src/lib/dates.ts.
const LEAGUE_MINS = [0, 300, 900, 2000, 4000];
const ROOM_SIZE = 20;

function leagueIndexForXp(xp: number): number {
  let idx = 0;
  for (let i = 0; i < LEAGUE_MINS.length; i++) {
    if (xp >= LEAGUE_MINS[i]) idx = i;
  }
  return idx;
}

// Assigns the caller to a room in their current league. Rooms fill up to
// ROOM_SIZE; once full a new room is created for the next members. Moving up
// (or down) a league reassigns the user to a room of the new league.
export const ensureRoom = mutation({
  args: {},
  handler: async (ctx) => {
    const caller = await ctx.auth.getUserIdentity();
    if (!caller) return null;

    const myProgress = await ctx.db
      .query("userProgress")
      .withIndex("by_userId", (q) => q.eq("userId", caller.subject))
      .unique();
    if (!myProgress) return null;

    const leagueIdx = leagueIndexForXp(myProgress.totalXP ?? 0);
    const existingRoomId = myProgress.leaderboardRoomId;

    // Already placed in a room of the current league → nothing to do.
    if (existingRoomId && myProgress.leaderboardLeague === leagueIdx) {
      const room = await ctx.db.get(existingRoomId);
      if (room && room.members.includes(caller.subject)) {
        return { roomId: existingRoomId, leagueIdx };
      }
    }

    // Leave any previous room (e.g. another league) before re-assigning.
    if (existingRoomId) {
      const old = await ctx.db.get(existingRoomId);
      if (old) {
        const updated = old.members.filter((u) => u !== caller.subject);
        if (updated.length === 0) await ctx.db.delete(existingRoomId);
        else await ctx.db.patch(existingRoomId, { members: updated });
      }
    }

    // Prefer the fullest room that still has space so rooms fill up in order.
    const rooms = await ctx.db
      .query("leaderboardRooms")
      .withIndex("by_leagueIdx", (q) => q.eq("leagueIdx", leagueIdx))
      .collect();
    let target: Id<"leaderboardRooms"> | null = null;
    let targetSize = -1;
    for (const r of rooms) {
      if (r.members.length < ROOM_SIZE && r.members.length > targetSize) {
        target = r._id;
        targetSize = r.members.length;
      }
    }

    let roomId: Id<"leaderboardRooms">;
    if (target) {
      roomId = target;
      const room = await ctx.db.get(target);
      if (room && !room.members.includes(caller.subject)) {
        await ctx.db.patch(target, { members: [...room.members, caller.subject] });
      }
    } else {
      roomId = await ctx.db.insert("leaderboardRooms", {
        leagueIdx,
        members: [caller.subject],
      });
    }

    await ctx.db.patch(myProgress._id, {
      leaderboardRoomId: roomId,
      leaderboardLeague: leagueIdx,
    });

    return { roomId, leagueIdx };
  },
});

// The caller's own room only: ~20 people, never anyone from another room or
// league. Returns null until ensureRoom has placed the caller.
export const list = query({
  args: {},
  handler: async (ctx) => {
    const caller = await ctx.auth.getUserIdentity();
    if (!caller) return null;

    const myProgress = await ctx.db
      .query("userProgress")
      .withIndex("by_userId", (q) => q.eq("userId", caller.subject))
      .unique();
    if (!myProgress?.leaderboardRoomId) return null;

    const room = await ctx.db.get(myProgress.leaderboardRoomId);
    if (!room) return null;

    const members = await Promise.all(
      room.members.map(async (uid) => {
        const p = await ctx.db
          .query("userProgress")
          .withIndex("by_userId", (q) => q.eq("userId", uid))
          .unique();
        return p
          ? { userId: p.userId, name: p.name, xp: p.totalXP, verified: !!p.isVerified }
          : null;
      })
    );
    const filtered = members.filter(
      (m): m is { userId: string; name: string; xp: number; verified: boolean } => m !== null
    );
    filtered.sort((a, b) => b.xp - a.xp);

    const leagueIdx = myProgress.leaderboardLeague ?? 0;
    const rooms = await ctx.db
      .query("leaderboardRooms")
      .withIndex("by_leagueIdx", (q) => q.eq("leagueIdx", leagueIdx))
      .collect();
    const sortedRooms = [...rooms].sort((a, b) => a._creationTime - b._creationTime);
    const roomNumber = sortedRooms.findIndex((r) => r._id === room._id) + 1;

    const myIndex = filtered.findIndex((e) => e.userId === caller.subject);

    return {
      leagueIdx,
      roomNumber,
      totalRooms: sortedRooms.length,
      myRankInRoom: myIndex === -1 ? filtered.length + 1 : myIndex + 1,
      roomSize: filtered.length,
      entries: filtered.map((e, i) => ({ ...e, rank: i + 1 })),
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
