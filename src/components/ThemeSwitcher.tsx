import type { ThemeId, ThemeInfo } from '@/lib/useTheme';
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
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <h3 className="text-sm font-bold text-[hsl(var(--ink))] mb-1">المظهر</h3>
      <p className="text-[11px] text-muted-foreground mb-4">اختر السمة والإضاءة</p>

      {/* Theme cards */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {themes.map((t) => {
          const active = t.id === currentTheme;
          return (
            <button
              key={t.id}
              onClick={() => onSelectTheme(t.id)}
              className={`relative rounded-xl border-2 p-3 text-center transition-all ${
                active
                  ? 'border-[hsl(var(--sprout))] bg-[hsl(var(--sprout-soft))]'
                  : 'border-border bg-background hover:border-muted-foreground/30'
              }`}
            >
              {/* Color preview dots */}
              <div className="flex items-center justify-center gap-1.5 mb-2">
                <span
                  className="w-4 h-4 rounded-full border border-black/10"
                  style={{ background: dark ? t.colors.dark : t.colors.light }}
                />
                <span
                  className="w-4 h-4 rounded-full border border-black/10"
                  style={{ background: t.colors.accent }}
                />
              </div>
              <span className="text-xs font-bold text-[hsl(var(--ink))] block">{t.name}</span>
              <span className="text-[9px] text-muted-foreground block mt-0.5">{t.description}</span>
              {active && (
                <div className="absolute top-1.5 left-1.5 w-4 h-4 rounded-full bg-[hsl(var(--sprout))] flex items-center justify-center">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Dark mode toggle */}
      <button
        onClick={onToggleDark}
        className="w-full h-11 rounded-xl border border-border bg-background flex items-center justify-center gap-2.5 text-sm font-semibold text-[hsl(var(--ink))] hover:bg-muted/40 transition-colors"
      >
        {dark ? <SunIcon size={16} /> : <MoonIcon size={16} />}
        {dark ? 'الوضع النهاري' : 'الوضع الليلي'}
      </button>
    </div>
  );
}
