import { useState, useEffect, useCallback } from 'react';
import { MasarMark } from '@/components/OnboardingScreen';
import { ScrollReveal } from './ScrollReveal';
import { DerivativeIcon, ContinuityIcon } from '@/components/icons';
import { MathText, KaTeXBlock } from './MathText';

const SLIDES = [
  {
    id: 'derivative',
    icon: DerivativeIcon,
    tag: 'الرياضيات — التفاضل',
    title: 'التمرين الأول — الاشتقاق من التعريف',
    formula: 'f(x) = x^2 - 3x + 2',
    preamble: 'نعتبر الدالة $f$ المعرّفة على $\\mathbb{R}$ بـ:',
    questions: [
      'احسب النسبة $\\dfrac{f(x) - f(a)}{x - a}$ من أجل $x \\neq a$، ثم استنتج أن $f$ قابلة للاشتقاق في كل $a \\in \\mathbb{R}$، وأوجد $f\'(a)$.',
      'استنتج $f\'(x)$ بالنسبة لأي $x \\in \\mathbb{R}$، وأوجد $f\'(1)$ و $f\'(0)$ و $f\'(-2)$.',
      'اكتب معادلة المماس $(T_1)$ للمنحنى $C_f$ عند النقطة ذات الفاصلة $x_0 = 1$، ثم اكتب معادلة المماس $(T_2)$ الموازي للمستقيم ذي المعادلة $y = -x + 5$.',
    ],
    solution: [
      {
        label: 'السؤال 1',
        lines: [
          '$$f(x) - f(a) = (x^2 - 3x + 2) - (a^2 - 3a + 2)$$',
          '$$= x^2 - a^2 - 3(x - a) = (x - a)(x + a - 3)$$',
          '$$\\therefore \\; \\frac{f(x) - f(a)}{x - a} = x + a - 3$$',
          '$$f\'(a) = \\lim_{x \\to a} \\left[ x + a - 3 \\right] = 2a - 3$$',
        ],
      },
      {
        label: 'السؤال 2',
        lines: [
          '$$f\'(x) = 2x - 3$$',
          '$$f\'(1) = -1 \\;,\\quad f\'(0) = -3 \\;,\\quad f\'(-2) = -7$$',
        ],
      },
      {
        label: 'السؤال 3',
        lines: [
          '$$f(1) = 0 \\;,\\quad f\'(1) = -1$$',
          '$$(T_1) : \\; y = -x + 1$$',
          '$$f\'(x_2) = -1 \\;\\Longrightarrow\\; x_2 = 1$$',
          '$$(T_2) : \\; y = -x + 3$$',
        ],
      },
    ],
    difficulty: 3,
  },
  {
    id: 'continuity',
    icon: ContinuityIcon,
    tag: 'الرياضيات — الاتصال',
    title: 'التمرين الثاني — اتصال الدالة',
    formula: 'g(x) = \\dfrac{f(x) - f(a)}{x - a}',
    preamble: '$I$ مجال من $\\mathbb{R}$ يشمل العدد الحقيقي $a$، و $f$ دالة قابلة للاشتقاق عند $a$ حيث $f\'(a) = l$ مع $l \\in \\mathbb{R}$.\nنعتبر الدالة $g$ المعرفة بـ: $g(x) = \\dfrac{f(x) - f(a)}{x - a}$ إذا كان $x \\in I - \\{a\\}$ و $g(a) = l$.',
    questions: [
      'أثبت أن الدالة $g$ مستمرة عند $a$.',
      'لأي $x \\in I - \\{a\\}$، أكتب $f(x)$ بدلالة $x$ و $g(x)$.',
      'احسب $\\displaystyle\\lim_{x \\to a} f(x)$. ماذا تستنتج؟',
    ],
    solution: [
      {
        label: 'السؤال أ',
        lines: [
          '$$\\lim_{x \\to a} g(x) = \\lim_{x \\to a} \\frac{f(x) - f(a)}{x - a} = f\'(a) = l$$',
          '$$\\text{و } g(a) = l \\;\\Longrightarrow\\; \\lim_{x \\to a} g(x) = g(a)$$',
          '$$\\therefore \\; g \\text{ مستمرة عند } a$$',
        ],
      },
      {
        label: 'السؤال ب',
        lines: [
          '$$g(x) = \\frac{f(x) - f(a)}{x - a}$$',
          '$$\\Longrightarrow\\; f(x) - f(a) = (x - a) \\cdot g(x)$$',
          '$$\\Longrightarrow\\; f(x) = f(a) + (x - a) \\cdot g(x)$$',
        ],
      },
      {
        label: 'السؤال ج',
        lines: [
          '$$\\lim_{x \\to a} f(x) = \\lim_{x \\to a} \\Big[ f(a) + (x - a) \\cdot g(x) \\Big]$$',
          '$$= f(a) + 0 \\cdot l = f(a)$$',
          '$$\\therefore \\; f \\text{ مستمرة عند } a$$',
        ],
      },
    ],
    difficulty: 4,
  },
];

