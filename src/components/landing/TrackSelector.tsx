import { useState } from 'react';
import { ScrollReveal } from './ScrollReveal';

type MainTrack = 'scientific' | 'literary' | null;
type SubTrack = string | null;

const SCIENTIFIC_SUBS = ['رياضيات', 'تقني رياضي', 'علوم تجريبية'];
const LITERARY_SUBS = ['آداب وفلسفة', 'لغات أجنبية'];

export function TrackSelector({
  onContinue,
}: {
  onContinue: (track: string, sub: string) => void;
}) {
  const [main, setMain] = useState<MainTrack>(null);
  const [sub, setSub] = useState<SubTrack>(null);

  const subs = main === 'scientific' ? SCIENTIFIC_SUBS : main === 'literary' ? LITERARY_SUBS : [];

  const handleMain = (t: MainTrack) => {
    setMain(t);
    setSub(null);
  };

  return (
    <section className="py-20 px-6 bg-[hsl(var(--paper-warm))]">
      <div className="max-w-2xl mx-auto space-y-10">
        <ScrollReveal>
          <h2 className="text-2xl md:text-3xl font-extrabold text-[hsl(var(--ink))] text-center">
            اختر شعبتك للبدء
          </h2>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <div className="grid grid-cols-2 gap-4">
            <TrackCard
              emoji="🔬"
              label="علمي"
              active={main === 'scientific'}
              onClick={() => handleMain('scientific')}
            />
            <TrackCard
              emoji="📚"
              label="أدبي"
              active={main === 'literary'}
              onClick={() => handleMain('literary')}
            />
          </div>
        </ScrollReveal>

        {subs.length > 0 && (
          <ScrollReveal delay={50}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {subs.map((s) => (
                <button
                  key={s}
                  onClick={() => setSub(s)}
                  className={`h-14 rounded-xl border text-sm font-semibold transition-all ${
                    sub === s
                      ? 'border-[hsl(var(--sprout))] bg-[hsl(var(--sprout-soft))] text-[hsl(var(--sprout))] scale-[1.03]'
                      : 'border-border bg-card text-[hsl(var(--ink))] hover:border-[hsl(var(--ink))]/30'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </ScrollReveal>
        )}

        {main && sub && (
          <ScrollReveal delay={0}>
            <div className="text-center">
              <button
                onClick={() => onContinue(main, sub)}
                className="h-12 px-8 rounded-full bg-[hsl(var(--ink-solid))] hover:bg-[hsl(var(--ink-solid))]/90 text-white text-sm font-bold transition-all hover:scale-[1.03] active:scale-[0.98]"
              >
                متابعة — {sub}
              </button>
            </div>
          </ScrollReveal>
        )}
      </div>
    </section>
  );
}

function TrackCard({
  emoji,
  label,
  active,
  onClick,
}: {
  emoji: string;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`h-28 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${
        active
          ? 'border-[hsl(var(--sprout))] bg-[hsl(var(--sprout-soft))] scale-[1.03] shadow-sm'
          : 'border-border bg-card hover:border-[hsl(var(--ink))]/20 hover:shadow-sm'
      }`}
    >
      <span className="text-3xl">{emoji}</span>
      <span className={`text-sm font-bold ${active ? 'text-[hsl(var(--sprout))]' : 'text-[hsl(var(--ink))]'}`}>
        {label}
      </span>
    </button>
  );
}
