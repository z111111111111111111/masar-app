import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SystemFrame, FeedbackBlock } from './SystemFrame';
import type { TrueFalseData } from './types';

export function TrueFalse({ data, index, total, onSubmit, onNext }: {
  data: TrueFalseData;
  index: number;
  total: number;
  onSubmit: (correct: boolean) => void;
  onNext: () => void;
}) {
  const [selected, setSelected] = useState<boolean | null>(null);
  const [answered, setAnswered] = useState(false);
  const correct = selected === data.isTrue;

  const choose = (val: boolean) => {
    if (answered) return;
    setSelected(val);
    setAnswered(true);
    onSubmit(val === data.isTrue);
  };

  return (
    <SystemFrame badge="صحيح أو خطأ" index={index} total={total}>
      <div className="rounded-2xl border border-border bg-card p-6">
        <p className="text-lg font-bold text-[hsl(var(--ink))] leading-relaxed text-center mb-6">
          {data.statement}
        </p>

        <div className="grid grid-cols-2 gap-3">
          <Button
            variant={selected === true ? (correct ? 'sprout' : 'destructive') : 'outline'}
            className={`h-16 rounded-xl text-base ${answered && selected === true ? '' : 'hover:scale-[1.02]'}`}
            onClick={() => choose(true)}
            disabled={answered && selected !== true}
          >
            صحيح
          </Button>
          <Button
            variant={selected === false ? (correct ? 'sprout' : 'destructive') : 'outline'}
            className={`h-16 rounded-xl text-base ${answered && selected === false ? '' : 'hover:scale-[1.02]'}`}
            onClick={() => choose(false)}
            disabled={answered && selected !== false}
          >
            خطأ
          </Button>
        </div>
      </div>

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