const INTERVAL = 8000;
const FADE_MS = 1000;

export function Hero({
  onGetStarted,
  onLogin,
}: {
  onGetStarted: () => void;
  onLogin: () => void;
}) {
  const [current, setCurrent] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const [fading, setFading] = useState(false);
  const [paused, setPaused] = useState(false);

  const goTo = useCallback((idx: number) => {
    if (idx === current || fading) return;
    setPrev(current);
    setCurrent(idx);
    // Start transition next frame so outgoing slide renders at opacity-1 first
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setFading(true);
      });
    });
    setTimeout(() => {
      setPrev(null);
      setFading(false);
    }, FADE_MS);
  }, [current, fading]);

  const next = useCallback(() => {
    goTo((current + 1) % SLIDES.length);
  }, [current, goTo]);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(next, INTERVAL);
    return () => clearInterval(id);
  }, [paused, next]);

  const slide = SLIDES[current];
  const Icon = slide.icon;

  return (
    <section className="relative overflow-hidden">
      <div className="w-full max-w-5xl mx-auto px-6 py-24 flex flex-col items-center gap-10">
        {/* Branding */}
        <ScrollReveal>
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <MasarMark size={56} />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-4xl md:text-5xl font-black tracking-tight text-[hsl(var(--ink))]">
                مسار
              </span>
              <span className="px-2.5 py-1 rounded-full bg-[hsl(var(--sprout))]/15 text-[hsl(var(--sprout))] text-[10px] font-bold border border-[hsl(var(--sprout))]/20">
                إصدار تجريبي
              </span>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={80}>
          <h1 className="text-2xl md:text-4xl font-extrabold text-[hsl(var(--ink))] leading-snug max-w-2xl text-center">
            رفيقك اليومي في رحلة التفوق نحو البكالوريا
          </h1>
        </ScrollReveal>

        <ScrollReveal delay={160}>
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-lg text-center">
            تمارين حقيقية من منهج البكالوريا العلمي مع حلول تفصيلية — تدرّب، تابع تقدّمك، وتنافس مع زملائك.
          </p>
        </ScrollReveal>

        {/* CTA buttons */}
        <ScrollReveal delay={200}>
          <div className="flex items-center gap-3">
            <button
              onClick={onGetStarted}
              className="h-12 px-7 rounded-full bg-[hsl(var(--ink-solid))] hover:bg-[hsl(var(--ink-solid))]/90 text-white text-sm font-bold transition-all hover:scale-[1.03] active:scale-[0.98]"
            >
              ابدأ الآن
            </button>
            <button
              onClick={onLogin}
              className="h-12 px-7 rounded-full border border-border bg-card hover:bg-muted/40 text-sm font-bold text-[hsl(var(--ink))] transition-all hover:scale-[1.03] active:scale-[0.98]"
            >
              عندي حساب بالفعل
            </button>
          </div>
        </ScrollReveal>

        {/* Carousel */}
        <div
          className="w-full max-w-3xl"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="rounded-3xl border border-border bg-card shadow-lg overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-gradient-to-l from-[hsl(var(--sprout-soft))]/50 to-transparent">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-[hsl(var(--sprout))]/15 text-[hsl(var(--sprout))] flex items-center justify-center">
                  <Icon size={16} />
                </span>
                <span className="text-xs font-bold text-[hsl(var(--ink))]">{slide.tag}</span>
              </div>
              <span className="text-[10px] text-muted-foreground font-medium">{slide.title}</span>
            </div>

            {/* Body — fixed height, true crossfade */}
            <div className="relative" style={{ height: 440 }}>
              {/* Outgoing slide (fading out) */}
              {prev !== null && (
                <div
                  key={`out-${SLIDES[prev].id}`}
                  className={`absolute inset-0 grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border transition-opacity duration-1000 ease-in-out pointer-events-none ${
                    fading ? 'opacity-0' : 'opacity-100'
                  }`}
                >
                  <SlideBody slide={SLIDES[prev]} />
                </div>
              )}
              {/* Incoming slide (fading in) */}
              <div
                className={`absolute inset-0 grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border transition-opacity duration-1000 ease-in-out ${
                  fading ? 'opacity-100' : 'opacity-100'
                }`}
              >
                <SlideBody slide={slide} />
              </div>
            </div>

            {/* Dots + progress bar */}
            <div className="px-5 py-3 border-t border-border flex items-center gap-3">
              <div className="flex gap-1.5">
                {SLIDES.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === current
                        ? 'w-6 bg-[hsl(var(--ink-solid))]'
                        : 'w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                    }`}
                  />
                ))}
              </div>
              <div className="flex-1 h-1 rounded-full bg-muted/30 overflow-hidden">
                <div
                  key={current}
                  className="h-full bg-[hsl(var(--sprout))] rounded-full animate-progress"
                />
              </div>
              <span className="text-[10px] text-muted-foreground tabular-nums">{current + 1}/{SLIDES.length}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

