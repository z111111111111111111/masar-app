import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from 'convex/_generated/api';
import type { AppScreen } from '@/lib/navigation';
import { ChevronIcon, MathIcon, AtomIcon, LeafIcon, BrainIcon, GlobeIcon, ShuffleIcon, BookIcon } from './icons';
import { DerivativeLesson } from './lessons/DerivativeLesson';
import { DerivativeLessonStage2 } from './lessons/DerivativeLessonStage2';
import { DerivativeLessonStage3 } from './lessons/DerivativeLessonStage3';
import { DerivativeLessonStage4 } from './lessons/DerivativeLessonStage4';

// During the free trial only the first stage of each subject may be completed.
// Completion is persisted server-side (profile.completedStages) so it can't be
// tampered with; the server enforces the trial limit on markStagePassed.
const FIRST_STAGE_OF_SUBJECT: Record<string, string> = { math: 's1' };

const COMPLETED_KEY = 'masar-completed-subjects';
function getCompletedSubjects(): string[] {
  try { return JSON.parse(localStorage.getItem(COMPLETED_KEY) || '[]'); }
  catch { return []; }
}
function markSubjectVisited(id: string) {
  const s = getCompletedSubjects();
  if (!s.includes(id)) { s.push(id); localStorage.setItem(COMPLETED_KEY, JSON.stringify(s)); }
}

interface RoadmapSubject {
  id: string;
  name: string;
  icon: (p: { className?: string; size?: number }) => JSX.Element;
  color: string;
}

const SUBJECTS: RoadmapSubject[] = [
  { id: 'math', name: 'الرياضيات', icon: MathIcon, color: 'hsl(var(--chart-1))' },
  { id: 'physics', name: 'الفيزياء', icon: AtomIcon, color: 'hsl(var(--chart-2))' },
  { id: 'nature', name: 'العلوم الطبيعية', icon: LeafIcon, color: 'hsl(var(--chart-3))' },
  { id: 'philo', name: 'الفلسفة', icon: BrainIcon, color: 'hsl(var(--chart-4))' },
  { id: 'social', name: 'الاجتماعيات', icon: GlobeIcon, color: 'hsl(var(--chart-5))' },
  { id: 'random', name: 'تدريب عشوائي', icon: ShuffleIcon, color: 'hsl(var(--sprout))' },
];

interface Stage {
  id: string;
  name: string;
  lessonId: string | null;
  requiredStage: string | null;
}

const MATH_STAGES: Stage[] = [
  { id: 's1', name: 'مقدمة في الاشتقاق', lessonId: 'derivative', requiredStage: null },
  { id: 's2', name: 'مفهوم الاشتقاقية عند نقطة', lessonId: 'derivative-2', requiredStage: 's1' },
  { id: 's3', name: 'قواعد الاشتقاق', lessonId: 'derivative-3', requiredStage: 's2' },
  { id: 's4', name: 'تمارين مركبة', lessonId: 'derivative-4', requiredStage: 's3' },
];

function isStageUnlocked(stageId: string, completed: string[]): boolean {
  const stage = MATH_STAGES.find((s) => s.id === stageId);
  if (!stage) return false;
  if (!stage.requiredStage) return true;
  return completed.includes(stage.requiredStage);
}

function countCompleted(stages: Stage[], completed: string[]): number {
  return stages.filter((s) => completed.includes(s.id)).length;
}

