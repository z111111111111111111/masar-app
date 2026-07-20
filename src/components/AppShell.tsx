import { MasarMark } from './OnboardingScreen';
import { currentLeague } from '@/lib/dates';
import { useDarkMode } from '@/lib/useDarkMode';
import { HomeIcon, CalendarIcon, PathIcon, TrophyIcon, UserIcon, FlameIcon, GemIcon, SunIcon, MoonIcon } from './icons';

export type TabId = 'home' | 'tracking' | 'roadmap' | 'board' | 'profile';

const TABS: { id: TabId; label: string; icon: (p: { className?: string }) => JSX.Element }[] = [
  { id: 'home', label: 'الرئيسية', icon: HomeIcon },
  { id: 'roadmap', label: 'المسار', icon: PathIcon },
  { id: 'tracking', label: 'المتابعة', icon: CalendarIcon },
  { id: 'board', label: 'المتصدرون', icon: TrophyIcon },
  { id: 'profile', label: 'حسابي', icon: UserIcon },
];

export function AppShell({
  active,
  onChange,
  streak,
  xp,
  children,
}: {
  active: TabId;
  onChange: (t: TabId) => void;
  streak: number;
  xp: number;
  children: React.ReactNode;
}) {
  const { league } = currentLeague(xp);
  const { dark, toggle } = useDarkMode();

  return (
    <div className="min-h-screen bg-background md:flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-64 md:shrink-0 border-l border-border bg-card md:sticky md:top-0 md:h-screen px-5 py-6">
        <div className="flex items-center gap-2 px-1 mb-8">
          <MasarMark size={30} />
          <span className="font-bold text-lg tracking-tight text-[hsl(var(--ink))]">مسار</span>
        </div>

        <nav className="flex flex-col gap-1">
          {TABS.map((t) => {
            const isActive = t.id === active;
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => onChange(t.id)}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-[hsl(var(--sprout-soft))] text-[hsl(var(--sprout))]'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-[hsl(var(--ink))]'
                }`}
              >
                <Icon className="shrink-0" />
                {t.label}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto pt-6 space-y-2">
          <SidebarStat icon={<FlameIcon className="text-[hsl(var(--ember))]" />} label="السلسلة" value={String(streak)} />
          <SidebarStat icon={<GemIcon className="text-[hsl(var(--sprout))]" />} label={`${xp} XP · ${league.name}`} value="" />
          <button
            onClick={toggle}
            className="w-full flex items-center gap-2.5 rounded-xl border border-border px-3 py-2.5 text-sm font-semibold text-muted-foreground hover:text-[hsl(var(--ink))] hover:bg-muted/50 transition-colors"
          >
            {dark ? <SunIcon size={16} /> : <MoonIcon size={16} />}
            {dark ? 'الوضع الفاتح' : 'الوضع الليلي'}
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile header */}
        <header className="md:hidden sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border">
          <div className="px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MasarMark size={28} />
              <span className="font-bold text-base text-[hsl(var(--ink))]">مسار</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggle}
                className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted/60 transition-colors"
                aria-label="تبديل الوضع الليلي"
              >
                {dark ? <SunIcon size={16} /> : <MoonIcon size={16} />}
              </button>
              <StatPill icon={<FlameIcon className="text-[hsl(var(--ember))]" />} value={String(streak)} tone="ember" />
              <StatPill icon={<GemIcon className="text-[hsl(var(--sprout))]" />} value={`${xp}`} tone="sprout" />
            </div>
          </div>
        </header>

        {/* Desktop top bar */}
        <header className="hidden md:flex items-center justify-end gap-3 px-10 h-16 border-b border-border sticky top-0 z-10 bg-background/90 backdrop-blur">
          <button
            onClick={toggle}
            className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted/60 hover:text-[hsl(var(--ink))] transition-colors"
            aria-label="تبديل الوضع الليلي"
          >
            {dark ? <SunIcon size={17} /> : <MoonIcon size={17} />}
          </button>
          <StatPill icon={<FlameIcon className="text-[hsl(var(--ember))]" />} value={`${streak} يوم`} tone="ember" />
          <StatPill icon={<GemIcon className="text-[hsl(var(--sprout))]" />} value={`${xp} XP`} tone="sprout" />
        </header>

        <main className="flex-1 w-full max-w-2xl mx-auto px-4 md:px-8 py-6 md:py-10 pb-24 md:pb-10">{children}</main>

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-20 bg-card border-t border-border">
          <div className="grid grid-cols-5">
            {TABS.map((t) => {
              const isActive = t.id === active;
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => onChange(t.id)}
                  className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition-colors ${
                    isActive ? 'text-[hsl(var(--sprout))]' : 'text-muted-foreground'
                  }`}
                >
                  <Icon className={isActive ? '' : 'opacity-60'} />
                  {t.label}
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}

function SidebarStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-border px-3 py-2.5 text-sm">
      <span className="shrink-0">{icon}</span>
      <span className="text-[hsl(var(--ink))] font-semibold">{value}</span>
      <span className="text-muted-foreground text-xs">{label}</span>
    </div>
  );
}

function StatPill({ icon, value, tone }: { icon: React.ReactNode; value: string; tone: 'ember' | 'sprout' }) {
  const bg = tone === 'ember' ? 'bg-[hsl(var(--ember-soft))]' : 'bg-[hsl(var(--sprout-soft))]';
  const text = tone === 'ember' ? 'text-[hsl(var(--ember))]' : 'text-[hsl(var(--sprout))]';
  return (
    <div className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold ${bg} ${text}`}>
      {icon}
      {value}
    </div>
  );
}
