import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MathText, KaTeXBlock } from '@/components/landing/MathText';
import { SystemFrame, FeedbackBlock, CheckMark, XMark } from './SystemFrame';
import type { MCQData } from './types';

export function MultipleChoice({ data, index, total, onSubmit, onNext }: {
  data: MCQData;
  index: number;
  total: number;
  onSubmit: (correct: boolean) => void;
  onNext: () => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const correct = selected === data.correct;

  const verify = () => {
    if (selected === null || answered) return;
    setAnswered(true);
    onSubmit(correct);
  };

  return (
    <SystemFrame badge="اختيار من متعدد" index={index} total={total}>
      <div className="rounded-2xl border border-border bg-card p-4 md:p-6">
        <p className="text-base md:text-lg font-bold text-[hsl(var(--ink))] leading-relaxed mb-4 md:mb-6 text-center">
          {data.question}
        </p>

        <div className="space-y-2.5 md:space-y-3">
          {data.options.map((opt, i) => {
            const isCorrect = i === data.correct;
            const isSelected = i === selected;
            let ring = 'border-border hover:border-[hsl(var(--sprout))]/50';
            let bg = 'bg-card';
            if (answered) {
              if (isCorrect) { ring = 'border-[hsl(var(--sprout))]'; bg = 'bg-[hsl(var(--sprout))]/10'; }
              else if (isSelected) { ring = 'border-[hsl(var(--coral))]'; bg = 'bg-[hsl(var(--coral))]/10'; }
              else { ring = 'border-border opacity-40'; }
            } else if (isSelected) {
              ring = 'border-[hsl(var(--sprout))]'; bg = 'bg-[hsl(var(--sprout))]/5';
            }
            return (
              <button
                key={i}
                onClick={() => { if (!answered) setSelected(i); }}
                disabled={answered}
                className={`w-full p-3 md:p-4 rounded-xl border ${ring} ${bg} transition-all text-sm md:text-base font-bold text-[hsl(var(--ink))] disabled:cursor-default text-center`}
              >
                <span className="inline-flex items-center gap-2 md:gap-2.5">
                  <span className={`w-6 h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center shrink-0 ${
                    answered && isCorrect ? 'bg-[hsl(var(--sprout))] text-white' :
                    answered && isSelected ? 'bg-[hsl(var(--coral))] text-white' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {answered && isCorrect ? <CheckMark /> : answered && isSelected ? <XMark /> : (
                      <span className="text-xs font-bold">{String.fromCharCode(1571 + i)}</span>
                    )}
                  </span>
                  <span dir="ltr"><KaTeXBlock tex={opt} className="text-base md:text-lg" /></span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {selected !== null && !answered && (
        <Button onClick={verify} variant="default" className="w-full h-11 rounded-xl animate-[pop-in_0.2s_ease-out]">
          تحقق
        </Button>
      )}

      {answered && (
        <FeedbackBlock
          correct={correct}
          explanation={<MathText tex={data.explanation} className="text-xs leading-relaxed text-[hsl(var(--ink))]" />}
          actions={<Button onClick={onNext} variant="default" className="w-full h-11 rounded-xl">متابعة</Button>}
        />
      )}
    </SystemFrame>
  );
}