export function RoadmapTab({
  screen,
  navigate,
  isPaid,
  onSubscribe,
}: {
  screen: AppScreen;
  navigate: (s: AppScreen) => void;
  isPaid: boolean;
  onSubscribe: () => void;
}) {
  if (screen.kind === 'lesson') {
    return (
      <StageLesson
        stageId={screen.stageId}
        onBack={() => navigate({ kind: 'subject', subjectId: screen.subjectId })}
      />
    );
  }

  if (screen.kind === 'subject') {
    const subject = SUBJECTS.find((s) => s.id === screen.subjectId);
    if (!subject) return null;
    return (
      <SubjectPage
        subject={subject}
        isPaid={isPaid}
        onSubscribe={onSubscribe}
        onBack={() => navigate({ kind: 'tab', tab: 'roadmap' })}
        onSelectStage={(stage) => {
          if (stage.lessonId) navigate({ kind: 'lesson', subjectId: subject.id, stageId: stage.lessonId });
        }}
      />
    );
  }

  return (
    <div className="space-y-6 pt-6">
      <div>
        <h1 className="text-xl font-bold text-[hsl(var(--ink))]">مسار المواد</h1>
        <p className="text-sm text-muted-foreground">اختر المادة لبدء التعلم</p>
      </div>

      <div className="relative">
        <div className="absolute right-[22px] md:right-1/2 md:translate-x-[1px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-[hsl(var(--sprout))] via-[hsl(var(--chart-2))] to-[hsl(var(--chart-5))]" />

        <div className="space-y-8">
          {SUBJECTS.map((subject, index) => (
            <SubjectBranch
              key={subject.id}
              subject={subject}
              index={index}
              onClick={() => navigate({ kind: 'subject', subjectId: subject.id })}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function SubjectBranch({
  subject,
  index,
  onClick,
}: {
  subject: RoadmapSubject;
  index: number;
  onClick: () => void;
}) {
  const isEven = index % 2 === 0;
  const Icon = subject.icon;

  return (
    <div className="relative flex items-center">
      <div
        className={`mr-[52px] md:mr-0 md:w-[calc(50%-40px)] ${
          isEven ? 'md:mr-auto md:pr-0' : 'md:ml-auto md:pl-0'
        }`}
      >
        <button onClick={onClick} className="w-full text-right group">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm hover:shadow-md hover:border-[hsl(var(--sprout))]/30 transition-all active:scale-[0.98]">
            <div className="flex items-center gap-3">
              <span
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors"
                style={{ background: `${subject.color}15`, color: subject.color }}
              >
                <Icon size={20} />
              </span>
              <h3 className="text-sm font-bold text-[hsl(var(--ink))] flex-1">{subject.name}</h3>
              <ChevronIcon size={14} className="rotate-180 text-muted-foreground group-hover:text-[hsl(var(--sprout))] transition-colors" />
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}

function SubjectPage({
  subject,
  isPaid,
  onSubscribe,
  onBack,
  onSelectStage,
}: {
  subject: RoadmapSubject;
  isPaid: boolean;
  onSubscribe: () => void;
  onBack: () => void;
  onSelectStage: (stage: Stage) => void;
}) {
  const Icon = subject.icon;
  const profile = useQuery(api.progress.get);
  const stages = subject.id === 'math' ? MATH_STAGES : [];
  const completedStages = profile?.completedStages ?? [];

  useEffect(() => {
    markSubjectVisited(subject.id);
  }, [subject.id]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-[hsl(var(--ink))] hover:bg-muted/60 transition-all active:scale-95"
        >
          <ChevronIcon size={16} />
        </button>
        <div className="flex items-center gap-2.5">
          <span
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: `${subject.color}15`, color: subject.color }}
          >
            <Icon size={20} />
          </span>
          <h1 className="text-xl font-bold text-[hsl(var(--ink))]">{subject.name}</h1>
        </div>
      </div>

      {stages.length > 0 ? (
        <LessonCard
          subject={subject}
          stages={stages}
          completedStages={completedStages}
          isPaid={isPaid}
          onSubscribe={onSubscribe}
          onSelectStage={onSelectStage}
        />
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 flex flex-col items-center text-center gap-3">
          <span
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ background: `${subject.color}15`, color: subject.color }}
          >
            <BookIcon size={24} />
          </span>
          <p className="text-sm font-semibold text-[hsl(var(--ink))]">قريباً إن شاء الله</p>
          <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
            جارٍ العمل على المحتوى.
          </p>
        </div>
      )}
    </div>
  );
}

function StageLesson({
  stageId,
  onBack,
}: {
  stageId: string;
  onBack: () => void;
}) {
  const markStagePassed = useMutation(api.progress.markStagePassed);
  const stageMap: Record<string, string> = {
    derivative: 's1',
    'derivative-2': 's2',
    'derivative-3': 's3',
    'derivative-4': 's4',
  };
  const handleComplete = (passed: boolean) => {
    const target = stageMap[stageId];
    if (!passed || !target) return;
    markStagePassed({ stageId: target }).catch(() => {});
  };

  if (stageId === 'derivative') {
    return <DerivativeLesson onBack={onBack} onStageComplete={handleComplete} />;
  }

  if (stageId === 'derivative-2') {
    return <DerivativeLessonStage2 onBack={onBack} onStageComplete={handleComplete} />;
  }

  if (stageId === 'derivative-3') {
    return <DerivativeLessonStage3 onBack={onBack} onStageComplete={handleComplete} />;
  }

  if (stageId === 'derivative-4') {
    return <DerivativeLessonStage4 onBack={onBack} onStageComplete={handleComplete} />;
  }

  return null;
}

function LessonCard({
  subject,
  stages,
  completedStages,
  isPaid,
  onSubscribe,
  onSelectStage,
}: {
  subject: RoadmapSubject;
  stages: Stage[];
  completedStages: string[];
  isPaid: boolean;
  onSubscribe: () => void;
  onSelectStage: (stage: Stage) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const completedCount = countCompleted(stages, completedStages);
  const firstStageId = FIRST_STAGE_OF_SUBJECT[subject.id];

  const openStage = (stage: Stage) => {
    // Sequentially unlocked, but locked by the free trial → open paywall.
    if (!isPaid && stage.lessonId && stage.id !== firstStageId) {
      onSubscribe();
      return;
    }
    if (stage.lessonId) onSelectStage(stage);
  };

  return (
    <div className="space-y-2">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full text-right"
      >
        <div className="rounded-xl border border-border bg-card p-4 hover:shadow-md hover:border-[hsl(var(--sprout))]/30 transition-all active:scale-[0.98]">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              style={{ background: `${subject.color}15`, color: subject.color }}
            >
              1
            </div>
            <h3 className="text-sm font-bold text-[hsl(var(--ink))] flex-1">الاشتقاقية</h3>
            <span className="text-xs font-bold text-muted-foreground tabular-nums">
              {completedCount} من {stages.length}
            </span>
          </div>
        </div>
      </button>

      {expanded && (
        <div className="rounded-xl border border-border bg-card p-3 space-y-2 animate-[slideDown_0.25s_ease-out] origin-top">
          <p className="text-xs text-muted-foreground font-medium px-1 pb-1">أكمل كل مرحلة بالكامل للانتقال للتالية</p>
          {stages.map((stage, i) => {
            const done = completedStages.includes(stage.id);
            const unlocked = isStageUnlocked(stage.id, completedStages);
            const trialLocked = !isPaid && stage.id !== firstStageId;
            const available = unlocked && !trialLocked;
            const isLast = i === stages.length - 1;

            return (
              <div key={stage.id}>
                <button
                  disabled={!unlocked}
                  onClick={() => {
                    if (unlocked) openStage(stage);
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    done
                      ? 'border-[hsl(var(--sprout))]/30 bg-[hsl(var(--sprout))]/5 hover:shadow-md active:scale-[0.98]'
                      : available
                        ? 'border-border bg-card hover:shadow-md hover:border-[hsl(var(--sprout))]/30 active:scale-[0.98]'
                        : 'border-border bg-muted/30 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                    done
                      ? 'bg-[hsl(var(--sprout))] text-white'
                      : available
                        ? 'bg-muted text-muted-foreground'
                        : 'bg-muted/60 text-muted-foreground/60'
                  }`}>
                    {done ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter">
                        <polyline points="4 12 10 18 20 6" />
                      </svg>
                    ) : (
                      <span>{i + 1}</span>
                    )}
                  </div>

                  <div className="flex-1 text-right">
                    <p className={`text-sm font-bold ${done ? 'text-[hsl(var(--sprout))]' : available ? 'text-[hsl(var(--ink))]' : 'text-muted-foreground'}`}>
                      {stage.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {done ? 'مكتمل' : available ? (stage.lessonId ? 'اضغط للبدء' : 'قريباً إن شاء الله') : trialLocked ? 'متاح في النسخة المدفوعة' : 'مقفل'}
                    </p>
                  </div>

                  {trialLocked && !done && (
                    <span className="text-[9px] font-bold text-[hsl(var(--ember))] bg-[hsl(var(--ember-soft))] rounded-full px-2 py-0.5 shrink-0">
                      PRO
                    </span>
                  )}
                  {!unlocked && !done && !trialLocked && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-muted-foreground/50 shrink-0">
                      <rect x="5" y="11" width="14" height="10" rx="2" />
                      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                    </svg>
                  )}
                  {available && !done && stage.lessonId && (
                    <ChevronIcon size={14} className="rotate-180 text-muted-foreground shrink-0" />
                  )}
                </button>

                {!isLast && (
                  <div className="flex justify-center py-0.5">
                    <div className={`w-0.5 h-2.5 ${done ? 'bg-[hsl(var(--sprout))]' : 'bg-border'}`} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
