import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SystemFrame, FeedbackBlock } from './SystemFrame';
import type { FillData } from './types';

export function FillBlank({ data, index, total, onSubmit, onNext }: {
  data: FillData;
  index: number;
  total: number;
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
    <SystemFrame badge="ملء الفراغ" index={index} total={total}>
      <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
        <p className="text-base font-bold text-[hsl(var(--ink))] leading-relaxed text-center flex items-center justify-center gap-2 flex-wrap">
          {data.before}
          <span
            dir="ltr"
            className={`inline-flex items-center justify-center min-w-[84px] px-3 py-1.5 rounded-lg border-2 font-mono font-bold text-sm transition-colors ${
              selected
                ? 'border-[hsl(var(--sprout))] bg-[hsl(var(--sprout-soft))] text-[hsl(var(--ink))]'
                : 'border-dashed border-muted-foreground/40 text-muted-foreground'
            }`}
          >
            {selected ?? '؟'}
          </span>
          {data.after}
        </p>

        <div className="grid grid-cols-2 gap-2.5">
          {data.choices.map((c) => {
            const isSelected = c === selected;
            const isCorrect = c === data.correct;
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
                key={c}
                onClick={() => { if (!answered) setSelected(c); }}
                disabled={answered}
                className={`h-12 rounded-xl border ${ring} ${bg} transition-all font-mono font-bold text-sm text-[hsl(var(--ink))] disabled:cursor-default`}
                dir="ltr"
              >
                {c}
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
          explanation={data.explanation}
          actions={<Button onClick={onNext} variant="default" className="w-full h-11 rounded-xl">متابعة</Button>}
        />
      )}
    </SystemFrame>
  );
}
