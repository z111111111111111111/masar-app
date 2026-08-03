import { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import type { ReactNode } from 'react';
import { useMutation, useQuery_experimental as useQuerySafe } from 'convex/react';
import { api } from 'convex/_generated/api';
import { ChevronIcon } from '../icons';
import { Button } from '@/components/ui/button';
import { KaTeXBlock } from '@/components/landing/MathText';
import { DERIVATIVE_FLOW, DERIVATIVE_FLOW_ID, serializeCorrectAnswer } from './DerivativeFlow';
import { balancedSample } from './systems/utils';
import type { ExerciseData } from './systems/types';
import { MultipleChoice } from './systems/MultipleChoice';
import { RuleAssembly } from './systems/RuleAssembly';
import { FillBlank } from './systems/FillBlank';
import { TrueFalse } from './systems/TrueFalse';
import { CardSort } from './systems/CardSort';
import { ExerciseHelpersProvider } from './systems/ExerciseHelpers';

const COMPLETED_KEY = 'masar-completed-subjects';
const SUBJECT_LABELS: Record<string, string> = {
  math: 'الرياضيات', physics: 'الفيزياء', nature: 'العلوم الطبيعية',
  philo: 'الفلسفة', social: 'الاجتماعيات',
};
const SUBJECT_COLORS: Record<string, string> = {
  math: 'chart-1', physics: 'chart-2', nature: 'chart-3',
  philo: 'chart-4', social: 'chart-5',
};
const ALL_SUBJECTS = ['math', 'physics', 'nature', 'philo', 'social'];

function getCompletedSubjects(): string[] {
  try { return JSON.parse(localStorage.getItem(COMPLETED_KEY) || '[]'); }
  catch { return []; }
}
function markSubjectComplete(id: string): string[] {
  const s = getCompletedSubjects();
  if (!s.includes(id)) { s.push(id); localStorage.setItem(COMPLETED_KEY, JSON.stringify(s)); }
  return s;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export interface DerivativeLessonIntro {
  title: string;
  subtitle: string;
  description?: string;
  body?: ReactNode;
}

export function DerivativeLesson({
  onBack,
  onStageComplete,
  flowId = DERIVATIVE_FLOW_ID,
  flow = DERIVATIVE_FLOW,
  sessionSize = flow.length,
  intro,
}: {
  onBack: () => void;
  onStageComplete?: (passed: boolean) => void;
  flowId?: string;
  flow?: ExerciseData[];
  sessionSize?: number;
  intro?: DerivativeLessonIntro;
}) {
  const [phase, setPhase] = useState<'intro' | 'exercises' | 'retry' | 'done'>('intro');
  const [showGraph, setShowGraph] = useState(false);
  const [graphReady, setGraphReady] = useState(false);

  // Random per-entry session: sampled once when the lesson mounts (each entry
  // remounts the component), so the exercises differ between sessions.
  const [session] = useState<number[]>(() => balancedSample(flow, sessionSize));

  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);

  // Correction state: exercises answered wrong in the first pass, seeded from the
  // database, and the position within that queue.
  const [wrongSet, setWrongSet] = useState<number[]>([]);
  const [retryQueue, setRetryQueue] = useState<{ flowIndex: number; kind: string; correctAnswer: string }[]>([]);
  const [retryIndex, setRetryIndex] = useState(0);
  const [retryRound, setRetryRound] = useState(0);
  const [retryTotal, setRetryTotal] = useState(0);
  const [lastRetryCorrect, setLastRetryCorrect] = useState<boolean | null>(null);
  const pendingRef = useRef<Array<Promise<unknown>>>([]);
  // One AI question per exercise: the set of flow indices already asked, kept
  // across first pass AND correction rounds for the whole lesson entry.
  const aiUsedRef = useRef<Set<number>>(new Set());

  const recordMistake = useMutation(api.mistakes.recordMistake);
  const resolveMistake = useMutation(api.mistakes.resolveMistake);
  const resetSession = useMutation(api.mistakes.resetSession);
  // Non-throwing query: if the backend function/table is unavailable the result is
  // simply `undefined` (the retry queue falls back to local wrong answers) instead
  // of crashing the lesson with a white page.
  const unresolvedQuery = useQuerySafe({
    query: api.mistakes.getUnresolved,
    args: { flow: flowId },
  });
  const unresolved = unresolvedQuery.status === 'success' ? unresolvedQuery.data : undefined;

  const [elapsed, setElapsed] = useState(0);
  const [completedSubjects, setCompletedSubjects] = useState<string[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const total = session.length;
  const current = flow[session[currentIndex]];
  const retryItem = phase === 'retry' ? retryQueue[retryIndex] : undefined;
  const activeExercise = retryItem ? (flow[retryItem.flowIndex] ?? current) : current;
  const pct = phase === 'retry'
    // During correction the bar advances against the wrong-exercise queue size,
    // so each fixed mistake moves it by a meaningful step up to 100%.
    ? retryTotal > 0 ? Math.round(((retryTotal - retryQueue.length) / retryTotal) * 100) : 0
    : phase === 'done' || phase === 'results'
      ? 100
      : Math.min(100, Math.round(((correctCount + wrongCount) / total) * 100));

  const startTimer = useCallback(() => {
    if (timerRef.current) return;
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  useEffect(() => () => stopTimer(), [stopTimer]);

  useEffect(() => {
    if (phase === 'done') {
      stopTimer();
      setCompletedSubjects(markSubjectComplete('math'));
      // Clear any leftover unresolved mistakes once everything is corrected.
      resetSession({ flow: flowId }).catch(() => {});
      onStageComplete?.(true);
    }
  }, [phase, flowId, stopTimer, onStageComplete, resetSession]);

  useEffect(() => {
    if (showGraph) {
      const t = setTimeout(() => setGraphReady(true), 100);
      return () => clearTimeout(t);
    }
  }, [showGraph]);

  const handleStart = () => {
    // Re-entry: if the student left with unresolved mistakes, jump straight to
    // correcting only those exercises; otherwise start the full set fresh.
    const pending = unresolved ?? [];
    if (pending.length > 0) {
      setRetryTotal(pending.length);
      setRetryQueue(pending.map((m) => ({ flowIndex: m.flowIndex, kind: m.kind, correctAnswer: m.correctAnswer })));
      setRetryIndex(0);
      setRetryRound(0);
      setLastRetryCorrect(null);
      setPhase('retry');
    } else {
      setCurrentIndex(0);
      setPhase('exercises');
    }
    startTimer();
  };

  const handleSubmitFirstPass = useCallback((correct: boolean) => {
    if (correct) {
      setCorrectCount((c) => c + 1);
      return;
    }
    setWrongCount((w) => w + 1);
    const idx = session[currentIndex];
    setWrongSet((prev) => (prev.includes(idx) ? prev : [...prev, idx]));
    const ex = flow[idx];
    pendingRef.current.push(
      recordMistake({
        flow: flowId,
        flowIndex: idx,
        kind: ex.kind,
        correctAnswer: serializeCorrectAnswer(ex),
      }).catch(() => {})
    );
  }, [currentIndex, session, flow, flowId, recordMistake]);

  const handleSubmitRetry = useCallback((correct: boolean) => {
    const item = retryQueue[retryIndex];
    if (!item) return;
    if (correct) {
      setCorrectCount((c) => c + 1);
      setLastRetryCorrect(true);
      resolveMistake({ flow: flowId, flowIndex: item.flowIndex }).catch(() => {});
    } else {
      setWrongCount((w) => w + 1);
      setLastRetryCorrect(false);
      recordMistake({
        flow: flowId,
        flowIndex: item.flowIndex,
        kind: item.kind,
        correctAnswer: item.correctAnswer,
      }).catch(() => {});
    }
  }, [retryQueue, retryIndex, resolveMistake, recordMistake, flowId]);

  // Start the correction round from the results page: wrong exercises from the
  // database (unresolved) plus a local fallback so none is ever skipped.
  const startRetry = useCallback(() => {
    const dbSeed = unresolved ?? [];
    const localSeed = wrongSet
      .filter((i) => !dbSeed.some((m) => m.flowIndex === i))
      .map((i) => {
        const ex = flow[i];
        return { flowIndex: i, kind: ex.kind, correctAnswer: serializeCorrectAnswer(ex) };
      });
    const queue = [...dbSeed, ...localSeed];
    setRetryTotal(queue.length);
    setRetryQueue(queue);
    setRetryIndex(0);
    setRetryRound(0);
    setLastRetryCorrect(null);
    setPhase('retry');
    startTimer();
  }, [unresolved, wrongSet, flow, startTimer]);

  const handleNextFirstPass = useCallback(async () => {
    if (currentIndex + 1 >= total) {
      await Promise.allSettled(pendingRef.current);
      pendingRef.current = [];
      stopTimer();
      if (wrongSet.length === 0) {
        setPhase('done');
      } else {
        // Always show the results page after the exercises; correction happens
        // from there so the student sees time / correct / wrong counts first.
        setPhase('results');
      }
    } else {
      setCurrentIndex((i) => i + 1);
    }
  }, [currentIndex, total, wrongSet, stopTimer]);

  const handleNextRetry = useCallback(() => {
    if (lastRetryCorrect === true) {
      // Correctly answered → remove from the queue; pass once the queue is empty.
      const next = retryQueue.filter((_, i) => i !== retryIndex);
      setRetryQueue(next);
      if (next.length === 0) {
        stopTimer();
        setPhase('done');
      } else if (retryIndex >= next.length) {
        setRetryIndex(0);
      }
    } else {
      // Wrong / not answered → the item stays; loop the queue until correct.
      const nextIndex = (retryIndex + 1) % Math.max(retryQueue.length, 1);
      if (nextIndex === 0 && retryQueue.length > 0) setRetryRound((r) => r + 1);
      setRetryIndex(nextIndex);
    }
    setLastRetryCorrect(null);
  }, [lastRetryCorrect, retryQueue, retryIndex, stopTimer]);

  const renderExercise = () => {
    if (phase === 'retry' && !retryItem) return null;
    const onSubmit = phase === 'retry' ? handleSubmitRetry : handleSubmitFirstPass;
    const onNext = phase === 'retry' ? handleNextRetry : handleNextFirstPass;
    const ex = activeExercise;
    const common = { onSubmit, onNext };
    let inner: ReactNode;
    switch (ex.kind) {
      case 'mcq': inner = <MultipleChoice data={ex.data} {...common} />; break;
      case 'rule': inner = <RuleAssembly data={ex.data} {...common} />; break;
      case 'fill': inner = <FillBlank data={ex.data} {...common} />; break;
      case 'truefalse': inner = <TrueFalse data={ex.data} {...common} />; break;
      case 'sort': inner = <CardSort data={ex.data} {...common} />; break;
    }
    const flowIndex = phase === 'retry' ? (retryItem?.flowIndex ?? 0) : session[currentIndex];
    return (
      <ExerciseHelpersProvider
        exercise={ex}
        aiUsed={aiUsedRef.current.has(flowIndex)}
        onAiUsed={() => { aiUsedRef.current.add(flowIndex); }}
      >
        {inner}
      </ExerciseHelpersProvider>
    );
  };

  // Results page: `complete=false` shows it right after the first pass (even with
  // mistakes) with a "correct your mistakes" action; `complete=true` is the final
  // page that unlocks the next stage.
  const renderResults = (complete: boolean) => {
    const streakCount = completedSubjects.length;
    const ratio = correctCount / total;
    const isExcellent = ratio >= 1;
    const isGood = ratio >= 0.6 && ratio < 1;
    const toFix = wrongSet.length;

    return (
      <div className="space-y-5 animate-[pop-in_0.4s_ease-out]">
        <div className={`rounded-2xl border p-6 text-center ${
          complete
            ? isExcellent ? 'border-[hsl(var(--sprout))]/30 bg-[hsl(var(--sprout))]/5'
            : isGood ? 'border-[hsl(var(--ember))]/30 bg-[hsl(var(--ember))]/5'
            : 'border-[hsl(var(--coral))]/30 bg-[hsl(var(--coral))]/5'
            : 'border-[hsl(var(--ember))]/30 bg-[hsl(var(--ember))]/5'
        }`}>
          <div className={`w-16 h-16 rounded-full text-white flex items-center justify-center mx-auto mb-4 ${
            complete
              ? isExcellent ? 'bg-[hsl(var(--sprout))]'
              : isGood ? 'bg-[hsl(var(--ember))]'
              : 'bg-[hsl(var(--coral))]'
              : 'bg-[hsl(var(--ember))]'
          }`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter"><polyline points="4 12 10 18 20 6"/></svg>
          </div>
          <h2 className="text-xl font-bold text-[hsl(var(--ink))] mb-1">
            {complete ? 'أحسنت!' : 'انتهت التمارين'}
          </h2>
          <p className={`text-sm font-bold mb-1 ${
            complete
              ? isExcellent ? 'text-[hsl(var(--sprout))]'
              : isGood ? 'text-[hsl(var(--ember))]'
              : 'text-[hsl(var(--coral))]'
              : 'text-[hsl(var(--ember))]'
          }`}>
            {complete
              ? isExcellent ? 'ممتاز' : isGood ? 'جيد' : 'تحتاج للمراجعة'
              : `لديك ${toFix} خطأ، صحّحها للمرور إلى المرحلة التالية`}
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            {complete
              ? isExcellent ? 'أداء رائع! أنت على الطريق الصحيح'
              : isGood ? 'استمر في التقدم، أنت تتطور'
              : 'لا تستسلم، أعد مراجعة الدرس وحاول مرة أخرى'
              : 'أجب عن جميع التمارين إجابة صحيحة للانتقال إلى المرحلة التالية'}
          </p>

          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="rounded-xl bg-card border border-border p-3">
              <p className="text-lg font-bold text-[hsl(var(--sprout))]">{correctCount}</p>
              <p className="text-[10px] text-muted-foreground">صحيحة</p>
            </div>
            <div className="rounded-xl bg-card border border-border p-3">
              <p className="text-lg font-bold text-[hsl(var(--coral))]">{wrongCount}</p>
              <p className="text-[10px] text-muted-foreground">خطأ</p>
            </div>
            <div className="rounded-xl bg-card border border-border p-3">
              <p className="text-lg font-bold text-[hsl(var(--ink))]">{formatTime(elapsed)}</p>
              <p className="text-[10px] text-muted-foreground">المدة</p>
            </div>
          </div>
        </div>

        {complete && (
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-xs text-muted-foreground mb-3 font-medium">الستريك</p>
            <div className="flex items-center gap-1.5 mb-3">
              {ALL_SUBJECTS.map((sid) => (
                <div key={sid} className="flex-1 h-2 rounded-full transition-all" style={{
                  background: completedSubjects.includes(sid)
                    ? `hsl(var(--${SUBJECT_COLORS[sid]}))`
                    : 'hsl(var(--muted))',
                }} />
              ))}
            </div>
            <p className="text-sm font-bold text-[hsl(var(--ink))]">
              {streakCount === 1
                ? 'لقد بدأت الستريك'
                : `الستريك ${streakCount} من 5`}
            </p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {ALL_SUBJECTS.map((sid) => {
                const done = completedSubjects.includes(sid);
                return (
                  <span key={sid} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${done ? 'bg-[hsl(var(--sprout-soft))] text-[hsl(var(--sprout))]' : 'bg-muted text-muted-foreground'}`}>
                    {done ? '✓ ' : ''}{SUBJECT_LABELS[sid]}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {!complete ? (
          <button
            onClick={startRetry}
            className="w-full h-12 rounded-xl bg-[hsl(var(--sprout))] text-white font-bold text-sm shadow-[0_4px_0_hsl(var(--sprout-dark))] transition-all active:translate-y-[2px] active:shadow-none"
          >
            صحّح أخطاءك ({toFix} تمرين)
          </button>
        ) : (
          <button
            onClick={onBack}
            className="w-full h-11 rounded-xl border border-border bg-card hover:bg-muted/50 text-[hsl(var(--ink))] font-bold text-sm transition-all"
          >
            العودة للمسار
          </button>
        )}
        {!complete && (
          <button
            onClick={onBack}
            className="w-full h-11 rounded-xl border border-border bg-card hover:bg-muted/50 text-[hsl(var(--ink))] font-bold text-sm transition-all"
          >
            العودة للمسار
          </button>
        )}
      </div>
    );
  };

  return (
    <div className={`space-y-0 flex flex-col ${phase === 'exercises' ? 'h-full' : 'min-h-[80vh]'}`}>
      {/* Progress Bar */}
      <div className="sticky top-0 md:top-16 z-10 bg-background/95 backdrop-blur border-b border-border -mx-4 px-4 py-3 md:-mx-8 md:px-8">
        <div className="flex items-center justify-between mb-2">
          <button onClick={onBack} className="flex items-center gap-1.5 h-8 px-3 rounded-full border border-border bg-card text-xs font-semibold text-muted-foreground hover:text-[hsl(var(--ink))] hover:bg-muted/60 transition-all active:scale-95">
            <ChevronIcon size={14} className="rotate-180" />
            العودة
          </button>
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-medium">
            {phase === 'done' || phase === 'results' ? (
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
            style={{ width: `${phase === 'done' || phase === 'results' ? 100 : pct}%` }}
          />
        </div>
      </div>

      {/* Content */}
      <div className={`flex-1 pt-6 flex flex-col min-h-0 ${phase === 'exercises' ? 'overflow-hidden' : ''}`}>
        {phase === 'intro' && (
          <>
            <div className="space-y-6 animate-[fade-in_0.4s_ease-out] pb-32 md:pb-6">
              <div>
                <h1 className="text-xl font-bold text-[hsl(var(--ink))] mb-1">{intro?.title ?? 'الاشتقاقية'}</h1>
                <p className="text-sm text-muted-foreground">{intro?.subtitle ?? 'الدرس الأول — الرياضيات'}</p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {intro?.description ?? 'تُعاد الأخطاء حتى تصحّحها كلها.'}
                </p>
              </div>

              {intro?.body ?? (
                <VideoIntroSwap
                  videoUrl="https://www.youtube-nocookie.com/embed/kNRqWehvOtE"
                  videoPoster="https://img.youtube.com/vi/kNRqWehvOtE/maxresdefault.jpg"
                  videoTitle="شرح الاشتقاقية"
                  showGraph={showGraph}
                  graphReady={graphReady}
                  onToggleGraph={() => setShowGraph((g) => !g)}
                />
              )}
            </div>

            {/* Start button — fixed above the bottom navigation */}
            <div className="fixed bottom-24 left-0 right-0 z-30 px-4 md:hidden">
              <div className="max-w-2xl mx-auto">
                <Button
                  onClick={handleStart}
                  variant="default"
                  className="w-full h-12 rounded-xl"
                >
                  فهمت لننطلق
                </Button>
              </div>
            </div>
            <div className="hidden md:block pt-5">
              <Button
                onClick={handleStart}
                variant="default"
                className="w-full h-12 rounded-xl"
              >
                فهمت لننطلق
              </Button>
            </div>
          </>
        )}

        {(phase === 'exercises' || phase === 'retry') && (
          <div
            key={phase === 'retry' ? `${retryItem?.flowIndex}-${retryRound}` : currentIndex}
            className="flex-1 min-h-0 overflow-y-auto pb-40 md:pb-0 md:overflow-hidden md:flex md:flex-col"
          >
            <div className="w-full md:my-auto">
              {phase === 'retry' && (
                <p className="text-center text-xs font-bold text-[hsl(var(--ember))] mb-3">
                  صحّح أخطاءك في التمارين التالية ({retryQueue.length} تمرين)
                </p>
              )}
              {renderExercise()}
            </div>
          </div>
        )}

        {phase === 'done' && renderResults(true)}
        {phase === 'results' && renderResults(false)}
      </div>
    </div>
  );
}

/* ─── Inline video ↔ definition card swap ─── */
function VideoIntroSwap({
  videoUrl,
  videoPoster,
  videoTitle,
  showGraph,
  graphReady,
  onToggleGraph,
}: {
  videoUrl: string;
  videoPoster: string;
  videoTitle: string;
  showGraph: boolean;
  graphReady: boolean;
  onToggleGraph: () => void;
}) {
  const defRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLDivElement>(null);
  const [defH, setDefH] = useState(0);
  const [videoH, setVideoH] = useState(0);
  const [watching, setWatching] = useState(false);
  const GAP = 12;

  useLayoutEffect(() => {
    const def = defRef.current;
    const video = videoRef.current;
    const measure = () => {
      setDefH(def?.offsetHeight ?? 0);
      setVideoH(video?.offsetHeight ?? 0);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (def) ro.observe(def);
    if (video) ro.observe(video);
    return () => ro.disconnect();
  }, []);

  const EASE = 'transform 650ms cubic-bezier(0.4, 0, 0.2, 1)';

  return (
    <div className="relative space-y-3">
      {/* Video box — rises above the definition card when watching */}
      <div
        ref={videoRef}
        className="relative rounded-2xl border border-border bg-card p-5 space-y-3"
        style={{
          transform: watching ? 'translateY(0)' : `translateY(${defH + GAP}px)`,
          transition: EASE,
          zIndex: 20,
        }}
      >
        <p className="text-sm font-semibold text-[hsl(var(--ink))]">
          في حال لم تفهم، نقترح عليك هذا الشرح:
        </p>
        {watching ? (
          <div className="relative">
            <div className="relative rounded-xl overflow-hidden border border-border bg-muted">
              <iframe
                src={`${videoUrl}?autoplay=1&rel=0`}
                title={videoTitle}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full aspect-video"
              />
            </div>
            <button
              onClick={() => setWatching(false)}
              aria-label="إغلاق الفيديو"
              className="absolute top-2 left-2 z-10 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
        ) : (
          <button onClick={() => setWatching(true)} className="relative block w-full group">
            <div className="relative aspect-video rounded-xl overflow-hidden border border-border bg-muted">
              <img
                src={videoPoster}
                alt={videoTitle}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                loading="lazy"
              />
            </div>
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="w-14 h-14 rounded-full bg-[hsl(var(--coral))] text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </span>
            </span>
          </button>
        )}
      </div>

      {/* Definition card (includes the basic rule) — slides down under the video when watching */}
      <div
        ref={defRef}
        className="rounded-2xl border border-border bg-card p-5 space-y-4"
        style={{
          transform: watching ? 'translateY(0)' : `translateY(${-videoH - GAP}px)`,
          transition: EASE,
          zIndex: 10,
        }}
      >
        <h2 className="text-base font-bold text-[hsl(var(--ink))]">التعريف الأساسي</h2>
        <p className="text-sm leading-relaxed text-[hsl(var(--ink))]">
          <span
            className="font-bold border-b-2 border-dashed border-[hsl(var(--chart-1))]/60 cursor-pointer"
            onClick={onToggleGraph}
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
               الدالة <KaTeXBlock tex="f(x)=x^{3}" className="font-bold text-[hsl(var(--ink))]" /> مع خط المماس
            </p>
          </div>
        )}

        <div className="rounded-xl bg-muted/50 p-4">
          <p className="text-xs text-muted-foreground mb-2 font-medium">القاعدة الأساسية</p>
          <div className="flex items-center justify-center gap-3 text-base font-bold" dir="ltr">
            <KaTeXBlock tex="f(x)=x^{n}" className="text-[hsl(var(--ink))]" />
            <span className="text-muted-foreground text-sm">→</span>
            <KaTeXBlock tex="f'(x)=n\cdot x^{n-1}" className="text-[hsl(var(--sprout))]" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Canvas graph: x³ + tangent ─── */
function DerivativeGraph({ ready }: { ready: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef(0);
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

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
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(15, cy);
      ctx.lineTo(W - 10, cy);
      ctx.moveTo(cx, H - 10);
      ctx.lineTo(cx, 10);
      ctx.stroke();

      // x³ curve
      ctx.strokeStyle = isDark ? 'hsl(0 0% 85%)' : 'hsl(0 0% 15%)';
      ctx.lineWidth = 1.4;
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
  }, [ready, isDark]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full rounded-lg"
      style={{ height: 180 }}
    />
  );
}
