import { useDarkMode } from '@/lib/useDarkMode';
import { SunIcon, MoonIcon } from '@/components/icons';
import { Hero } from './Hero';
import { About } from './About';
import { Features } from './Features';
import { Pricing } from './Pricing';
import { FinalCTA } from './FinalCTA';

export interface LandingProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

export function Landing({ onGetStarted, onLogin }: LandingProps) {
  const { dark, toggle } = useDarkMode();

  return (
    <div
      dir="rtl"
      className="min-h-screen relative"
      style={{
        background: dark
          ? 'linear-gradient(165deg, hsl(210 20% 8%) 0%, hsl(210 22% 12%) 35%, hsl(152 20% 12%) 65%, hsl(210 18% 10%) 100%)'
          : 'linear-gradient(165deg, hsl(40 20% 98%) 0%, hsl(152 20% 94%) 35%, hsl(32 30% 95%) 65%, hsl(40 20% 98%) 100%)',
      }}
    >
      {/* Soft radial accents layered on top */}
      <div className="fixed inset-0 pointer-events-none -z-0">
        <div
          className="absolute w-[800px] h-[800px] rounded-full blur-[160px]"
          style={{
            top: '-10%',
            right: '-10%',
            background: dark
              ? 'radial-gradient(circle, hsl(152 30% 18%) 0%, transparent 70%)'
              : 'radial-gradient(circle, hsl(152 30% 92%) 0%, transparent 70%)',
            opacity: dark ? 0.35 : 0.6,
          }}
        />
        <div
          className="absolute w-[600px] h-[600px] rounded-full blur-[140px]"
          style={{
            bottom: '10%',
            left: '-5%',
            background: dark
              ? 'radial-gradient(circle, hsl(32 50% 16%) 0%, transparent 70%)'
              : 'radial-gradient(circle, hsl(32 60% 90%) 0%, transparent 70%)',
            opacity: dark ? 0.3 : 0.5,
          }}
        />
        <div
          className="absolute w-[500px] h-[500px] rounded-full blur-[120px]"
          style={{
            top: '50%',
            left: '30%',
            background: dark
              ? 'radial-gradient(circle, hsl(225 25% 18%) 0%, transparent 70%)'
              : 'radial-gradient(circle, hsl(225 25% 92%) 0%, transparent 70%)',
            opacity: dark ? 0.25 : 0.35,
          }}
        />
      </div>

      {/* Dark mode toggle */}
      <button
        onClick={toggle}
        className="fixed top-5 left-5 z-50 w-10 h-10 rounded-full bg-card/80 backdrop-blur-sm border border-border shadow-sm flex items-center justify-center text-muted-foreground hover:text-[hsl(var(--ink))] hover:bg-muted/60 transition-colors"
        aria-label="تبديل الوضع الليلي"
      >
        {dark ? <SunIcon size={17} /> : <MoonIcon size={17} />}
      </button>

      <Hero onGetStarted={onGetStarted} onLogin={onLogin} />
      <About />
      <Features />
      <Pricing onGetStarted={onGetStarted} />
      <FinalCTA onGetStarted={onGetStarted} onLogin={onLogin} />
    </div>
  );
}
