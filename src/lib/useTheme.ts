import { useEffect, useState, useCallback } from 'react';

export type ThemeId = 'default' | 'rose' | 'goth';

export interface ThemeInfo {
  id: ThemeId;
  name: string;
  description: string;
  colors: { light: string; dark: string; accent: string };
}

export const THEMES: ThemeInfo[] = [
  {
    id: 'default',
    name: 'عادي',
    description: 'السمة الأساسية',
    colors: { light: '#f9f8f4', dark: '#141a22', accent: '#3d8b6e' },
  },
  {
    id: 'rose',
    name: 'وردي',
    description: 'سما وردية',
    colors: { light: '#fdf2f5', dark: '#1f1218', accent: '#d4567a' },
  },
  {
    id: 'goth',
    name: 'غوث',
    description: 'بنفسجي ورمادي',
    colors: { light: '#f4f2f7', dark: '#17131f', accent: '#7c5cbf' },
  },
];

function getStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function setStorage(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { /* storage full or blocked */ }
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeId>(() => getStorage<ThemeId>('masar-theme', 'default'));
  const [dark, setDark] = useState<boolean>(() => {
    const stored = getStorage<boolean | null>('masar-dark', null);
    if (stored !== null) return stored;
    return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const root = document.documentElement;
    root.classList.toggle('dark', dark);
    root.setAttribute('data-theme', theme);
    setStorage('masar-dark', dark);
    setStorage('masar-theme', theme);
  }, [dark, theme, loaded]);

  const toggleDark = useCallback(() => setDark((d) => !d), []);

  const setTheme = useCallback((t: ThemeId) => {
    setThemeState(t);
  }, []);

  return { theme, dark, themes: THEMES, setTheme, toggleDark };
}
