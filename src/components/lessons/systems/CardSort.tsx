import { OrderBuilder } from './OrderBuilder';
import type { SortData } from './types';

export function CardSort({ data, index, total, onSubmit, onNext }: {
  data: SortData;
  index: number;
  total: number;
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
      index={index}
      total={total}
      onSubmit={onSubmit}
      onNext={onNext}
    />
  );
}
