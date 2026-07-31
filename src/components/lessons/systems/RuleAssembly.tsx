import { OrderBuilder } from './OrderBuilder';
import type { RuleData } from './types';

export function RuleAssembly({ data, index, total, onSubmit, onNext }: {
  data: RuleData;
  index: number;
  total: number;
  onSubmit: (correct: boolean) => void;
  onNext: () => void;
}) {
  return (
    <OrderBuilder
      badge="تركيب القاعدة"
      instruction={data.instruction}
      pool={data.pieces}
      correctOrder={data.correctOrder}
      answerLabel={data.answerLabel ?? "f'(x) ="}
      mathStyle
      index={index}
      total={total}
      onSubmit={onSubmit}
      onNext={onNext}
    />
  );
}
