import { useState } from 'react';
import { MathText } from '@/components/landing/MathText';
import { OptionText } from './OptionText';
import { SystemFrame, FeedbackBlock, ExerciseActionBar } from './SystemFrame';
import type { FillData } from './types';

export function FillBlank({ data, onSubmit, onNext }: {
  data: FillData;
  onSubmit: (correct: boolean) => void;
  onNext: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const correct = selected === data.correct;

  const verify = () => {
    if (selected === null || answered) return;
    setAnswered(true);
    onSubmit(correct);
  };

  return (
    <>
      <SystemFrame>
        <div className="rounded-2xl border border-border bg-card p-4 md:p-6 space-y-4 md:space-y-5">
          <p className="text-sm md:text-base font-bold text-[hsl(var(--ink))] leading-relaxed text-center flex items-center justify-center gap-2 flex-wrap">
            {data.before}
            <span
              dir="ltr"
              className={`inline-flex items-center justify-center min-w-[72px] md:min-w-[84px] px-2.5 md:px-3 py-0.5 md:py-1 rounded-lg border-2 transition-colors ${
                answered && correct
                  ? 'border-[hsl(var(--sprout))] bg-[hsl(var(--sprout))] text-white'
                  : answered
                    ? 'border-[hsl(var(--coral))] bg-[hsl(var(--coral))] text-white'
                    : selected
                      ? 'border-[hsl(var(--sprout))] bg-[hsl(var(--sprout))] text-white'
                      : 'border-dashed border-muted-foreground/40 text-muted-foreground'
              }`}
            >
              {selected ? <OptionText tex={selected} className="text-sm md:text-base" /> : <span className="text-sm font-bold">؟</span>}
            </span>
            {data.after}
          </p>

          <div className="grid grid-cols-2 gap-2 md:gap-2.5">
            {data.choices.map((c) => {
              const isSelected = c === selected;
              const isCorrect = c === data.correct;
              return (
                <button
                  key={c}
                  onClick={() => { if (!answered) setSelected(c); }}
                  disabled={answered}
                  className={`h-11 md:h-14 rounded-xl border-2 transition-all duration-100 disabled:cursor-default ${
                    answered
                      ? isCorrect
                        ? 'border-[hsl(var(--sprout))] bg-[hsl(var(--sprout))] text-white shadow-[0_3px_0_hsl(var(--sprout-dark))]'
                        : isSelected
                          ? 'border-[hsl(var(--coral))] bg-[hsl(var(--coral))] text-white shadow-[0_3px_0_hsl(var(--coral-dark))]'
                          : 'border-border bg-card text-muted-foreground opacity-40 shadow-none'
                      : isSelected
                        ? 'border-[hsl(var(--sprout))] bg-[hsl(var(--sprout))] text-white shadow-[0_3px_0_hsl(var(--sprout-dark))] active:translate-y-[2px] active:shadow-[0_1px_0_hsl(var(--sprout-dark))]'
                        : 'border-border bg-card text-[hsl(var(--ink))] hover:border-[hsl(var(--sprout))]/60 shadow-[0_3px_0_hsl(var(--border))] active:translate-y-[2px] active:shadow-[0_1px_0_hsl(var(--border))]'
                  }`}
                  dir="ltr"
                >
                  <OptionText tex={c} className="text-sm md:text-base font-bold" />
                </button>
              );
            })}
          </div>
        </div>
      </SystemFrame>

      <ExerciseActionBar
        canCheck={selected !== null}
        answered={answered}
        onCheck={verify}
        onNext={onNext}
        feedback={answered ? (
          <FeedbackBlock
            correct={correct}
            correctAnswer={<OptionText tex={data.correct} className="text-sm" />}
            explanation={<MathText tex={data.explanation} className="text-xs leading-relaxed text-[hsl(var(--ink))]" />}
          />
        ) : undefined}
      />
    </>
  );
}
