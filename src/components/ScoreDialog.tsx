import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { SUBJECTS, type SubjectId } from '@/lib/subjects';
import { formatClock, MAX_SCORE, type DayRecord } from '@/lib/dates';
import { SubjectIcon } from './SubjectIcon';

const SCORE_OPTIONS = Array.from({ length: MAX_SCORE }, (_, i) => i + 1); // 1..10

export function ScoreDialog({
  open,
  onOpenChange,
  dateLabel,
  dayRecord,
  onLog,
  onClear,
  locked = false,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  dateLabel: string;
  dayRecord: DayRecord;
  onLog: (subject: SubjectId, score: number) => void;
  onClear: (subject: SubjectId) => void;
  /** true for "today": scoring is driven by the timer flow on the home tab instead */
  locked?: boolean;
}) {
  const [pickerFor, setPickerFor] = useState<SubjectId | null>(null);

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setPickerFor(null); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-right">{dateLabel}</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground -mt-2 mb-1">
          {locked
            ? 'نتائج اليوم تُدار عبر المؤقّت في الصفحة الرئيسية'
            : 'سجّل علامتك (من 10) في كل مادة أنجزتها — العلامة نهائية ولا يمكن تعديلها بعد إدخالها'}
        </p>
        <div className="space-y-2">
          {SUBJECTS.map((s) => {
            const sub = dayRecord[s.id];
            const logged = sub?.score;
            const alreadyScored = typeof logged === 'number';
            const rowLocked = locked || alreadyScored;
            const isPicking = pickerFor === s.id;
            return (
              <div key={s.id} className="border border-border rounded-xl overflow-hidden">
                <button
                  disabled={rowLocked}
                  className="w-full flex items-center justify-between px-3 py-2.5 bg-card hover:bg-muted/60 transition-colors disabled:cursor-default disabled:hover:bg-card"
                  onClick={() => !rowLocked && setPickerFor(isPicking ? null : s.id)}
                >
                  <span className="flex items-center gap-2 text-sm font-semibold text-[hsl(var(--ink))]">
                    <SubjectIcon id={s.id} size={16} /> {s.name}
                  </span>
                  <span className="flex items-center gap-2">
                    {sub?.timeSeconds ? (
                      <span className="text-[10px] text-muted-foreground">{formatClock(sub.timeSeconds)}</span>
                    ) : null}
                    {alreadyScored ? (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[hsl(var(--sprout-soft))] text-[hsl(var(--sprout))]">
                        {logged}/{MAX_SCORE}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">لم تُسجَّل</span>
                    )}
                  </span>
                </button>
                {isPicking && !rowLocked && (
                  <div className="px-3 pb-3 pt-1 bg-muted/30 flex flex-wrap gap-1.5">
                    {SCORE_OPTIONS.map((n) => (
                      <button
                        key={n}
                        onClick={() => { onLog(s.id, n); setPickerFor(null); }}
                        className="h-8 w-8 rounded-lg text-xs font-bold border bg-card border-border text-[hsl(var(--ink))] hover:border-[hsl(var(--sprout))] transition-colors"
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <Button variant="secondary" className="w-full mt-1" onClick={() => onOpenChange(false)}>
          تم
        </Button>
      </DialogContent>
    </Dialog>
  );
}
