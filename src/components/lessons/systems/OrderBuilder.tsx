import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { MathText, KaTeXBlock } from '@/components/landing/MathText';
import { SystemFrame, FeedbackBlock, ExerciseActionBar } from './SystemFrame';
import { shuffle } from './utils';

export function OrderBuilder({ badge, instruction, hint, pool, correctOrder, answerLabel, mathStyle, index, total, onSubmit, onNext }: {
  badge: string;
  instruction: string;
  hint?: string;
  pool: string[];
  correctOrder: string[];
  answerLabel?: string;
  mathStyle?: boolean;
  index: number;
  total: number;
  onSubmit: (correct: boolean) => void;
  onNext: () => void;
}) {
  const shuffledPool = useRef(shuffle(pool)).current;
  const submittedRef = useRef(false);
  const [order, setOrder] = useState<string[]>([]);
  const [answered, setAnswered] = useState(false);

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
    if (!submittedRef.current) {
      submittedRef.current = true;
      onSubmit(correct);
    }
  };

  const reset = () => {
    setOrder([]);
    setAnswered(false);
  };

  const chip = (label: string, extra = '') => (
    <span
      dir={mathStyle ? 'ltr' : undefined}
      className={`inline-flex items-center justify-center px-2.5 md:px-3 py-1 md:py-1.5 rounded-lg font-bold ${extra}`}
    >
      {mathStyle ? <KaTeXBlock tex={label} className="text-sm md:text-base" /> : label}
    </span>
  );

  return (
    <>
      <SystemFrame badge={badge} index={index} total={total}>
        <div className="rounded-2xl border border-border bg-card p-4 md:p-6 space-y-4 md:space-y-5">
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
            <div dir={mathStyle ? 'ltr' : 'rtl'} className="flex items-center justify-center gap-2 flex-wrap min-h-[48px] md:min-h-[56px] p-3 rounded-xl bg-muted/40 border border-dashed border-border">
              {correctOrder.map((_, i) =>
                order[i]
                  ? (
                    <button key={i} onClick={() => unpick(i)} className="cursor-pointer transition-transform hover:scale-105" title="إزالة">
                      {chip(order[i], 'bg-[hsl(var(--sprout))] text-white')}
                    </button>
                  )
                  : (
                    <span key={i} className="w-9 h-8 md:w-10 md:h-9 rounded-lg border border-dashed border-muted-foreground/30" />
                  )
              )}
            </div>
          </div>

          {/* Pool */}
          <div dir={mathStyle ? 'ltr' : 'rtl'} className="flex items-center justify-center gap-2 flex-wrap">
            {remaining.map((p) => (
              <button
                key={p}
                onClick={() => pick(p)}
                className="transition-transform hover:scale-105 active:scale-95"
              >
                {chip(p, 'bg-card border border-border shadow-sm hover:border-[hsl(var(--sprout))] text-[hsl(var(--ink))]')}
              </button>
            ))}
            {remaining.length === 0 && (
              <span className="text-xs text-muted-foreground">اكتمل الترتيب</span>
            )}
          </div>
        </div>

        {answered && (
          <FeedbackBlock
            correct={correct}
            explanation={
              correct
                ? undefined
                : (
                  <span className="block">
                    الترتيب الصحيح:{' '}
                    <span dir={mathStyle ? 'ltr' : 'rtl'} className="inline-flex gap-1.5 font-bold">
                      {correctOrder.map((p, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-card border border-border">
                          {mathStyle ? <KaTeXBlock tex={p} className="text-sm" /> : p}
                        </span>
                      ))}
                    </span>
                  </span>
                )
            }
            retry={!correct ? (
              <Button onClick={reset} variant="secondary" className="w-full h-11 rounded-xl">
                إعادة المحاولة
              </Button>
            ) : undefined}
          />
        )}
      </SystemFrame>

      <ExerciseActionBar canCheck={canCheck} answered={answered} onCheck={verify} onNext={onNext} />
    </>
  );
}
