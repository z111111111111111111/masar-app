import { useState } from 'react';
import { MathText } from '@/components/landing/MathText';
import { SystemFrame, FeedbackBlock, ExerciseActionBar } from './SystemFrame';
import type { TrueFalseData } from './types';

export function TrueFalse({ data, onSubmit, onNext }: {
  data: TrueFalseData;
  onSubmit: (correct: boolean) => void;
  onNext: () => void;
}) {
  const [selected, setSelected] = useState<boolean | null>(null);
  const [answered, setAnswered] = useState(false);
  const correct = selected === data.isTrue;

  const verify = () => {
    if (selected === null || answered) return;
    setAnswered(true);
    onSubmit(correct);
  };

  const optClass = (val: boolean): string => {
    const isSelected = selected === val;
    if (answered) {
      const isCorrect = val === data.isTrue;
      if (isCorrect) return 'border-[hsl(var(--sprout))] bg-[hsl(var(--sprout))] text-white shadow-[0_3px_0_hsl(var(--sprout-dark))]';
      if (isSelected) return 'border-[hsl(var(--coral))] bg-[hsl(var(--coral))] text-white shadow-[0_3px_0_hsl(var(--coral-dark))]';
      return 'border-border bg-card text-muted-foreground opacity-40 shadow-none';
    }
    if (isSelected) return 'border-[hsl(var(--sprout))] bg-[hsl(var(--sprout))] text-white shadow-[0_3px_0_hsl(var(--sprout-dark))] active:translate-y-[2px] active:shadow-[0_1px_0_hsl(var(--sprout-dark))]';
    return 'border-border bg-card text-[hsl(var(--ink))] hover:border-[hsl(var(--sprout))]/60 shadow-[0_3px_0_hsl(var(--border))] active:translate-y-[2px] active:shadow-[0_1px_0_hsl(var(--border))]';
  };

  return (
    <>
      <SystemFrame>
        <div className="rounded-2xl border border-border bg-card p-4 md:p-6">
          <p className="text-base md:text-lg font-bold text-[hsl(var(--ink))] leading-relaxed text-center mb-4 md:mb-6">
            {data.statement}
          </p>

          <div className="grid grid-cols-2 gap-2 md:gap-3">
            <button
              onClick={() => { if (!answered) setSelected(true); }}
              disabled={answered}
              className={`h-12 md:h-16 rounded-xl border-2 font-bold text-sm md:text-base transition-all duration-100 disabled:cursor-default ${optClass(true)}`}
            >
              صحيح
            </button>
            <button
              onClick={() => { if (!answered) setSelected(false); }}
              disabled={answered}
              className={`h-12 md:h-16 rounded-xl border-2 font-bold text-sm md:text-base transition-all duration-100 disabled:cursor-default ${optClass(false)}`}
            >
              خطأ
            </button>
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
            explanation={<MathText tex={data.explanation} className="text-xs leading-relaxed text-[hsl(var(--ink))]" />}
          />
        ) : undefined}
      />
    </>
  );
}
