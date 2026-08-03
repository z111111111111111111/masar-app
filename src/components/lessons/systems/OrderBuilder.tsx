import { useEffect, useRef, useState } from 'react';
import { MathText, KaTeXBlock } from '@/components/landing/MathText';
import { SystemFrame, FeedbackBlock, ExerciseActionBar } from './SystemFrame';
import { useExerciseHelpers, ExerciseHelpersBar } from './ExerciseHelpers';
import { shuffle } from './utils';

export function OrderBuilder({ instruction, hint, note, pool, correctOrder, answerLabel, mathStyle, vertical, onSubmit, onNext }: {
  instruction: string;
  hint?: string;
  note?: string;
  pool: string[];
  correctOrder: string[];
  answerLabel?: string;
  mathStyle?: boolean;
  vertical?: boolean;
  onSubmit: (correct: boolean) => void;
  onNext: () => void;
}) {
  const shuffledPool = useRef(shuffle(pool)).current;
  const [order, setOrder] = useState<string[]>([]);
  const [answered, setAnswered] = useState(false);
  const { hintCount } = useExerciseHelpers();

  // Hint: place the next piece/card of the correct order into its slot — one
  // per use, so the hint can be applied repeatedly as long as jewels allow.
  useEffect(() => {
    if (hintCount === 0 || correctOrder.length === 0) return;
    const k = Math.min(hintCount, correctOrder.length);
    setOrder((o) => {
      let next = [...o];
      for (let i = 0; i < k; i++) {
        if (next[i] === correctOrder[i]) continue;
        const filtered = next.filter((p) => p !== correctOrder[i]);
        filtered.splice(i, 0, correctOrder[i]);
        next = filtered;
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hintCount, correctOrder]);

  const remaining = shuffledPool.filter((p) => !order.includes(p));
  const correct = order.length === correctOrder.length && order.every((p, i) => p === correctOrder[i]);
  const canCheck = order.length === correctOrder.length;

  const pick = (p: string) => {
    if (answered) return;
    setOrder((o) => [...o, p]);
  };

  const unpick = (i: number) => {
    if (answered) return;
    setOrder((o) => o.filter((_, idx) => idx !== i));
  };

  const verify = () => {
    if (answered || !canCheck) return;
    setAnswered(true);
    onSubmit(correct);
  };

  /* Duolingo-style 3D press button — same look for pool and placed chips */
  const chipBtn = 'inline-flex items-center justify-center gap-1.5 rounded-xl border-2 border-border bg-card text-[hsl(var(--ink))] shadow-[0_3px_0_hsl(var(--border))] font-bold transition-all duration-100 hover:border-[hsl(var(--sprout))]/60 active:translate-y-[2px] active:shadow-[0_1px_0_hsl(var(--border))] disabled:cursor-default';

  const chipContent = (label: string) =>
    mathStyle
      ? <KaTeXBlock tex={label} className="text-sm md:text-base" />
      : <span className="text-sm md:text-base">{label}</span>;

  return (
    <>
      <SystemFrame>
        <div className="rounded-2xl border border-border bg-card p-3 md:p-5 space-y-3 md:space-y-4">
          <MathText
            tex={instruction}
            className="text-base md:text-lg font-bold text-[hsl(var(--ink))] leading-relaxed text-center"
          />
          {hint && <p className="text-xs text-muted-foreground text-center">{hint}</p>}

          {/* Answer slots */}
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-2">
              {mathStyle
                ? <KaTeXBlock tex={answerLabel ?? "f'(x)="} className="text-sm text-muted-foreground" />
                : <span className="text-xs text-muted-foreground font-semibold">{answerLabel ?? 'الترتيب الصحيح:'}</span>}
            </div>
            <div
              dir={mathStyle ? 'ltr' : 'rtl'}
              className={vertical
                ? 'flex flex-col items-stretch gap-2 p-3 rounded-xl bg-muted/40 border border-dashed border-border'
                : 'flex items-center justify-center gap-2 flex-wrap min-h-[48px] md:min-h-[56px] p-3 rounded-xl bg-muted/40 border border-dashed border-border'}
            >
              {correctOrder.map((_, i) =>
                order[i]
                  ? vertical
                    ? (
                      <div key={i} className="flex items-center justify-center gap-2">
                        <span className="w-6 shrink-0 text-center text-[11px] font-bold text-[hsl(var(--sprout))]">{i + 1}</span>
                        <button
                          onClick={() => unpick(i)}
                          title="إزالة"
                          disabled={answered}
                          className={`${chipBtn} flex-1 px-3 py-2.5`}
                        >
                          {chipContent(order[i])}
                        </button>
                      </div>
                    )
                    : (
                      <button
                        key={i}
                        onClick={() => unpick(i)}
                        title="إزالة"
                        disabled={answered}
                        className={`${chipBtn} px-3 py-2`}
                      >
                        {chipContent(order[i])}
                      </button>
                    )
                  : vertical
                    ? (
                      <div key={i} className="flex items-center justify-center gap-2">
                        <span className="w-6 shrink-0 text-center text-[11px] font-bold text-muted-foreground/60">{i + 1}</span>
                        <span className="flex-1 h-11 rounded-xl border-2 border-dashed border-muted-foreground/30" />
                      </div>
                    )
                    : (
                      <span key={i} className="w-9 h-10 md:w-10 md:h-11 rounded-xl border-2 border-dashed border-muted-foreground/30" />
                    )
              )}
            </div>
          </div>

          {/* Pool */}
          <div dir={mathStyle ? 'ltr' : 'rtl'} className="flex items-center justify-center gap-2 flex-wrap">
            {remaining.map((p) => (
              <button key={p} onClick={() => pick(p)} disabled={answered} className={`${chipBtn} px-3 py-2`}>
                {chipContent(p)}
              </button>
            ))}
            {remaining.length === 0 && (
              <span className="text-xs text-muted-foreground">اكتمل الترتيب</span>
            )}
          </div>

          {/* Footnote — e.g. the dot (·) means multiplication (×) */}
          {note && (
            <MathText tex={note} className="block text-center text-[11px] text-muted-foreground" />
          )}

          <ExerciseHelpersBar />
        </div>
      </SystemFrame>

      <ExerciseActionBar
        canCheck={canCheck}
        answered={answered}
        onCheck={verify}
        onNext={onNext}
        feedback={answered ? (
          <FeedbackBlock
            correct={correct}
            explanation={
              correct
                ? undefined
                : (
                  <span className="block">
                    الترتيب الصحيح:{' '}
                    <span dir={mathStyle ? 'ltr' : 'rtl'} className="inline-flex gap-1.5 font-bold flex-wrap">
                      {correctOrder.map((p, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-card border border-border">
                          {mathStyle ? <KaTeXBlock tex={p} className="text-sm" /> : p}
                        </span>
                      ))}
                    </span>
                  </span>
                )
            }
          />
        ) : undefined}
      />
    </>
  );
}
