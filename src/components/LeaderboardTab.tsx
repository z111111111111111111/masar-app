import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from 'convex/_generated/api';
import { currentLeague } from '@/lib/dates';
import { PublicProfileDialog } from './PublicProfileDialog';

export function LeaderboardTab({ userId, name, xp }: { userId: string; name: string; xp: number }) {
  const entries = useQuery(api.leaderboard.list);
  const { league } = currentLeague(xp);
  const myRank = entries?.findIndex((e) => e.userId === userId) ?? -1;

  const [selected, setSelected] = useState<{ userId: string; name: string; xp: number; rank: number } | null>(null);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-[hsl(var(--ink))]">قائمة المتصدرين</h1>
        <p className="text-sm text-muted-foreground">الدوري {league.name}</p>
      </div>

      <p className="text-xs text-muted-foreground bg-muted/60 rounded-lg px-3 py-2 leading-relaxed">
        هذه قائمة تجريبية لعرض فكرة المنتج: بياناتك تُشارك مع مستخدمي هذا التطبيق التجريبي، إضافة إلى بضعة حسابات توضيحية للمقارنة.
      </p>

      <div className="rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden">
        {!entries && (
          <div className="p-6 text-center text-sm text-muted-foreground">جارٍ تحميل الترتيب...</div>
        )}
        {entries?.map((e, i) => {
          const isMe = e.userId === userId;
          const rank = i + 1;
          return (
            <button
              key={e.userId}
              onClick={() => setSelected({ userId: e.userId, name: e.name, xp: e.xp, rank })}
              className={`w-full flex items-center gap-3 px-4 py-3 text-start transition-colors hover:bg-muted/40 ${isMe ? 'bg-[hsl(var(--sprout-soft))]' : ''}`}
            >
              <span
                className={`w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-[11px] font-bold ${
                  rank === 1
                    ? 'bg-[hsl(var(--sprout))] text-white'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {rank}
              </span>
              <div className="w-9 h-9 rounded-full bg-[hsl(var(--ink-solid))] text-white flex items-center justify-center text-xs font-semibold shrink-0">
                {e.name.slice(0, 1)}
              </div>
              <span className={`flex-1 text-sm font-semibold ${isMe ? 'text-[hsl(var(--sprout))]' : 'text-[hsl(var(--ink))]'}`}>
                {e.name} {isMe && '(أنت)'}
              </span>
              <span className="text-sm font-semibold text-muted-foreground">{e.xp} XP</span>
            </button>
          );
        })}
      </div>

      {entries && myRank >= 3 && (
        <p className="text-center text-xs text-muted-foreground">
          رتبتك الحالية: {myRank + 1} — واصل التسجيل اليومي لتتقدم في الترتيب
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
        />
      )}
    </div>
  );
}
