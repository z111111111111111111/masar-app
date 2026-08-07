import { useEffect, useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from 'convex/_generated/api';
import { currentLeague } from '@/lib/dates';
import { PublicProfileDialog } from './PublicProfileDialog';
import { VerifiedBadge } from './icons';

export function LeaderboardTab({ userId, name, xp }: { userId: string; name: string; xp: number }) {
  const data = useQuery(api.leaderboard.list);
  const ensureRoom = useMutation(api.leaderboard.ensureRoom);
  const { league } = currentLeague(xp);
  const entries = Array.isArray(data?.entries) ? data.entries : undefined;
  const roomNumber = data?.roomNumber;
  const totalRooms = data?.totalRooms;
  const myRankInRoom = data?.myRankInRoom;
  const roomSize = data?.roomSize;

  const [selected, setSelected] = useState<{ userId: string; name: string; xp: number; rank: number; verified: boolean } | null>(null);

  // Place the caller in a room of their current league (creates/fills rooms);
  // re-runs when they move up or down a league.
  useEffect(() => {
    ensureRoom().catch(() => {});
  }, [ensureRoom, league.name]);

  return (
    <div className="space-y-5 pt-6">
      <div>
        <h1 className="text-xl font-bold text-[hsl(var(--ink))]">قائمة المتصدرين</h1>
        <p className="text-sm text-muted-foreground">
          الدوري {league.name}
          {roomNumber !== undefined && totalRooms !== undefined && (
            <> — الغرفة {roomNumber} من {totalRooms}</>
          )}
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden">
        {!entries && (
          <div className="p-6 text-center text-sm text-muted-foreground">جارٍ تحميل الترتيب...</div>
        )}
        {entries?.map((e) => {
          const isMe = e.userId === userId;
          return (
            <button
              key={e.userId}
              onClick={() => setSelected({ userId: e.userId, name: e.name, xp: e.xp, rank: e.rank, verified: e.verified })}
              className={`w-full flex items-center gap-3 px-4 py-3 text-start transition-colors hover:bg-muted/40 ${isMe ? 'bg-[hsl(var(--sprout-soft))]' : ''}`}
            >
              <span
                className={`w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-[11px] font-bold ${
                  e.rank === 1
                    ? 'bg-[hsl(var(--sprout))] text-white'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {e.rank}
              </span>
              <div className="w-9 h-9 rounded-full bg-[hsl(var(--ink-solid))] text-white flex items-center justify-center text-xs font-semibold shrink-0">
                {e.name.slice(0, 1)}
              </div>
              <span className={`flex-1 text-sm font-semibold flex items-center gap-1 ${isMe ? 'text-[hsl(var(--sprout))]' : 'text-[hsl(var(--ink))]'}`}>
                <span className="truncate">{e.name}</span>
                {e.verified && <VerifiedBadge size={14} className="shrink-0" />}
                {isMe && '(أنت)'}
              </span>
              <span className="text-sm font-semibold text-muted-foreground">{e.xp} XP</span>
            </button>
          );
        })}
      </div>

      {entries && myRankInRoom !== undefined && roomSize !== undefined && (
        <p className="text-center text-xs text-muted-foreground">
          رتبتك: {myRankInRoom} من {roomSize} — واصل التسجيل اليومي لتتقدم في الترتيب
        </p>
      )}

      {selected && (
        <PublicProfileDialog
          open={!!selected}
          onOpenChange={(v) => { if (!v) setSelected(null); }}
          userId={selected.userId}
          name={selected.name}
          xp={selected.xp}
          rank={selected.rank}
          verified={selected.verified}
        />
      )}
    </div>
  );
}
