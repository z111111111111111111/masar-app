import { useState } from 'react';
import type { ThemeId, ThemeInfo } from '@/lib/useTheme';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SunIcon, MoonIcon } from './icons';

interface ThemeSwitcherProps {
  themes: ThemeInfo[];
  currentTheme: ThemeId;
  dark: boolean;
  onSelectTheme: (id: ThemeId) => void;
  onToggleDark: () => void;
}

export function ThemeSwitcher({
  themes,
  currentTheme,
  dark,
  onSelectTheme,
  onToggleDark,
}: ThemeSwitcherProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="h-10 px-4 rounded-full border border-border bg-card text-sm font-semibold text-[hsl(var(--ink))] hover:border-[hsl(var(--sprout))] hover:bg-[hsl(var(--sprout-soft))] transition-colors flex items-center gap-2 shrink-0"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>
        </svg>
        المظهر
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm p-0 overflow-hidden" dir="rtl">
          <DialogHeader className="px-4 pt-4 pb-3 border-b border-border">
            <DialogTitle className="text-right text-sm font-bold">اختر المظهر</DialogTitle>
          </DialogHeader>

          <div className="px-4 py-4 space-y-3">
            {themes.map((t) => {
              const active = t.id === currentTheme;
              return (
                <button
                  key={t.id}
                  onClick={() => onSelectTheme(t.id)}
                  className={`w-full rounded-xl border-2 p-3.5 text-right transition-all ${
                    active
                      ? 'border-[hsl(var(--sprout))] bg-[hsl(var(--sprout-soft))]'
                      : 'border-border bg-background hover:border-muted-foreground/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-bold text-[hsl(var(--ink))] block">{t.name}</span>
                      <span className="text-[11px] text-muted-foreground">{t.description}</span>
                    </div>
                    {active && (
                      <div className="w-5 h-5 rounded-full bg-[hsl(var(--sprout))] flex items-center justify-center shrink-0">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                      </div>
                    )}
                  </div>
                  {/* Colored text preview */}
                  <div className="mt-2.5 flex items-center gap-2 text-[11px] font-semibold" dir="ltr">
                    <span style={{ color: dark ? t.colors.dark : t.colors.light, textShadow: `0 0 8px ${t.colors.accent}40` }}>Aa</span>
                    <span style={{ color: t.colors.accent }}>●</span>
                    <span className="text-muted-foreground">Futura</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Dark/Light toggle */}
          <div className="px-4 pb-4">
            <button
              onClick={onToggleDark}
              className="w-full h-11 rounded-xl border border-border bg-background flex items-center justify-center gap-2.5 text-sm font-semibold text-[hsl(var(--ink))] hover:bg-muted/40 transition-colors"
            >
              {dark ? <SunIcon size={16} /> : <MoonIcon size={16} />}
              {dark ? 'الوضع النهاري' : 'الوضع الليلي'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
