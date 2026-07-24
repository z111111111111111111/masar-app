import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronIcon } from '../icons';

interface Exercise {
  question: string;
  options: string[];
  correct: number;
}

const EXERCISES: Exercise[] = [
  {
    question: 'ما مشتقة الدالة f(x) = x⁴ ؟',
    options: ['4x³', '4x⁴', '3x⁴', 'x³'],
    correct: 0,
  },
  {
    question: 'ما مشتقة الدالة f(x) = x⁵ ؟',
    options: ['5x⁴', '4x⁵', '5x⁵', 'x⁴'],
    correct: 0,
  },
  {
    question: 'إذا كانت f(x) = x³ فإن f\'(x) تساوي:',
    options: ['2x²', '3x²', '3x³', 'x²'],
    correct: 1,
  },
  {
    question: 'ما مشتقة الدالة f(x) = x² ؟',
    options: ['x', '2x', '2x²', 'x²'],
    correct: 1,
  },
  {
    question: 'الاشتقاق يُعطينا:',
    options: ['مساحة المنحنى', 'ميل المماس للمنحنى', 'طول المنحنى', 'نقطة البداية'],
    correct: 1,
  },
];

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function DerivativeLesson({ onBack }: { onBack: () => void }) {
  const [phase, setPhase] = useState<'intro' | 'lesson' | 'exercises' | 'done'>('intro');
  const [progress, setProgress] = useState(0);
  const [showGraph, setShowGraph] = useState(false);
  const [graphReady, setGraphReady] = useState(false);

  const [currentQ, setCurrentQ] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);

  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const total = EXERCISES.length;
  const pct = Math.round((correctCount + wrongCount) / total * 100);

  const startTimer = useCallback(() => {
    if (timerRef.current) return;
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  useEffect(() => () => stopTimer(), [stopTimer]);

  useEffect(() => {
    if (showGraph) {
      const t = setTimeout(() => setGraphReady(true), 100);
      return () => clearTimeout(t);
    }
  }, [showGraph]);

  const handleStart = () => {
    setPhase('lesson');
    setProgress(30);
    startTimer();
  };

  const handleAnswer = (idx: number) => {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);
    if (idx === EXERCISES[currentQ].correct) setCorrectCount((c) => c + 1);
    else setWrongCount((w) => w + 1);
  };

  const handleNext = () => {
    if (currentQ + 1 >= total) {
      stopTimer();
      setProgress(100);
      setPhase('done');
    } else {
      setCurrentQ((q) => q + 1);
      setSelected(null);
      setAnswered(false);
      setProgress(30 + Math.round(((currentQ + 1) / total) * 70));
    }
  };

  return (
    <div className="space-y-0 min-h-[80vh] flex flex-col">
      {/* Progress Bar */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border -mx-4 px-4 py-3 -mt-6 pt-6">
        <div className="flex items-center justify-between mb-2">
          <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-[hsl(var(--ink))] transition-colors">
            <ChevronIcon size={14} />
            العودة
          </button>
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-medium">
            {phase === 'exercises' || phase === 'done' ? (
              <>
                <span className="text-[hsl(var(--sprout))]">✓ {correctCount}</span>
                <span className="text-[hsl(var(--coral))]">✗ {wrongCount}</span>
                <span>{formatTime(elapsed)}</span>
              </>
            ) : null}
          </div>
        </div>
        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-l from-[hsl(var(--sprout))] to-[hsl(var(--sprout))]/70 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${phase === 'lesson' ? progress : pct}%` }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 pt-6">
        {phase === 'intro' && (
          <div className="space-y-6 animate-[fade-in_0.4s_ease-out]">
            <div>
              <h1 className="text-xl font-bold text-[hsl(var(--ink))] mb-1">الاشتقاقية</h1>
              <p className="text-sm text-muted-foreground">الدرس الأول — الرياضيات</p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
              <h2 className="text-base font-bold text-[hsl(var(--ink))]">التعريف الأساسي</h2>
              <p className="text-sm leading-relaxed text-[hsl(var(--ink))]">
                <span
                  className="font-bold border-b-2 border-dashed border-[hsl(var(--chart-1))]/60 cursor-pointer"
                  onClick={() => setShowGraph(!showGraph)}
                >
                  المشتقة
                </span>
                {' '}هي أداة رياضية تخبرنا بمقدار سرعة تغير الدالة عند نقطة معينة، أو بعبارة أخرى{' '}
                <span className="font-semibold">ميل المماس للمنحنى</span>{' '}
                عند تلك النقطة.
              </p>

              {showGraph && (
                <div className="rounded-xl border border-[hsl(var(--chart-1))]/20 bg-[hsl(var(--chart-1))]/5 p-4 animate-[pop-in_0.3s_ease-out]">
                  <DerivativeGraph ready={graphReady} />
                  <p className="text-[11px] text-muted-foreground text-center mt-3">
                     الدالة <span className="font-mono font-bold text-[hsl(var(--chart-1))]">f(x) = x³</span> مع خط المماس
                  </p>
                </div>
              )}

              <div className="rounded-xl bg-muted/50 p-4">
                <p className="text-xs text-muted-foreground mb-2 font-medium">القاعدة الأساسية</p>
                <div className="flex items-center gap-2 text-base font-bold text-[hsl(var(--ink))] font-mono" dir="ltr">
                  <span>f(x) = xⁿ</span>
                  <span className="text-muted-foreground text-sm">→</span>
                  <span>f'(x) = n · xⁿ⁻¹</span>
                </div>
              </div>
            </div>

            {/* YouTube Video */}
            <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
              <p className="text-sm font-semibold text-[hsl(var(--ink))]">
                في حال لم تفهم، نقترح عليك هذا الشرح:
              </p>
              <a
                href="https://www.youtube.com/watch?v=kNRqWehvOtE"
                target="_blank"
                rel="noopener noreferrer"
                className="block group"
              >
                <div className="relative rounded-xl overflow-hidden border border-border bg-muted aspect-video">
                  <img
                    src="https://img.youtube.com/vi/kNRqWehvOtE/maxresdefault.jpg"
                    alt="شرح الاشتقاقية"
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-[hsl(var(--coral))] text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                    </div>
                  </div>
                </div>
              </a>
            </div>

            <button
              onClick={handleStart}
              className="w-full h-12 rounded-xl bg-[hsl(var(--ink-solid))] hover:bg-[hsl(var(--ink-solid))]/90 text-white font-bold text-sm transition-all active:scale-[0.98] shadow-md"
            >
              فهمت لننطلق
            </button>
          </div>
        )}

        {phase === 'exercises' && (
          <div className="space-y-6 animate-[fade-in_0.3s_ease-out]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground">
                سؤال {currentQ + 1} / {total}
              </span>
              <span className="text-[11px] text-muted-foreground">{formatTime(elapsed)}</span>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="text-base font-bold text-[hsl(var(--ink))] leading-relaxed mb-5">
                {EXERCISES[currentQ].question}
              </p>

              <div className="space-y-2.5">
                {EXERCISES[currentQ].options.map((opt, i) => {
                  const isCorrect = i === EXERCISES[currentQ].correct;
                  const isSelected = i === selected;
                  let ring = 'border-border hover:border-[hsl(var(--sprout))]/50';
                  let bg = 'bg-card';
                  if (answered) {
                    if (isCorrect) { ring = 'border-[hsl(var(--sprout))]'; bg = 'bg-[hsl(var(--sprout))]/10'; }
                    else if (isSelected && !isCorrect) { ring = 'border-[hsl(var(--coral))]'; bg = 'bg-[hsl(var(--coral))]/10'; }
                    else { ring = 'border-border opacity-50'; }
                  }
                  return (
                    <button
                      key={i}
                      onClick={() => handleAnswer(i)}
                      disabled={answered}
                      className={`w-full text-right p-3.5 rounded-xl border ${ring} ${bg} transition-all text-sm font-medium text-[hsl(var(--ink))] disabled:cursor-default`}
                    >
                      <span className="inline-flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[11px] font-bold text-muted-foreground shrink-0">
                          {answered && isCorrect ? '✓' : answered && isSelected && !isCorrect ? '✗' : String.fromCharCode(1571 + i)}
                        </span>
                        {opt}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {answered && (
              <button
                onClick={handleNext}
                className="w-full h-11 rounded-xl bg-[hsl(var(--ink-solid))] hover:bg-[hsl(var(--ink-solid))]/90 text-white font-bold text-sm transition-all active:scale-[0.98] animate-[pop-in_0.2s_ease-out]"
              >
                {currentQ + 1 >= total ? 'إنهاء الدرس' : 'السؤال التالي'}
              </button>
            )}
          </div>
        )}

        {phase === 'done' && (
          <div className="space-y-6 animate-[fade-in_0.4s_ease-out]">
            <div className="rounded-2xl border border-[hsl(var(--sprout))]/30 bg-[hsl(var(--sprout))]/5 p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-[hsl(var(--sprout))] text-white flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <h2 className="text-xl font-bold text-[hsl(var(--ink))] mb-2">أحسنت!</h2>
              <p className="text-sm text-muted-foreground mb-4">لقد أنهيت درس الاشتقاقية</p>

              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="rounded-xl bg-card border border-border p-3">
                  <p className="text-lg font-bold text-[hsl(var(--sprout))]">{correctCount}</p>
                  <p className="text-[10px] text-muted-foreground">إجابات صحيحة</p>
                </div>
                <div className="rounded-xl bg-card border border-border p-3">
                  <p className="text-lg font-bold text-[hsl(var(--coral))]">{wrongCount}</p>
                  <p className="text-[10px] text-muted-foreground">أخطاء</p>
                </div>
                <div className="rounded-xl bg-card border border-border p-3">
                  <p className="text-lg font-bold text-[hsl(var(--ink))]">{formatTime(elapsed)}</p>
                  <p className="text-[10px] text-muted-foreground">المدة</p>
                </div>
              </div>
            </div>

            <button
              onClick={onBack}
              className="w-full h-11 rounded-xl border border-border bg-card hover:bg-muted/50 text-[hsl(var(--ink))] font-bold text-sm transition-all"
            >
              العودة للمسار
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Canvas graph: x³ + tangent ─── */
function DerivativeGraph({ ready }: { ready: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 320;
    const H = 180;
    canvas.width = W * 2;
    canvas.height = H * 2;
    ctx.scale(2, 2);

    const cx = W * 0.4;
    const cy = H * 0.7;
    const scale = 14;

    let progress = 0;
    const duration = 900;
    let start: number | null = null;

    const draw = (ts: number) => {
      if (!start) start = ts;
      progress = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);

      ctx.clearRect(0, 0, W, H);

      // Axes
      ctx.strokeStyle = 'hsl(var(--border))';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(15, cy);
      ctx.lineTo(W - 10, cy);
      ctx.moveTo(cx, H - 10);
      ctx.lineTo(cx, 10);
      ctx.stroke();

      // x³ curve
      ctx.strokeStyle = 'hsl(var(--chart-1))';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      let first = true;
      const curveEnd = (W - 25) * ease;
      for (let px = 0; px <= curveEnd; px++) {
        const x = (px - (cx - 20)) / scale;
        const y = x * x * x;
        const sy = cy - y * scale;
        if (sy < -10 || sy > H + 10) { first = true; continue; }
        const dx = px + 20;
        if (first) { ctx.moveTo(dx, sy); first = false; }
        else ctx.lineTo(dx, sy);
      }
      ctx.stroke();

      // Tangent at x=1 (slope = 3), point (1,1)
      if (ease > 0.5) {
        const tEase = Math.min((ease - 0.5) / 0.5, 1);
        const tx = cx + 1 * scale;
        const ty = cy - 1 * scale;
        const slope = 3;

        ctx.strokeStyle = 'hsl(var(--sprout))';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        const len = 30 * tEase;
        ctx.moveTo(tx - len, ty + slope * len);
        ctx.lineTo(tx + len * 0.5, ty - slope * len * 0.5);
        ctx.stroke();
        ctx.setLineDash([]);

        // Point
        if (tEase > 0.4) {
          ctx.fillStyle = 'hsl(var(--sprout))';
          ctx.beginPath();
          ctx.arc(tx, ty, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (progress < 1) animRef.current = requestAnimationFrame(draw);
    };

    if (ready) animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [ready]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full rounded-lg"
      style={{ height: 180 }}
    />
  );
}
