import { createContext, useContext, useCallback, useEffect, useState, type ReactNode } from 'react';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from 'convex/_generated/api';
import { toast } from '@/hooks/use-toast';
import { InfoIcon, LightbulbIcon, SparklesIcon, GemIcon } from '../../icons';
import type { ExerciseData } from './types';

/* ── Economy ──────────────────────────────────────────────────── */
export const HINT_COST = 2;
export const AI_COST = 5;
export const INITIAL_JEWELS = 20;

const KIND_FALLBACK_INFO: Record<ExerciseData['kind'], string> = {
  mcq: 'اختر الإجابة الصحيحة بعد قراءة السؤال جيداً والتركيز على المفهوم المطلوب.',
  rule: 'رتّب المكوّنات لتكوين الصيغة الصحيحة: ركّز على ترتيب العمليات في القاعدة.',
  fill: 'اختر العبارة الصحيحة لإكمال الجملة، وانتبه للمعنى الرياضي قبل الحل.',
  truefalse: 'حدّد ما إذا كانت العبارة صحيحة أم خاطئة مع تبرير في ذهنك.',
  sort: 'رتّب البطاقات في التسلسل المنطقي الصحيح خطوة بخطوة.',
};

/* ── Context ──────────────────────────────────────────────────── */
export interface ExerciseHelpersValue {
  info?: string;
  hintUsed: boolean;
  useHint: () => void;
  ai: {
    used: boolean;
    loading: boolean;
    content: string | null;
    error: boolean;
  };
  askAi: () => void;
  jewels: number;
}

const HelpersContext = createContext<ExerciseHelpersValue | null>(null);

export function useExerciseHelpers(): ExerciseHelpersValue {
  const v = useContext(HelpersContext);
  if (!v) throw new Error('useExerciseHelpers must be used inside ExerciseHelpersProvider');
  return v;
}

function exerciseOptions(ex: ExerciseData): string[] | undefined {
  switch (ex.kind) {
    case 'mcq': return ex.data.options;
    case 'fill': return ex.data.choices;
    case 'rule': return ex.data.pieces;
    case 'sort': return ex.data.cards;
    case 'truefalse': return undefined;
  }
}

export function ExerciseHelpersProvider({
  exercise,
  aiUsed,
  onAiUsed,
  children,
}: {
  exercise: ExerciseData;
  aiUsed: boolean;
  onAiUsed: () => void;
  children: ReactNode;
}) {
  const profile = useQuery(api.progress.get);
  const spendJewels = useMutation(api.progress.spendJewels);
  const explainExercise = useAction(api.corrector.explainExercise);

  const [balance, setBalance] = useState<number | null>(null);
  const [hintUsed, setHintUsed] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiContent, setAiContent] = useState<string | null>(null);
  const [aiError, setAiError] = useState(false);

  useEffect(() => {
    if (profile && balance === null) setBalance(profile.jewels ?? INITIAL_JEWELS);
  }, [profile, balance]);

  const jewels = balance ?? (profile?.jewels ?? INITIAL_JEWELS);
  const info = exercise.data.info ?? KIND_FALLBACK_INFO[exercise.kind];

  const doSpend = useCallback(async (amount: number) => {
    const next = await spendJewels({ amount });
    setBalance(next);
    return next;
  }, [spendJewels]);

  const useHint = useCallback(() => {
    if (hintUsed) return;
    if (jewels < HINT_COST) {
      toast({
        title: 'لا تملك مجوهرات كافية',
        description: `التلميح يتطلّب ${HINT_COST} مجوهرات.`,
        variant: 'destructive',
      });
      return;
    }
    doSpend(HINT_COST)
      .then(() => {
        setHintUsed(true);
        toast({ title: 'تم فتح التلميح', description: `خُصمت ${HINT_COST} مجوهرات.` });
      })
      .catch(() => {
        toast({
          title: 'تعذّر استخدام التلميح',
          description: 'رصيد المجوهرات غير كافٍ.',
          variant: 'destructive',
        });
      });
  }, [hintUsed, jewels, doSpend]);

  const askAi = useCallback(() => {
    if (aiLoading) return;
    // Already paid AND content is still available in this mount → nothing to do.
    if (aiUsed && aiContent !== null) return;
    if (jewels < AI_COST) {
      toast({
        title: 'لا تملك مجوهرات كافية',
        description: `سؤال الذكاء الاصطناعي يتطلّب ${AI_COST} مجوهرات.`,
        variant: 'destructive',
      });
      return;
    }
    setAiLoading(true);
    setAiError(false);
    setAiContent(null);
    explainExercise({
      kind: exercise.kind,
      info: info ?? '',
      options: exerciseOptions(exercise),
    })
      .then(async (content) => {
        // A paid question was already recorded for this exercise (e.g. the
        // provider remounted on a correction round) → refetch without charging.
        if (!aiUsed) {
          await doSpend(AI_COST);
          onAiUsed();
        }
        setAiContent(content);
      })
      .catch(() => {
        setAiError(true);
        toast({
          title: 'تعذّر الحصول على الشرح',
          description: 'حاول مرة أخرى بعد قليل.',
          variant: 'destructive',
        });
      })
      .finally(() => setAiLoading(false));
  }, [aiUsed, aiLoading, aiContent, jewels, explainExercise, exercise, info, doSpend, onAiUsed]);

  const value: ExerciseHelpersValue = {
    info,
    hintUsed,
    useHint,
    ai: { used: aiUsed, loading: aiLoading, content: aiContent, error: aiError },
    askAi,
    jewels,
  };

  return <HelpersContext.Provider value={value}>{children}</HelpersContext.Provider>;
}

