import { useState } from 'react';
import type { ThemeId, ThemeInfo } from '@/lib/useTheme';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

interface ThemeSwitcherProps {
  themes: ThemeInfo[];
  currentTheme: ThemeId;
  dark: boolean;
  onSelectTheme: (id: ThemeId) => void;
}

export function ThemeSwitcher({
  themes,
  currentTheme,
  dark,
  onSelectTheme,
}: ThemeSwitcherProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full h-11 rounded-2xl border border-border bg-card text-sm font-semibold text-[hsl(var(--ink))] hover:bg-muted/40 transition-colors flex items-center justify-center gap-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>
        </svg>
        تغيير المظهر
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[280px] p-0 rounded-2xl overflow-hidden" dir="rtl">
          <DialogTitle className="sr-only">اختر المظهر</DialogTitle>

          <div className="p-3 space-y-1.5">
            {themes.map((t) => {
              const active = t.id === currentTheme;
              return (
                <button
                  key={t.id}
                  onClick={() => { onSelectTheme(t.id); setOpen(false); }}
                  className={`w-full rounded-xl px-3.5 py-3 text-right transition-all flex items-center gap-3 ${
                    active
                      ? 'bg-[hsl(var(--sprout-soft))] ring-1 ring-[hsl(var(--sprout))]/40'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-bold text-[hsl(var(--ink))] block">{t.name}</span>
                    <span className="text-[10px] text-muted-foreground">{t.description}</span>
                  </div>
                  <span
                    className="text-lg font-black shrink-0"
                    style={{ color: t.colors.accent }}
                  >
                    Aa
                  </span>
                  {active && (
                    <div className="w-5 h-5 rounded-full bg-[hsl(var(--sprout))] flex items-center justify-center shrink-0">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
