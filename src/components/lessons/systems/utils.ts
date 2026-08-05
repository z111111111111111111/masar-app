import type { ExerciseData } from './types';

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Sample up to `max` exercise indices for a session. Each exercise kind gets at
// least one guaranteed item (balanced across systems); the remaining slots are
// filled randomly from the rest of the bank, then the whole session is shuffled.
// When `max` covers the entire bank the original order is preserved unchanged.
export function balancedSample(flow: ExerciseData[], max: number): number[] {
  if (max >= flow.length) return flow.map((_, i) => i);
  const groups = new Map<ExerciseData['kind'], number[]>();
  flow.forEach((ex, i) => {
    const arr = groups.get(ex.kind) ?? [];
    arr.push(i);
    groups.set(ex.kind, arr);
  });
  const picked: number[] = [];
  const used = new Set<number>();
  for (const arr of groups.values()) {
    const j = Math.floor(Math.random() * arr.length);
    const idx = arr[j];
    picked.push(idx);
    used.add(idx);
  }
  const rest = flow.map((_, i) => i).filter((i) => !used.has(i));
  const extra = shuffle(rest).slice(0, Math.max(0, max - picked.length));
  return shuffle([...picked, ...extra]);
}

// Session builder: fill-in-the-blank exercises always appear as one contiguous
// block in flow order, so multi-blank passages (a single text split into fill
// items) read sequentially instead of being scattered randomly among the other
// systems. The remaining slots are still sampled randomly with coverage.
export function buildSession(flow: ExerciseData[], max: number): number[] {
  const fillIdx = flow.map((ex, i) => (ex.kind === 'fill' ? i : -1)).filter((i) => i >= 0);
  if (fillIdx.length === 0) return balancedSample(flow, max);
  const restPool = flow.map((ex, i) => ({ ex, i })).filter(({ ex }) => ex.kind !== 'fill');
  const restMax = Math.max(0, max - fillIdx.length);
  const restSession =
    restMax >= restPool.length
      ? restPool.map((x) => x.i)
      : balancedSample(
          restPool.map((x) => x.ex),
          restMax
        )
          .map((k) => restPool[k].i)
          .slice(0, restMax);
  return [...fillIdx, ...restSession];
}
