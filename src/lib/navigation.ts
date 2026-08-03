import { useCallback, useEffect, useState } from 'react';
import type { TabId } from '@/components/AppShell';

export type AppScreen =
  | { kind: 'tab'; tab: TabId }
  | { kind: 'subject'; subjectId: string }
  | { kind: 'lesson'; subjectId: string; stageId: string };

const TAB_IDS: TabId[] = ['home', 'tracking', 'roadmap', 'board', 'profile'];
const SUBJECT_IDS = new Set(['math', 'physics', 'nature', 'philo', 'social', 'random']);
const STAGE_IDS = new Set(['derivative', 'derivative-2', 'derivative-3']);

function isValidScreen(s: unknown): s is AppScreen {
  if (!s || typeof s !== 'object') return false;
  const sc = s as Record<string, unknown>;
  if (sc.kind === 'tab') return typeof sc.tab === 'string' && (TAB_IDS as string[]).includes(sc.tab as string);
  if (sc.kind === 'subject') return typeof sc.subjectId === 'string' && SUBJECT_IDS.has(sc.subjectId);
  if (sc.kind === 'lesson') {
    return (
      typeof sc.subjectId === 'string' &&
      typeof sc.stageId === 'string' &&
      SUBJECT_IDS.has(sc.subjectId) &&
      STAGE_IDS.has(sc.stageId)
    );
  }
  return false;
}

export function activeTab(screen: AppScreen): TabId {
  return screen.kind === 'tab' ? screen.tab : 'roadmap';
}

export function useAppScreen(initial: AppScreen) {
  const [screen, setScreen] = useState<AppScreen>(() => {
    if (typeof window !== 'undefined') {
      const saved = window.history.state?.screen;
      if (isValidScreen(saved)) return saved;
    }
    return initial;
  });

  useEffect(() => {
    window.history.replaceState({ screen }, '');
  }, [screen]);

  useEffect(() => {
    const onPopState = (e: PopStateEvent) => {
      const s = e.state?.screen;
      if (isValidScreen(s)) setScreen(s);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = useCallback((next: AppScreen) => {
    window.history.pushState({ screen: next }, '');
    setScreen(next);
  }, []);

  return { screen, navigate };
}