/* ── Bottom helpers bar (info / hint / AI) ────────────────────── */
export function ExerciseHelpersBar() {
  const { info, hintUsed, useHint, ai, askAi, jewels } = useExerciseHelpers();
  const [panel, setPanel] = useState<'info' | 'ai' | null>(null);

  const toggleInfo = () => setPanel((p) => (p === 'info' ? null : 'info'));
  const toggleAi = () => {
    if (ai.loading) return;
    askAi();
    setPanel((p) => (p === 'ai' ? null : 'ai'));
  };

  const barBtn =
    'flex items-center gap-1.5 rounded-xl border border-border bg-card px-2.5 py-1.5 text-[11px] font-semibold transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed';

  return (
    <div className="mt-3 pt-3 border-t border-border">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleInfo}
            className={`${barBtn} ${panel === 'info' ? 'border-[hsl(var(--sprout))] text-[hsl(var(--sprout))]' : 'text-muted-foreground hover:text-[hsl(var(--ink))]'}`}
            aria-label="معلومة عن التمرين"
            title="معلومة عن التمرين (مجاني)"
          >
            <InfoIcon size={15} />
            <span>معلومة</span>
          </button>

          <button
            onClick={useHint}
            disabled={hintUsed}
            className={`${barBtn} ${hintUsed ? 'text-[hsl(var(--ember))]' : 'text-muted-foreground hover:text-[hsl(var(--ember))]'}`}
            aria-label="تلميح"
            title={`تلميح للجواب (${HINT_COST} مجوهرات)`}
          >
            <LightbulbIcon size={15} />
            <span>{hintUsed ? 'استُخدم' : 'تلميح'}</span>
            {!hintUsed && <span className="text-[10px] text-muted-foreground">({HINT_COST})</span>}
          </button>

          <button
            onClick={toggleAi}
            disabled={ai.loading}
            className={`${barBtn} ${ai.used ? 'text-[hsl(var(--chart-2))]' : 'text-muted-foreground hover:text-[hsl(var(--chart-2))]'} ${ai.loading ? 'animate-pulse' : ''}`}
            aria-label="اسأل الذكاء الاصطناعي"
            title={`سؤال واحد عن التمرين (${AI_COST} مجوهرات)`}
          >
            <SparklesIcon size={15} />
            <span>{ai.loading ? 'جارٍ الشرح…' : ai.used ? 'اُستخدم السؤال' : 'اسأل الذكاء'}</span>
            {!ai.used && !ai.loading && <span className="text-[10px] text-muted-foreground">({AI_COST})</span>}
          </button>
        </div>

        <span className="flex items-center gap-1 text-[11px] font-bold text-[hsl(var(--sprout))]">
          <GemIcon size={14} />
          <span className="tabular-nums">{jewels}</span>
        </span>
      </div>

      {panel === 'info' && info && (
        <div className="mt-2.5 rounded-xl border border-[hsl(var(--chart-1))]/25 bg-[hsl(var(--chart-1))]/5 p-3 animate-[pop-in_0.25s_ease-out]">
          <p className="text-[10px] font-bold text-[hsl(var(--chart-1))] mb-1">معلومة عن التمرين</p>
          <p className="text-xs leading-relaxed text-[hsl(var(--ink))]">{info}</p>
        </div>
      )}

      {panel === 'ai' && (
        <div className="mt-2.5 rounded-xl border border-[hsl(var(--chart-2))]/25 bg-[hsl(var(--chart-2))]/5 p-3 animate-[pop-in_0.25s_ease-out]">
          <p className="text-[10px] font-bold text-[hsl(var(--chart-2))] mb-1">شرح الذكاء الاصطناعي</p>
          {ai.loading ? (
            <p className="text-xs text-muted-foreground">يفكّر في شرح مبسط لك…</p>
          ) : ai.error ? (
            <p className="text-xs text-muted-foreground">تعذّر الحصول على الشرح، حاول مرة أخرى.</p>
          ) : ai.content ? (
            <p className="text-xs leading-relaxed text-[hsl(var(--ink))] whitespace-pre-line">{ai.content}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              اضغط على «اسأل الذكاء» للحصول على شرح مبسط للفكرة — لن يعطيك الجواب مباشرة.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
