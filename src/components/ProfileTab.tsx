import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from 'convex/_generated/api';
import { SUBJECTS, subjectColor } from '@/lib/subjects';
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
} from '@/lib/dates';
import { FlameIcon, TrophyIcon, ShareIcon, LogoutIcon } from './icons';
import { SubjectLineChart, SubjectPercentBarChart } from './SubjectPerformanceCharts';
import { ShareProfileSheet } from './ShareProfileSheet';
import { signOut } from '@/lib/auth-client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ThemeSwitcher } from './ThemeSwitcher';
import type { ThemeId, ThemeInfo } from '@/lib/useTheme';

export function ProfileTab({
  name,
  startDate,
  xp,
  streak,
  bestStreak,
  records,
  themes,
  currentTheme,
  dark,
  onSelectTheme,
  onToggleDark,
}: {
  name: string;
  startDate: string;
  xp: number;
  streak: number;
  bestStreak: number;
  records: RecordsMap;
  themes: ThemeInfo[];
  currentTheme: ThemeId;
  dark: boolean;
  onSelectTheme: (id: ThemeId) => void;
  onToggleDark: () => void;
}) {
  const setAllowSharing = useMutation(api.progress.setAllowSharing);
  const [shareOpen, setShareOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { league } = currentLeague(xp);

  const daysElapsed = Math.max(1, dayIndexFromStart(startDate, toISODate(new Date())) + 1);
  const maxPossiblePerSubject = daysElapsed * MAX_SCORE;

  const perSubject = SUBJECTS.map((s) => {
    let totalScore = 0;
    let count = 0;
    let totalSeconds = 0;
    for (const rec of Object.values(records)) {
      const v = rec[s.id];
      if (typeof v?.score === 'number') {
        totalScore += v.score;
        count += 1;
      }
      if (typeof v?.timeSeconds === 'number') totalSeconds += v.timeSeconds;
    }
    return { ...s, totalScore, count, totalSeconds };
  });

  const daysActive = Object.values(records).filter((r) => SUBJECTS.some((s) => isFinished(r[s.id]))).length;
  const totalTimeSeconds = perSubject.reduce((acc, s) => acc + s.totalSeconds, 0);
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
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-full bg-[hsl(var(--ink-solid))] text-white flex items-center justify-center text-xl font-bold">
          {name.slice(0, 1)}
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-[hsl(var(--ink))]">{name}</h1>
          <p className="text-xs text-muted-foreground">
            منذ {new Date(startDate).toLocaleDateString('ar-DZ')} · دوري {league.name}
          </p>
        </div>
        <ThemeSwitcher
          themes={themes}
          currentTheme={currentTheme}
          dark={dark}
          onSelectTheme={onSelectTheme}
          onToggleDark={onToggleDark}
        />
        <button
          onClick={() => setConfirmOpen(true)}
          className="h-10 px-4 rounded-full border border-border bg-card text-sm font-semibold text-[hsl(var(--ink))] hover:border-[hsl(var(--sprout))] hover:bg-[hsl(var(--sprout-soft))] transition-colors flex items-center gap-2 shrink-0"
        >
          <ShareIcon size={15} />
          عرض حسابك للآخرين
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="XP الإجمالية" value={String(xp)} />
        <StatCard label="السلسلة الحالية" value={String(streak)} icon={<FlameIcon className="text-[hsl(var(--ember))]" />} />
        <StatCard label="أفضل سلسلة" value={String(bestStreak)} icon={<TrophyIcon size={16} className="text-[hsl(var(--ink))]" />} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="أيام نشطة" value={String(daysActive)} />
        <StatCard label="المعدل العام" value={overallAvg !== null ? overallAvg.toFixed(1) + `/${MAX_SCORE}` : '—'} />
        <StatCard label="وقت الحل الكلي" value={formatClock(totalTimeSeconds)} />
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <h3 className="text-sm font-bold text-[hsl(var(--ink))] mb-1">أداؤك حسب المادة</h3>
        <p className="text-[11px] text-muted-foreground mb-3">علاماتك اليومية في كل مادة، بدلالة الأيام منذ بدايتك</p>
        <SubjectLineChart series={series} />
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <h3 className="text-sm font-bold text-[hsl(var(--ink))] mb-3">نسبة التقدّم والإكمال</h3>
        <SubjectPercentBarChart data={percentData} />
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
          {SUBJECTS.map((s) => (
            <span key={s.id} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: subjectColor(s.id) }} />
              {s.name}
            </span>
          ))}
        </div>
      </div>

      {/* Share confirmation dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-xs p-0 overflow-hidden">
          <DialogHeader className="px-4 pt-4 pb-3 border-b border-border">
            <DialogTitle className="text-right flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-[hsl(var(--ink-solid))] text-white flex items-center justify-center">
                <ShareIcon size={16} />
              </span>
              <span className="flex-1">              عرض حسابك للآخرين</span>
            </DialogTitle>
          </DialogHeader>
          <div className="px-4 py-4">
            <p className="text-sm text-[hsl(var(--ink))] leading-relaxed text-center">
              هل تريد مشاركة حسابك مع الآخرين؟ سيتمكنون من رؤية أدائك ومعلوماتك فقط بدون أي تعديل.
            </p>
          </div>
          <DialogFooter className="px-4 pb-4 flex-row gap-3 !justify-center">
            <button
              onClick={async () => {
                await setAllowSharing({ allow: true });
                setConfirmOpen(false);
                setShareOpen(true);
              }}
              className="flex-1 h-10 rounded-full bg-[hsl(var(--sprout))] hover:bg-[hsl(var(--sprout))]/90 text-white text-sm font-semibold transition-colors"
            >
              نعم، شارك
            </button>
            <button
              onClick={async () => {
                await setAllowSharing({ allow: false });
                setConfirmOpen(false);
              }}
              className="flex-1 h-10 rounded-full border border-border bg-card text-sm font-semibold text-[hsl(var(--ink))] hover:bg-muted/40 transition-colors"
            >
              لا، شكراً
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Shared profile view */}
      <ShareProfileSheet
        open={shareOpen}
        onOpenChange={setShareOpen}
        name={name}
        startDate={startDate}
        xp={xp}
        streak={streak}
        bestStreak={bestStreak}
        records={records}
      />

      {/* Sign out */}
      <button
        onClick={() => signOut()}
        className="w-full flex items-center justify-center gap-2 h-11 rounded-full border border-[hsl(var(--coral))]/30 bg-[hsl(var(--coral))]/5 text-sm font-semibold text-[hsl(var(--coral))] hover:bg-[hsl(var(--coral))]/10 transition-colors"
      >
        <LogoutIcon size={16} />
        تسجيل الخروج
      </button>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3 text-center">
      <div className="text-base font-bold text-[hsl(var(--ink))] flex items-center justify-center gap-1.5">
        {icon}
        {value}
      </div>
      <div className="text-[10px] text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}
