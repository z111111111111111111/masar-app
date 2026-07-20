import { daysUntilExam, examDate, formatArabicShort, TOTAL_DAYS } from '@/lib/dates';

export function ExamCountdownCard({ startDate, dayIndexToday }: { startDate: string; dayIndexToday: number }) {
  const todayISO = new Date().toISOString().slice(0, 10);
  const daysLeft = daysUntilExam(startDate, todayISO);
  const exam = examDate(startDate);
  const progress = Math.min(1, Math.max(0, dayIndexToday / TOTAL_DAYS));

  return (
    <div className="rounded-2xl border border-border bg-card px-6 py-8 text-center">
      <p className="text-[11px] tracking-[0.2em] text-muted-foreground uppercase mb-3">العد التنازلي للبكالوريا</p>
      <p className="text-6xl font-light tabular-nums text-[hsl(var(--ink))] leading-none">{daysLeft}</p>
      <p className="text-sm text-muted-foreground mt-2">{daysLeft <= 1 ? 'يوم واحد متبقٍ' : 'يوماً متبقياً حتى الامتحان'}</p>

      <div className="h-px bg-border my-6" />

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>البداية</span>
        <span>يوم الامتحان · {formatArabicShort(exam)}</span>
      </div>
      <div className="h-1 rounded-full bg-muted overflow-hidden mt-2">
        <div className="h-full bg-[hsl(var(--ink))] rounded-full transition-all" style={{ width: `${progress * 100}%` }} />
      </div>
    </div>
  );
}
