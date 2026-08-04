import { useMemo, useState } from 'react';
import type { SubjectId } from '@/lib/subjects';
import { SUBJECTS } from '@/lib/subjects';
import { addDays, formatArabicDate, toISODate, currentLeague, isFinished, finishedSubjectsCount, type RecordsMap } from '@/lib/dates';
import { useMutation, useQuery } from 'convex/react';
import { api } from 'convex/_generated/api';
import { useDayInfo } from '@/hooks/useDayInfo';
import { CountdownCard } from './CountdownCard';
import { TodayTimerCard } from './TodayTimerCard';
import { CorrectorChatSheet } from './CorrectorChatSheet';
import { RandomExerciseCard } from './RandomExerciseCard';
import { ChatIcon, ChevronIcon, CheckCircleIcon } from './icons';

const QUOTES = [
  'الانتظام يوماً بعد يوم يصنع الفارق يوم الامتحان.',
  'كل تمرين تحله اليوم هو نقطة أقل تخسرها يوم البكالوريا.',
  'لا تقارن يومك بالأمس فقط، بل بما تحتاجه غداً.',
  'الاستمرارية أهم من الكمال.',
];

export function DashboardTab({
  name,
  startDate,
  xp,
  records,
  isPaid,
  onNavigateRoadmap,
}: {
  name: string;
  startDate: string;
  xp: number;
  records: RecordsMap;
  isPaid: boolean;
  onNavigateRoadmap: () => void;
}) {
  const startTimer = useMutation(api.progress.startTimer);
  const pauseTimer = useMutation(api.progress.pauseTimer);
  const resumeTimer = useMutation(api.progress.resumeTimer);
  const recordFinish = useMutation(api.progress.recordFinish);

  const [chatOpen, setChatOpen] = useState(false);
  const today = new Date();
  const { todayISO } = useDayInfo();
  const todayRecord = records[todayISO] ?? {};
  const finishedCount = SUBJECTS.filter((s) => isFinished(todayRecord[s.id])).length;

  const entitlements = useQuery(api.entitlements.get);
  const limits = entitlements?.limits ?? null;

  const dayIndexToday = useMemo(
    () => Math.round((+new Date(todayISO) - +new Date(startDate)) / 86400000),
    [startDate, todayISO]
  );

  const quote = useMemo(() => QUOTES[today.getDate() % QUOTES.length], []); // eslint-disable-line

  const week = useMemo(() => {
    const days = [];
    for (let i = -3; i <= 3; i++) {
      const d = addDays(today, i);
      const iso = toISODate(d);
      const count = finishedSubjectsCount(records[iso]);
      const isFuture = i > 0;
      days.push({
        iso,
        label: d.toLocaleDateString('ar-DZ', { weekday: 'short' }),
        count,
        complete: !isFuture && count === SUBJECTS.length,
        isToday: iso === todayISO,
        isFuture,
      });
    }
    return days;
  }, [records]); // eslint-disable-line

  const { league, next, progress } = currentLeague(xp);

  const handleStartTimer = (subject: SubjectId, opts?: { viaRandom?: boolean }) => {
    startTimer({ dateISO: todayISO, subject, viaRandom: opts?.viaRandom });
  };

  const handlePauseTimer = (subject: SubjectId) => {
    pauseTimer({ dateISO: todayISO, subject });
  };

  const handleResumeTimer = (subject: SubjectId) => {
    resumeTimer({ dateISO: todayISO, subject });
  };

  const handleFinishSubject = (subject: SubjectId, score: number) => {
    const rec = todayRecord[subject];
    const elapsed = rec?.runningSince
      ? (rec.timeSeconds ?? 0) + Math.floor((Date.now() - rec.runningSince) / 1000)
      : rec?.timeSeconds ?? 0;
    recordFinish({ dateISO: todayISO, subject, score, timeSeconds: elapsed });
  };

  return (
    <div className="space-y-5 pt-6">
      <div>
        <h1 className="text-xl font-bold text-[hsl(var(--ink))]">مرحباً {name}</h1>
        <p className="text-sm text-muted-foreground">{formatArabicDate(today)}</p>
      </div>

      <CountdownCard finishedCount={finishedCount} />

      {/* Path entry point */}
      <button
        onClick={onNavigateRoadmap}
        className="w-full flex items-center gap-3 rounded-2xl border border-border bg-card p-4 text-right hover:border-[hsl(var(--ink))]/30 transition-colors"
      >
        <span className="flex-1">
          <span className="block text-sm font-semibold text-[hsl(var(--ink))]">هنا المسار</span>
          <span className="block text-xs text-muted-foreground mt-0.5">
            حيث تتعلم درساً كاملاً وتفهمه في 4 دقائق أو أقل
          </span>
        </span>
        <ChevronIcon className="text-muted-foreground rotate-180 shrink-0" size={16} />
      </button>

      {/* AI corrector entry point */}
      <button
        onClick={() => setChatOpen(true)}
        className="w-full flex items-center gap-3 rounded-2xl border border-border bg-card p-4 text-right hover:border-[hsl(var(--ink))]/30 transition-colors"
      >
        <span className="w-11 h-11 shrink-0 rounded-full bg-[hsl(var(--ink-solid))] text-white flex items-center justify-center">
          <ChatIcon size={20} />
        </span>
        <span className="flex-1">
          <span className="block text-sm font-semibold text-[hsl(var(--ink))]">تحدّث مع المصحّح الذكي</span>
          <span className="block text-xs text-muted-foreground mt-0.5">
            {limits && !isPaid && limits.aiRemaining !== null
              ? limits.aiRemaining > 0
                ? `متبقٍ ${limits.aiRemaining} من ${limits.aiLimit} رسائل مجانية`
                : 'استنفدت رسائلك المجانية — يعود رصيدك بعد 24 ساعة'
              : isPaid
              ? 'غير محدود — يراجع ويصحح بلا حدود'
              : 'يراجع حلولك ويصحح أخطاءك تلقائياً'}
          </span>
        </span>
        <ChevronIcon className="text-muted-foreground rotate-180 shrink-0" size={16} />
      </button>

      <TodayTimerCard
        todayRecord={todayRecord}
        onStart={handleStartTimer}
        onPause={handlePauseTimer}
        onResume={handleResumeTimer}
        onFinish={handleFinishSubject}
        isPaid={isPaid}
        dailyRemaining={limits?.dailyRemaining ?? null}
        dailyResetAt={limits?.dailyResetAt ?? null}
      />

      <RandomExerciseCard
        dayIndexToday={dayIndexToday}
        isPaid={isPaid}
        randomRemaining={limits?.randomRemaining ?? null}
        randomResetAt={limits?.randomResetAt ?? null}
      />

      {/* Weekly strip — today in the center */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <h2 className="font-semibold text-[hsl(var(--ink))] text-sm">اجتهادك اليومي</h2>
        <div dir="rtl" className="grid grid-cols-7">
          <span className="col-start-4 text-[10px] font-bold text-[hsl(var(--sprout))] text-center">اليوم الحالي</span>
        </div>
        <div dir="rtl" className="grid grid-cols-7 pt-0.5">
          {week.map((d) => (
            <div key={d.iso} className="flex flex-col items-center gap-1.5">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold ${
                  d.isFuture
                    ? 'bg-muted/30 text-muted-foreground/40'
                    : d.complete
                    ? 'bg-[hsl(var(--sprout))] text-white'
                    : d.count > 0
                    ? 'bg-[hsl(var(--ember-soft))] text-[hsl(var(--ember))]'
                    : d.isToday
                    ? 'border-2 border-dashed border-[hsl(var(--ember))] text-[hsl(var(--ember))]'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {d.isFuture ? (
                  '—'
                ) : d.complete ? (
                  <CheckCircleIcon size={14} className="text-white" />
                ) : d.count > 0 ? (
                  d.count
                ) : (
                  ''
                )}
              </div>
              <span className={`text-[10px] ${d.isToday ? 'font-bold text-[hsl(var(--ink))]' : 'text-muted-foreground'}`}>{d.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* League progress */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold text-[hsl(var(--ink))]">
            الدوري {league.name}
          </span>
          {next && <span className="text-[11px] text-muted-foreground">{xp} / {next.min} XP</span>}
        </div>
        <div className="h-2.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-[hsl(var(--sprout))] transition-all"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        {!next && <p className="text-xs text-muted-foreground mt-1.5">وصلت لأعلى دوري متاح</p>}
      </div>

      <p className="text-center text-xs text-muted-foreground italic px-4">"{quote}"</p>

      <CorrectorChatSheet
        open={chatOpen}
        onOpenChange={setChatOpen}
        userName={name}
        aiRemaining={limits?.aiRemaining ?? null}
        aiResetAt={limits?.aiResetAt ?? null}
      />
    </div>
  );
}
