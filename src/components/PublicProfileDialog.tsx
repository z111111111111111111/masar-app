import { useQuery } from 'convex/react';
import { api } from 'convex/_generated/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SUBJECTS, subjectColor, type SubjectId } from '@/lib/subjects';
import {
  currentLeague,
  dayAverageScore,
  dayIndexFromStart,
  formatClock,
  isFinished,
  MAX_SCORE,
  subjectDailySeries,
  toISODate,
  type RecordsMap,
  type SubjectDayRecord,
  type TimerStatus,
} from '@/lib/dates';
import { FlameIcon, TrophyIcon, LockIcon } from './icons';
import { SubjectLineChart, SubjectPercentBarChart } from './SubjectPerformanceCharts';

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
}

export function PublicProfileDialog({ open, onOpenChange, userId, name, xp, rank }: PublicProfileDialogProps) {
  const data = useQuery(api.progress.getPublicProfile, open ? { userId } : 'skip');

  const isPrivate = data?.private === true;
  const profile = data && !data.private ? data.progress : null;
  const records = data && !data.private && data.records ? buildRecordsMap(data.records) : ({} as RecordsMap);
  const { league } = currentLeague(xp);

  const startDate = profile?.startDate ?? toISODate(new Date());
  const streak = profile?.streak ?? 0;
  const bestStreak = profile?.bestStreak ?? 0;

  const daysElapsed = Math.max(1, dayIndexFromStart(startDate, toISODate(new Date())) + 1);
  const maxPossiblePerSubject = daysElapsed * MAX_SCORE;

  const perSubject = SUBJECTS.map((s) => {
    let totalScore = 0;
    for (const rec of Object.values(records)) {
      const v = rec[s.id];
      if (typeof v?.score === 'number') totalScore += v.score;
    }
    return { ...s, totalScore };
  });

  const daysActive = Object.values(records).filter((r) => SUBJECTS.some((s) => isFinished(r[s.id]))).length;
  const totalTimeSeconds = Object.values(records).reduce((acc, rec) => {
    for (const sub of Object.values(rec)) {
      if (typeof sub?.timeSeconds === 'number') acc += sub.timeSeconds;
    }
    return acc;
  }, 0);
  const overallAvg = (() => {
    const all = Object.values(records).map(dayAverageScore).filter((v): v is number => v !== null);
    if (!all.length) return null;
    return all.reduce((a, b) => a + b, 0) / all.length;
  })();

  const series = subjectDailySeries(records, startDate, daysElapsed);
  const percentData = perSubject.map((s) => ({
    id: s.id,
    short: s.short,
    percentage: Math.round(Math.min(100, (s.totalScore / maxPossiblePerSubject) * 100)),
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-0 overflow-hidden max-h-[85vh] overflow-y-auto">
        <DialogHeader className="px-5 pt-5 pb-4 border-b border-border sticky top-0 bg-card z-10">
          <DialogTitle className="text-right flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-full bg-[hsl(var(--sprout))] text-white flex items-center justify-center text-xs font-bold">
              #{rank}
            </span>
            <span className="flex-1 text-base">حساب {name}</span>
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
                هذا الحساب خاص — صاحبه لم يُ밈ِ على مشاركة معلوماته.
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
          <div className="px-5 py-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-[hsl(var(--ink-solid))] text-white flex items-center justify-center text-xl font-bold">
                {name.slice(0, 1)}
              </div>
              <div>
                <p className="text-base font-bold text-[hsl(var(--ink))]">{name}</p>
                <p className="text-[11px] text-muted-foreground">
                  دوري {league.name} · #{rank} في القائمة
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <MiniStat label="XP" value={String(xp)} />
              <MiniStat label="السلسلة" value={String(streak)} icon={<FlameIcon className="text-[hsl(var(--ember))]" size={14} />} />
              <MiniStat label="أفضل سلسلة" value={String(bestStreak)} icon={<TrophyIcon size={13} className="text-[hsl(var(--ink))]" />} />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <MiniStat label="أيام نشطة" value={String(daysActive)} />
              <MiniStat label="المعدل" value={overallAvg !== null ? overallAvg.toFixed(1) + `/${MAX_SCORE}` : '—'} />
              <MiniStat label="وقت الحل" value={formatClock(totalTimeSeconds)} />
            </div>

            <div className="rounded-xl border border-border bg-card p-3">
              <h4 className="text-xs font-bold text-[hsl(var(--ink))] mb-2">الأداء حسب المادة</h4>
              <div className="pointer-events-none">
                <SubjectLineChart series={series} />
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-3">
              <h4 className="text-xs font-bold text-[hsl(var(--ink))] mb-2">نسبة التقدّم</h4>
              <div className="pointer-events-none">
                <SubjectPercentBarChart data={percentData} />
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                {SUBJECTS.map((s) => (
                  <span key={s.id} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <span className="w-2 h-2 rounded-full" style={{ background: subjectColor(s.id) }} />
                    {s.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function MiniStat({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 p-2 text-center">
      <div className="text-sm font-bold text-[hsl(var(--ink))] flex items-center justify-center gap-1">
        {icon}
        {value}
      </div>
      <div className="text-[9px] text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}
