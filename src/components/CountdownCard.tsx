import { useEffect, useState } from 'react';
import { formatClock, secondsUntilMidnight } from '@/lib/dates';
import { SUBJECTS } from '@/lib/subjects';
import { CheckCircleIcon, WarningIcon, FlameIcon } from './icons';

export function CountdownCard({ finishedCount }: { finishedCount: number }) {
  const [remaining, setRemaining] = useState(() => secondsUntilMidnight(new Date()));

  useEffect(() => {
    const id = setInterval(() => setRemaining(secondsUntilMidnight(new Date())), 1000);
    return () => clearInterval(id);
  }, []);

  const total = SUBJECTS.length;
  const complete = finishedCount >= total;
  const urgent = !complete && remaining < 3 * 3600; // last 3 hours, streak not secured yet

  return (
    <div className="rounded-2xl border border-border bg-card px-4 py-3.5 space-y-3">
      <div className="flex items-center gap-3">
        {complete ? (
          <CheckCircleIcon className="text-[hsl(var(--sprout))] shrink-0" />
        ) : urgent ? (
          <WarningIcon className="text-[hsl(var(--coral))] shrink-0" />
        ) : (
          <FlameIcon className="text-[hsl(var(--ember))] shrink-0" />
        )}
        <div className="flex-1">
          <p
            className={`text-sm font-semibold ${
              complete ? 'text-[hsl(var(--sprout))]' : urgent ? 'text-[hsl(var(--coral))]' : 'text-[hsl(var(--ink))]'
            }`}
          >
            {complete
              ? 'حماستك مكتملة اليوم'
              : finishedCount === 0
              ? 'لم تحل أي مادة اليوم بعد'
              : `أنجزت ${finishedCount} من ${total} مواد اليوم`}
          </p>
          <p className="text-xs text-muted-foreground">
            {complete
              ? 'أتممت المواد الخمس — سلسلتك محفوظة اليوم'
              : 'كل مادة تُنهيها تملأ جزءاً من حماسة اليوم — أكملها كلها قبل منتصف الليل'}
          </p>
        </div>
        {!complete && (
          <span className={`font-bold tabular-nums text-sm ${urgent ? 'text-[hsl(var(--coral))]' : 'text-[hsl(var(--ink))]'}`}>
            {formatClock(remaining)}
          </span>
        )}
      </div>

      {/* streak split into 5 segments, one per subject */}
      <div className="flex gap-1.5">
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i < finishedCount ? (complete ? 'bg-[hsl(var(--sprout))]' : 'bg-[hsl(var(--ember))]') : 'bg-muted'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
