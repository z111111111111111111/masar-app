import type { ReactNode } from 'react';
import { SUBJECTS, subjectColor } from '@/lib/subjects';
import {
  currentLeague,
  dayAverageScore,
  dayIndexFromStart,
  formatClock,
  isFinished,
  MAX_SCORE,
  subjectDailySeries,
  type RecordsMap,
} from '@/lib/dates';
import { useDayInfo } from '@/hooks/useDayInfo';
import { FlameIcon, TrophyIcon } from './icons';
import { SubjectLineChart, SubjectPercentBarChart } from './SubjectPerformanceCharts';

// Shared public-stats layout used by the leaderboard profile dialog and the
// share sheet. Fully responsive (grid collapses on narrow screens is handled by
// the caller's container) and the performance chart is rendered in fit-width
// mode so the whole curve is always visible instead of being clipped off-screen.
export function UserStatsView({
  name,
  startDate,
  xp,
  streak,
  bestStreak,
  records,
  subtitle,
}: {
  name: string;
  startDate: string;
  xp: number;
  streak: number;
  bestStreak: number;
  records: RecordsMap;
  subtitle?: ReactNode;
}) {
  const { todayISO } = useDayInfo();
  const { league } = currentLeague(xp);

  const daysElapsed = Math.max(1, dayIndexFromStart(startDate, todayISO) + 1);
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

  // Completion = full days (all subjects finished) out of the days elapsed.
  const completeDays = Object.values(records).filter((r) => SUBJECTS.every((s) => isFinished(r[s.id]))).length;
  const completionPercent = Math.min(100, Math.round((completeDays / daysElapsed) * 100));

  const series = subjectDailySeries(records, startDate, daysElapsed);
  const percentData = perSubject.map((s) => ({
    id: s.id,
    short: s.short,
    percentage: Math.round(Math.min(100, (s.totalScore / maxPossiblePerSubject) * 100)),
  }));

  return (
    <div className="px-5 py-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-full bg-[hsl(var(--ink-solid))] text-white flex items-center justify-center text-xl font-bold shrink-0">
          {name.slice(0, 1)}
        </div>
        <div className="min-w-0">
          <p className="text-base font-bold text-[hsl(var(--ink))] truncate">{name}</p>
          {subtitle ? <p className="text-[11px] text-muted-foreground">{subtitle}</p> : (
            <p className="text-[11px] text-muted-foreground">
              دوري {league.name} · {daysActive > 0 ? `نشط ${daysActive} يوم` : 'لم يسجّل أي نشاط بعد'}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <MiniStat label="XP" value={String(xp)} />
        <MiniStat label="السلسلة" value={String(streak)} icon={<FlameIcon className="text-[hsl(var(--ember))]" size={14} />} />
        <MiniStat label="أفضل سلسلة" value={String(bestStreak)} icon={<TrophyIcon size={13} className="text-[hsl(var(--ink))]" />} />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <MiniStat label="أيام نشطة" value={String(daysActive)} />
        <MiniStat label="المعدل العام" value={overallAvg !== null ? overallAvg.toFixed(1) + `/${MAX_SCORE}` : '—'} />
        <MiniStat label="وقت الحل" value={formatClock(totalTimeSeconds)} />
      </div>

      <div className="rounded-xl border border-border bg-card p-3">
        <h4 className="text-xs font-bold text-[hsl(var(--ink))] mb-2">الأداء حسب المادة</h4>
        <SubjectLineChart series={series} fitWidth />
      </div>

      <div className="rounded-xl border border-border bg-card p-3">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-bold text-[hsl(var(--ink))]">نسبة التقدّم والإكمال</h4>
          <span className="text-[10px] font-semibold text-muted-foreground">
            إكمال الأيام: {completionPercent}%
          </span>
        </div>
        <SubjectPercentBarChart data={percentData} />
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
          {SUBJECTS.map((s) => (
            <span key={s.id} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: subjectColor(s.id) }} />
              {s.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 p-2 text-center min-w-0">
      <div className="text-sm font-bold text-[hsl(var(--ink))] flex items-center justify-center gap-1">
        {icon}
        <span className="truncate">{value}</span>
      </div>
      <div className="text-[9px] text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}