type SlideData = (typeof SLIDES)[number];

function SlideBody({ slide }: { slide: SlideData }) {
  return (
    <>
      {/* Statement (right) */}
      <div className="p-5 space-y-4 text-right overflow-y-auto">
        <p className="text-xs text-muted-foreground leading-relaxed">
          <MathText tex={slide.preamble} />
        </p>
        <div className="bg-muted/30 rounded-xl px-4 py-3 text-center">
          <KaTeXBlock tex={slide.formula} displayMode className="text-sm" />
        </div>
        <ol className="space-y-2.5 list-none">
          {slide.questions.map((q, i) => (
            <li key={i} className="flex gap-2 text-xs text-[hsl(var(--ink))] leading-loose">
              <span className="w-5 h-5 rounded-full bg-[hsl(var(--sprout))]/15 text-[hsl(var(--sprout))] flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                {i + 1}
              </span>
              <span><MathText tex={q} /></span>
            </li>
          ))}
        </ol>
      </div>

      {/* Solution (left) — glassmorphism */}
      <div className="p-5 space-y-4 text-right overflow-y-auto backdrop-blur-xl bg-[hsl(var(--paper-warm))]/60 border border-white/20">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded bg-[hsl(var(--ember))]/15 text-[hsl(var(--ember))] flex items-center justify-center">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 3l4 4L7 21H3v-4L17 3z" />
            </svg>
          </span>
          <span className="text-sm font-extrabold text-[hsl(var(--ink))]">مساحة الحل</span>
        </div>
        {slide.solution.map((block, bi) => (
          <div key={bi} className="space-y-1.5">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              {block.label}
            </p>
            <div className="rounded-xl px-4 py-3 space-y-2 backdrop-blur-sm bg-white/40 border border-white/30">
              {block.lines.map((line, li) => (
                <div key={li} className="text-center">
                  <MathText tex={line} />
                </div>
              ))}
            </div>
          </div>
        ))}
        <div className="flex items-center gap-1.5 pt-1">
          <span className="text-[10px] text-muted-foreground">صعوبة:</span>
          {[1, 2, 3, 4, 5].map((n) => (
            <span
              key={n}
              className={`w-5 h-5 rounded text-[9px] font-bold flex items-center justify-center ${
                n <= slide.difficulty
                  ? 'bg-[hsl(var(--sprout))]/15 text-[hsl(var(--sprout))]'
                  : 'bg-muted text-muted-foreground/40'
              }`}
            >
              {n}
            </span>
          ))}
        </div>
      </div>
    </>
  );
}
