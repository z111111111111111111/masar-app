import { useEffect, useState } from 'react';
import { storageGet, storageSet } from './storage';

export function useDarkMode() {
  const [dark, setDark] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const stored = await storageGet<boolean>('darkMode');
      const initial =
        stored ?? (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches);
      setDark(!!initial);
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    document.documentElement.classList.toggle('dark', dark);
    storageSet('darkMode', dark);
  }, [dark, loaded]);

  return { dark, toggle: () => setDark((d) => !d) };
}
