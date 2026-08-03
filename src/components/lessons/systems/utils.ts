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
