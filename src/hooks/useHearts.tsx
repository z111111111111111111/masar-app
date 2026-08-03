import { createContext, useContext, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useQuery_experimental as useQuerySafe, useMutation } from 'convex/react';
import { api } from 'convex/_generated/api';

export const MAX_HEARTS = 15;
export const HEART_REFILL_MS = 10 * 60 * 60 * 1000; // 1 heart every 10 hours
export const FULL_REFILL_COST = 50;

interface HeartsSnapshot {
  hearts: number;
  maxHearts: number;
  lastHeartAt: number;
  refillMs: number;
  nextRefillAt: number | null;
  refillCost: number;
  fullRefillCost: number;
  jewels: number;
}

interface HeartsValue {
  hearts: number;
  maxHearts: number;
  refillMs: number;
  nextRefillAt: number | null;
  refillCost: number;
  fullRefillCost: number;
  jewels: number;
  loseHeart: () => Promise<boolean>;
  refillHearts: (count?: number) => Promise<boolean>;
  awardStage: (stageId: string) => Promise<boolean>;
}

const HeartsContext = createContext<HeartsValue | null>(null);

export function useHearts(): HeartsValue {
  const v = useContext(HeartsContext);
  if (!v) throw new Error('useHearts must be used inside HeartsProvider');
  return v;
}

export function HeartsProvider({ children }: { children: ReactNode }) {
  const query = useQuerySafe({ query: api.progress.getHearts, args: { now: Date.now() } });
  const snapshot: HeartsSnapshot | null = query.status === 'success' ? query.data : null;

  const loseHeartMut = useMutation(api.progress.loseHeart);
  const refillMut = useMutation(api.progress.refillHearts);
  const awardMut = useMutation(api.progress.awardStageCompletion);

  // Local copy so mutations update the UI instantly (no wait for refetch).
  const [local, setLocal] = useState<HeartsSnapshot | null>(null);
  // Latest server snapshot without making callbacks depend on it (it changes
  // every second via `now`), so mutations can still seed state even when the
  // initial query hasn't delivered data yet.
  const snapshotRef = useRef<HeartsSnapshot | null>(null);
  snapshotRef.current = snapshot;
  useEffect(() => {
    if (snapshot) setLocal(snapshot);
  }, [snapshot]);

  // Ticking clock so the heart countdown advances live without re-querying.
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const base = local ?? snapshot;
  const hearts = base
    ? Math.min(base.maxHearts, base.hearts + Math.max(0, Math.floor((Date.now() - base.lastHeartAt) / base.refillMs)))
    : MAX_HEARTS;
  const nextRefillAt = base && hearts < base.maxHearts ? base.lastHeartAt + base.refillMs : null;

  const loseHeart = useCallback(async () => {
    try {
      const res = await loseHeartMut();
      setLocal((prev) => {
        const seed = prev ?? snapshotRef.current;
        const now = Date.now();
        return {
          hearts: res.hearts,
          maxHearts: seed?.maxHearts ?? MAX_HEARTS,
          lastHeartAt: now,
          refillMs: seed?.refillMs ?? HEART_REFILL_MS,
          nextRefillAt: now + (seed?.refillMs ?? HEART_REFILL_MS),
          refillCost: seed?.refillCost ?? FULL_REFILL_COST,
          fullRefillCost: seed?.fullRefillCost ?? FULL_REFILL_COST,
          jewels: seed?.jewels ?? 20,
        };
      });
      return true;
    } catch (e) {
      console.error('loseHeart failed:', e);
      return false;
    }
  }, [loseHeartMut]);

  const refillHearts = useCallback(async (count?: number) => {
    try {
      const res = await refillMut({ hearts: count ?? MAX_HEARTS });
      setLocal((prev) => {
        const seed = prev ?? snapshotRef.current;
        return {
          hearts: res.hearts,
          maxHearts: seed?.maxHearts ?? MAX_HEARTS,
          lastHeartAt: Date.now(),
          refillMs: seed?.refillMs ?? HEART_REFILL_MS,
          nextRefillAt: null,
          refillCost: seed?.refillCost ?? FULL_REFILL_COST,
          fullRefillCost: seed?.fullRefillCost ?? FULL_REFILL_COST,
          jewels: res.jewels,
        };
      });
      return true;
    } catch (e) {
      console.error('refillHearts failed:', e);
      return false;
    }
  }, [refillMut]);

  const awardStage = useCallback(async (stageId: string) => {
    try {
      const res = await awardMut({ stageId });
      setLocal((prev) => {
        const seed = prev ?? snapshotRef.current;
        if (!seed) return null;
        return { ...seed, jewels: res.jewels };
      });
      return res.awarded;
    } catch (e) {
      console.error('awardStage failed:', e);
      return false;
    }
  }, [awardMut]);

  const value = useMemo<HeartsValue>(
    () => ({
      hearts,
      maxHearts: base?.maxHearts ?? MAX_HEARTS,
      refillMs: base?.refillMs ?? HEART_REFILL_MS,
      nextRefillAt,
      refillCost: base?.refillCost ?? FULL_REFILL_COST,
      fullRefillCost: FULL_REFILL_COST,
      jewels: base?.jewels ?? 20,
      loseHeart,
      refillHearts,
      awardStage,
    }),
    [hearts, base, nextRefillAt, loseHeart, refillHearts, awardStage]
  );

  return <HeartsContext.Provider value={value}>{children}</HeartsContext.Provider>;
}
