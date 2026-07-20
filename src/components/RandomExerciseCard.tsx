import { useEffect, useRef, useState } from 'react';
import { SUBJECTS, type SubjectId } from '@/lib/subjects';
import { currentWeekFromStart, pickTopicForSubject } from '@/lib/curriculum';
import { formatClock } from '@/lib/dates';
import { SubjectIcon } from './SubjectIcon';
import { ShuffleIcon, PlayIcon, PauseIcon } from './icons';

const DURATION = 30 * 60; // fixed 30-minute countdown, independent from the daily subject timers

interface Suggestion {
  subject: SubjectId;
  topic: string;
}

type TimerStatus = 'idle' | 'running' | 'stopped' | 'done';

export function RandomExerciseCard({ dayIndexToday }: { dayIndexToday: number }) {
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [status, setStatus] = useState<TimerStatus>('idle');
  const [remaining, setRemaining] = useState(DURATION);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (status !== 'running') return;
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          setStatus('done');
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [status]);

  const generate = () => {
    const week = currentWeekFromStart(dayIndexToday);
    const subject = SUBJECTS[Math.floor(Math.random() * SUBJECTS.length)];
    const topic = pickTopicForSubject(subject.id, week);
    setSuggestion({ subject: subject.id, topic });
    setStatus('idle');
    setRemaining(DURATION);
  };

  const subjectMeta = suggestion ? SUBJECTS.find((s) => s.id === suggestion.subject)! : null;

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-[hsl(var(--ink))] text-sm">تمرين عشوائي</h2>
        <span className="text-xs text-muted-foreground">بلا حدّ — اقترح بقدر ما تشاء</span>
      </div>

      {suggestion && (
        <div className="rounded-xl bg-muted/30 p-4 space-y-4">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 shrink-0 rounded-full bg-[hsl(var(--sprout-soft))] text-[hsl(var(--sprout))] flex items-center justify-center">
              <SubjectIcon id={suggestion.subject} size={18} />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">{subjectMeta?.name}</p>
              <p className="text-sm font-semibold text-[hsl(var(--ink))] leading-snug">{suggestion.topic}</p>
            </div>
          </div>

          {/* self-contained 30-minute countdown, separate from the daily subject timers */}
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <p className="text-3xl font-bold tabular-nums text-[hsl(var(--ink))]">{formatClock(remaining)}</p>
            <p className="text-[11px] text-muted-foreground mt-1">
              {status === 'idle' && 'مؤقّت مستقل لهذا التمرين — 30 دقيقة'}
              {status === 'running' && 'العدّ التنازلي جارٍ'}
              {status === 'stopped' && 'تم إيقاف المؤقّت'}
              {status === 'done' && 'انتهت الثلاثون دقيقة'}
            </p>

            <div className="flex items-center justify-center gap-2 mt-3">
              {status === 'idle' && (
                <TimerButton tone="ink" onClick={() => setStatus('running')}>
                  <PlayIcon size={13} /> ابدأ
                </TimerButton>
              )}
              {status === 'running' && (
                <TimerButton tone="ember" onClick={() => setStatus('stopped')}>
                  <PauseIcon size={13} /> إيقاف
                </TimerButton>
              )}
              {(status === 'stopped' || status === 'done') && (
                <TimerButton
                  tone="ink"
                  onClick={() => {
                    setRemaining(DURATION);
                    setStatus('idle');
                  }}
                >
                  <PlayIcon size={13} /> إعادة ضبط المؤقّت
                </TimerButton>
              )}
            </div>
          </div>
        </div>
      )}

      <button
        onClick={generate}
        className="w-full h-10 rounded-xl border border-border text-sm font-semibold text-[hsl(var(--ink))] flex items-center justify-center gap-2 hover:bg-muted/50 transition-colors"
      >
        <ShuffleIcon size={15} />
        {suggestion ? 'اقترح تمريناً آخر' : 'اقترح تمريناً عشوائياً'}
      </button>
    </div>
  );
}

function TimerButton({
  children,
  onClick,
  tone,
}: {
  children: React.ReactNode;
  onClick: () => void;
  tone: 'ink' | 'ember';
}) {
  const toneClass =
    tone === 'ink' ? 'bg-[hsl(var(--ink-solid))] hover:bg-[hsl(var(--ink-solid))]/90' : 'bg-[hsl(var(--ember))] hover:bg-[hsl(var(--ember))]/90';
  return (
    <button
      onClick={onClick}
      className={`h-9 px-4 rounded-full text-white text-xs font-semibold flex items-center gap-1.5 transition-colors ${toneClass}`}
    >
      {children}
    </button>
  );
}
