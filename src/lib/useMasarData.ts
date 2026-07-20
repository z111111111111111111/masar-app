import { useEffect, useState, useCallback } from 'react';
import { storageGet, storageSet, storageList } from './storage';
import { toISODate, computeStreak, computeTotalXP, liveElapsed, type RecordsMap, type SubjectDayRecord } from './dates';
import type { SubjectId } from './subjects';

export interface Profile {
  userId: string;
  name: string;
  startDate: string; // ISO date of first use — anchors the 9-month path
  createdAt: string;
}

interface MasarState {
  loading: boolean;
  profile: Profile | null;
  records: RecordsMap;
  streak: number;
  bestStreak: number;
  xp: number;
}

function makeUserId() {
  return 'u_' + Math.random().toString(36).slice(2, 10);
}

function recompute(records: RecordsMap, bestStreakSoFar: number) {
  const todayISO = toISODate(new Date());
  const streak = computeStreak(records, todayISO);
  const xp = computeTotalXP(records);
  return { streak, xp, bestStreak: Math.max(bestStreakSoFar, streak) };
}

export function useMasarData() {
  const [state, setState] = useState<MasarState>({
    loading: true,
    profile: null,
    records: {},
    streak: 0,
    bestStreak: 0,
    xp: 0,
  });

  useEffect(() => {
    (async () => {
      const profile = await storageGet<Profile>('profile');
      const records = (await storageGet<RecordsMap>('records')) ?? {};
      const bestStreak = (await storageGet<number>('bestStreak')) ?? 0;
      const derived = recompute(records, bestStreak);
      setState({ loading: false, profile, records, ...derived });
    })();
  }, []);

  const persist = useCallback((records: RecordsMap, bestStreak: number) => {
    storageSet('records', records);
    storageSet('bestStreak', bestStreak);
  }, []);

  const mutateSubject = useCallback(
    (dateISO: string, subject: SubjectId, updater: (prev: SubjectDayRecord) => SubjectDayRecord) => {
      setState((s) => {
        const dayRec = s.records[dateISO] ?? {};
        const prevSub = dayRec[subject] ?? {};
        const nextSub = updater(prevSub);
        const nextRecords: RecordsMap = { ...s.records, [dateISO]: { ...dayRec, [subject]: nextSub } };
        const derived = recompute(nextRecords, s.bestStreak);
        persist(nextRecords, derived.bestStreak);
        return { ...s, records: nextRecords, ...derived };
      });
    },
    [persist]
  );

  const createProfile = useCallback(async (name: string) => {
    const profile: Profile = {
      userId: makeUserId(),
      name: name.trim() || 'المتعلم',
      startDate: toISODate(new Date()),
      createdAt: new Date().toISOString(),
    };
    await storageSet('profile', profile);
    setState((s) => ({ ...s, profile }));
    return profile;
  }, []);

  // Manual score entry (used for editing days other than "today" via the path view).
  const logScore = useCallback(
    (dateISO: string, subject: SubjectId, score: number) => {
      mutateSubject(dateISO, subject, (prev) => ({ ...prev, score }));
    },
    [mutateSubject]
  );

  // Remove a logged entry. Timer-tracked entries for *today* are locked and cannot
  // be cleared/reset until the next day — only untouched manual entries can be undone.
  const clearScore = useCallback(
    (dateISO: string, subject: SubjectId) => {
      const todayISO = toISODate(new Date());
      setState((s) => {
        const dayRec = s.records[dateISO] ?? {};
        const prevSub = dayRec[subject];
        const timerLocked = dateISO === todayISO && !!prevSub?.timerStatus && prevSub.timerStatus !== 'idle';
        if (timerLocked) return s; // no-op: locked until tomorrow
        const nextDayRec = { ...dayRec };
        delete nextDayRec[subject];
        const nextRecords: RecordsMap = { ...s.records, [dateISO]: nextDayRec };
        const derived = recompute(nextRecords, s.bestStreak);
        persist(nextRecords, derived.bestStreak);
        return { ...s, records: nextRecords, ...derived };
      });
    },
    [persist]
  );

  // --- Timer actions (today only) ------------------------------------------

  const startTimer = useCallback(
    (dateISO: string, subject: SubjectId, opts?: { viaRandom?: boolean }) => {
      mutateSubject(dateISO, subject, (prev) => {
        if (prev.timerStatus && prev.timerStatus !== 'idle') return prev; // already started — can't restart
        return {
          ...prev,
          timerStatus: 'running',
          runningSince: Date.now(),
          timeSeconds: prev.timeSeconds ?? 0,
          viaRandom: opts?.viaRandom ?? prev.viaRandom,
        };
      });
    },
    [mutateSubject]
  );

  const pauseTimer = useCallback(
    (dateISO: string, subject: SubjectId) => {
      mutateSubject(dateISO, subject, (prev) => {
        if (prev.timerStatus !== 'running') return prev;
        const elapsed = liveElapsed(prev, Date.now());
        return { ...prev, timerStatus: 'paused', timeSeconds: elapsed, runningSince: undefined };
      });
    },
    [mutateSubject]
  );

  const resumeTimer = useCallback(
    (dateISO: string, subject: SubjectId) => {
      mutateSubject(dateISO, subject, (prev) => {
        if (prev.timerStatus !== 'paused') return prev;
        return { ...prev, timerStatus: 'running', runningSince: Date.now() };
      });
    },
    [mutateSubject]
  );

  // Ends the exercise for today and records the self-rated score (1..10).
  const finishSubject = useCallback(
    (dateISO: string, subject: SubjectId, score: number) => {
      mutateSubject(dateISO, subject, (prev) => {
        const elapsed = liveElapsed(prev, Date.now());
        return { ...prev, timerStatus: 'finished', timeSeconds: elapsed, runningSince: undefined, score };
      });
    },
    [mutateSubject]
  );

  return {
    ...state,
    createProfile,
    logScore,
    clearScore,
    startTimer,
    pauseTimer,
    resumeTimer,
    finishSubject,
  };
}

// --- Leaderboard (shared storage) -----------------------------------------

export interface LeaderboardEntry {
  userId: string;
  name: string;
  xp: number;
  seed?: boolean;
}

const SEED_ENTRIES: LeaderboardEntry[] = [
  { userId: 'seed_amina', name: 'أمينة', xp: 1450, seed: true },
  { userId: 'seed_yacine', name: 'ياسين', xp: 1120, seed: true },
  { userId: 'seed_lina', name: 'لينة', xp: 860, seed: true },
  { userId: 'seed_omar', name: 'عمر', xp: 610, seed: true },
  { userId: 'seed_khaled', name: 'خالد', xp: 340, seed: true },
];

export async function ensureSeedLeaderboard() {
  const keys = await storageList('leaderboard:', true);
  if (keys.length > 0) return;
  for (const entry of SEED_ENTRIES) {
    await storageSet(`leaderboard:${entry.userId}`, entry, true);
  }
}

export async function pushMyLeaderboardScore(userId: string, name: string, xp: number) {
  await storageSet(`leaderboard:${userId}`, { userId, name, xp } as LeaderboardEntry, true);
}

export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  await ensureSeedLeaderboard();
  const keys = await storageList('leaderboard:', true);
  const entries: LeaderboardEntry[] = [];
  for (const key of keys) {
    const val = await storageGet<LeaderboardEntry>(key, true);
    if (val) entries.push(val);
  }
  return entries.sort((a, b) => b.xp - a.xp);
}
