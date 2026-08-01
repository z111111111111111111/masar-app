import { OrderBuilder } from './OrderBuilder';
import type { RuleData } from './types';

export function RuleAssembly({ data, onSubmit, onNext }: {
  data: RuleData;
  onSubmit: (correct: boolean) => void;
  onNext: () => void;
}) {
  return (
    <OrderBuilder
      instruction={data.instruction}
      pool={data.pieces}
      correctOrder={data.correctOrder}
      answerLabel={data.answerLabel ?? "f'(x)="}
      mathStyle
      onSubmit={onSubmit}
      onNext={onNext}
    />
  );
}
