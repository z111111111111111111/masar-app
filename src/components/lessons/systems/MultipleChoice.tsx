import { useMemo, useState } from 'react';
import { MathText } from '@/components/landing/MathText';
import { OptionText } from './OptionText';
import { SystemFrame, FeedbackBlock, ExerciseActionBar, CheckMark, XMark } from './SystemFrame';
import { useExerciseHelpers, ExerciseHelpersBar } from './ExerciseHelpers';
import type { MCQData } from './types';

export function MultipleChoice({ data, onSubmit, onNext }: {
  data: MCQData;
  onSubmit: (correct: boolean) => void;
  onNext: () => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const { hintCount } = useExerciseHelpers();
  const correct = selected === data.correct;

  // Hint: remove one wrong option per use, keeping the correct one always.
  const visibleOptions = useMemo(() => {
    const all = data.options.map((text, i) => ({ text, idx: i }));
    if (hintCount === 0) return all;
    const wrong = all.filter((o) => o.idx !== data.correct);
    const keepWrong = Math.max(0, wrong.length - hintCount);
    return [all[data.correct], ...wrong.slice(0, keepWrong)].sort((a, b) => a.idx - b.idx);
  }, [hintCount, data]);

  const verify = () => {
    if (selected === null || answered) return;
    setAnswered(true);
    onSubmit(correct);
  };

  return (
    <>
      <SystemFrame>
        <div className="rounded-2xl border border-border bg-card p-4 md:p-6">
          <p className="text-base md:text-lg font-bold text-[hsl(var(--ink))] leading-relaxed mb-4 md:mb-6 text-center">
            {data.question}
          </p>

          {hintCount > 0 && !answered && (
            <p className="text-center text-[11px] font-bold text-[hsl(var(--ember))] mb-3">
              💡 استعملتَ التلميح: بقي أمامك {visibleOptions.length === 1 ? 'خيار واحد' : visibleOptions.length === 2 ? 'خياران' : `${visibleOptions.length} خيارات`}
            </p>
          )}

          <div className="space-y-2.5 md:space-y-3">
            {visibleOptions.map((opt) => {
              const i = opt.idx;
              const isCorrect = i === data.correct;
              const isSelected = i === selected;
              return (
                <button
                  key={i}
                  onClick={() => { if (!answered) setSelected(i); }}
                  disabled={answered}
                  className={`w-full h-14 md:h-16 rounded-xl border-2 transition-all duration-100 text-sm md:text-base font-bold text-center disabled:cursor-default ${
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
                >
                  <span className="inline-flex items-center gap-2.5 justify-center">
                    <span className={`w-6 h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center shrink-0 ${
                      answered && isCorrect ? 'bg-white/25 text-white' :
                      answered && isSelected ? 'bg-white/25 text-white' :
                      isSelected ? 'bg-white/25 text-white' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {answered && isCorrect ? <CheckMark /> : answered && isSelected ? <XMark /> : (
                        <span className="text-xs font-bold">{String.fromCharCode(1571 + i)}</span>
                      )}
                    </span>
                    <OptionText tex={opt.text} className="text-base md:text-lg" />
                  </span>
                </button>
              );
            })}
          </div>

          <ExerciseHelpersBar />
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
            correctAnswer={<OptionText tex={data.options[data.correct]} className="text-sm" />}
            explanation={<MathText tex={data.explanation} className="text-xs leading-relaxed text-[hsl(var(--ink))]" />}
          />
        ) : undefined}
      />
    </>
  );
}
