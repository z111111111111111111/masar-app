import { useQuery } from 'convex/react';
import { api } from 'convex/_generated/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { currentLeague, toISODate, type RecordsMap, type SubjectDayRecord, type TimerStatus } from '@/lib/dates';
import type { SubjectId } from '@/lib/subjects';
import { LockIcon, VerifiedBadge } from './icons';
import { UserStatsView } from './UserStatsView';

function buildRecordsMap(rows: any[]): RecordsMap {
  const map: RecordsMap = {};
  for (const row of rows) {
    if (!map[row.dateISO]) map[row.dateISO] = {};
    map[row.dateISO][row.subject as SubjectId] = {
      score: row.score,
      timeSeconds: row.timeSeconds,
      timerStatus: row.timerStatus as TimerStatus | undefined,
      runningSince: row.runningSince,
      viaRandom: row.viaRandom,
    } satisfies SubjectDayRecord;
  }
  return map;
}

interface PublicProfileDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  userId: string;
  name: string;
  xp: number;
  rank: number;
  verified?: boolean;
}

export function PublicProfileDialog({ open, onOpenChange, userId, name, xp, rank, verified }: PublicProfileDialogProps) {
  const data = useQuery(api.progress.getPublicProfile, open ? { userId } : 'skip');

  const isPrivate = data?.private === true;
  const profile = data && !data.private ? data.progress : null;
  const records = data && !data.private && data.records ? buildRecordsMap(data.records) : ({} as RecordsMap);
  const { league } = currentLeague(xp);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-0 max-h-[85vh] overflow-y-auto">
        <DialogHeader className="px-5 pt-5 pb-4 border-b border-border sticky top-0 bg-card z-10">
          <DialogTitle className="text-right flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-full bg-[hsl(var(--sprout))] text-white flex items-center justify-center text-xs font-bold shrink-0">
              #{rank}
            </span>
            <span className="flex-1 text-base flex items-center gap-1.5 min-w-0">
              <span className="truncate">حساب {name}</span>
              {verified && <VerifiedBadge size={15} className="shrink-0" />}
            </span>
          </DialogTitle>
        </DialogHeader>

        {data === undefined ? (
          <div className="p-8 text-center text-sm text-muted-foreground">جارٍ التحميل...</div>
        ) : isPrivate ? (
          <div className="px-5 py-10 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-muted/60 flex items-center justify-center">
              <LockIcon size={28} className="text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-[hsl(var(--ink))]">{name}</p>
              <p className="text-xs text-muted-foreground mt-1">
                هذا الحساب خاص — صاحبه لم يسمح بمشاركة معلوماته.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 w-full mt-2">
              <div className="rounded-xl border border-border bg-muted/20 p-3 text-center">
                <p className="text-sm font-bold text-[hsl(var(--ink))]">{xp}</p>
                <p className="text-[9px] text-muted-foreground mt-0.5">XP</p>
              </div>
              <div className="rounded-xl border border-border bg-muted/20 p-3 text-center">
                <p className="text-sm font-bold text-[hsl(var(--ink))]">#{rank}</p>
                <p className="text-[9px] text-muted-foreground mt-0.5">الترتيب</p>
              </div>
            </div>
          </div>
        ) : (
          <UserStatsView
            name={profile?.name ?? name}
            startDate={profile?.startDate ?? toISODate(new Date())}
            xp={xp}
            streak={profile?.streak ?? 0}
            bestStreak={profile?.bestStreak ?? 0}
            records={records}
            subtitle={
              <>
                دوري {league.name} · #{rank} في القائمة
              </>
            }
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
