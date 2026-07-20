import { useMemo, useState } from 'react';
import type { SubjectId } from '@/lib/subjects';
import { SUBJECTS } from '@/lib/subjects';
import { addDays, formatArabicDate, toISODate, currentLeague, isFinished, finishedSubjectsCount, type RecordsMap } from '@/lib/dates';
import { useMutation } from 'convex/react';
import { api } from 'convex/_generated/api';
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
  streak,
  xp,
  records,
}: {
  name: string;
  startDate: string;
  streak: number;
  xp: number;
  records: RecordsMap;
}) {
  const startTimer = useMutation(api.progress.startTimer);
  const pauseTimer = useMutation(api.progress.pauseTimer);
  const resumeTimer = useMutation(api.progress.resumeTimer);
  const recordFinish = useMutation(api.progress.recordFinish);

  const [chatOpen, setChatOpen] = useState(false);
  const today = new Date();
  const todayISO = toISODate(today);
  const todayRecord = records[todayISO] ?? {};
  const finishedCount = SUBJECTS.filter((s) => isFinished(todayRecord[s.id])).length;

  const dayIndexToday = useMemo(
    () => Math.round((+new Date(todayISO) - +new Date(startDate)) / 86400000),
    [startDate, todayISO]
  );

  const quote = useMemo(() => QUOTES[today.getDate() % QUOTES.length], []); // eslint-disable-line

  const last7 = useMemo(() => {
    const days = [];
    for (let i = 0; i <= 6; i++) {
      const d = addDays(today, -i);
      const iso = toISODate(d);
      const count = finishedSubjectsCount(records[iso]);
      days.push({
        iso,
        label: d.toLocaleDateString('ar-DZ', { weekday: 'short' }),
        count,
        complete: count === SUBJECTS.length,
        isToday: iso === todayISO,
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
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-[hsl(var(--ink))]">مرحباً {name}</h1>
        <p className="text-sm text-muted-foreground">{formatArabicDate(today)}</p>
      </div>

      <CountdownCard finishedCount={finishedCount} />

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
            سيراجع حلولك ويصحح أخطاءك تلقائياً — قيد الربط حالياً
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
      />

      <RandomExerciseCard dayIndexToday={dayIndexToday} />

      {/* Last 7 days strip */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <h3 className="text-xs font-bold text-muted-foreground mb-3">آخر 7 أيام</h3>
        <div className="flex justify-between">
          {last7.map((d) => (
            <div key={d.iso} className="flex flex-col items-center gap-1.5">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold ${
                  d.complete
                    ? 'bg-[hsl(var(--sprout))] text-white'
                    : d.count > 0
                    ? 'bg-[hsl(var(--ember-soft))] text-[hsl(var(--ember))]'
                    : d.isToday
                    ? 'border-2 border-dashed border-[hsl(var(--ember))] text-[hsl(var(--ember))]'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {d.complete ? (
                  <CheckCircleIcon size={14} className="text-white" />
                ) : d.count > 0 ? (
                  d.count
                ) : (
                  ''
                )}
              </div>
              <span className="text-[10px] text-muted-foreground">{d.label}</span>
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

      <CorrectorChatSheet open={chatOpen} onOpenChange={setChatOpen} />
    </div>
  );
}
