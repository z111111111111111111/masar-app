import { useRef, useState } from 'react';
import { MathText, KaTeXBlock } from '@/components/landing/MathText';
import { SystemFrame, FeedbackBlock, ExerciseActionBar } from './SystemFrame';
import { shuffle } from './utils';

export function OrderBuilder({ instruction, hint, pool, correctOrder, answerLabel, mathStyle, vertical, index, total, onSubmit, onNext }: {
  instruction: string;
  hint?: string;
  pool: string[];
  correctOrder: string[];
  answerLabel?: string;
  mathStyle?: boolean;
  vertical?: boolean;
  index: number;
  total: number;
  onSubmit: (correct: boolean) => void;
  onNext: () => void;
}) {
  const shuffledPool = useRef(shuffle(pool)).current;
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
    onSubmit(correct);
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
      <SystemFrame index={index} total={total}>
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
            <div
              dir={mathStyle ? 'ltr' : 'rtl'}
              className={vertical
                ? 'flex flex-col items-stretch gap-2 p-3 rounded-xl bg-muted/40 border border-dashed border-border'
                : 'flex items-center justify-center gap-2 flex-wrap min-h-[48px] md:min-h-[56px] p-3 rounded-xl bg-muted/40 border border-dashed border-border'}
            >
              {correctOrder.map((_, i) =>
                order[i]
                  ? (
                    <button
                      key={i}
                      onClick={() => unpick(i)}
                      title="إزالة"
                      className={vertical
                        ? 'flex items-center gap-2 w-full rounded-lg bg-[hsl(var(--sprout))] text-white px-2.5 py-1.5 md:py-2 transition-transform hover:scale-[1.01] active:scale-[0.98]'
                        : 'cursor-pointer transition-transform hover:scale-105'}
                    >
                      {vertical && (
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/25 text-white text-xs font-bold shrink-0">
                          {i + 1}
                        </span>
                      )}
                      {vertical
                        ? (mathStyle
                            ? <span className="flex-1 text-center"><KaTeXBlock tex={order[i]} className="text-sm md:text-base" /></span>
                            : <span className="flex-1 text-center font-bold text-sm md:text-base">{order[i]}</span>)
                        : chip(order[i], 'bg-[hsl(var(--sprout))] text-white')}
                    </button>
                  )
                  : (
                    <span
                      key={i}
                      className={vertical
                        ? 'w-full h-10 rounded-lg border border-dashed border-muted-foreground/30'
                        : 'w-9 h-8 md:w-10 md:h-9 rounded-lg border border-dashed border-muted-foreground/30'}
                    />
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
