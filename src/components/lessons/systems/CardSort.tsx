import { OrderBuilder } from './OrderBuilder';
import type { SortData } from './types';

export function CardSort({ data, onSubmit, onNext }: {
  data: SortData;
  onSubmit: (correct: boolean) => void;
  onNext: () => void;
}) {
  return (
    <OrderBuilder
      instruction={data.instruction}
      hint={data.hint}
      pool={data.cards}
      correctOrder={data.correctOrder}
      answerLabel={`الترتيب الصحيح (${data.relation}):`}
      vertical
      onSubmit={onSubmit}
      onNext={onNext}
    />
  );
}
