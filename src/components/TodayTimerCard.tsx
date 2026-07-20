import { useEffect, useState } from 'react';
import { SUBJECTS, type SubjectId } from '@/lib/subjects';
import {
  evaluateSubjectDay,
  formatClock,
  isFinished,
  liveElapsed,
  MAX_SCORE,
  xpForSubjectDay,
  type DayRecord,
} from '@/lib/dates';
import { SubjectIcon } from './SubjectIcon';
import { PlayIcon, PauseIcon, CheckCircleIcon, ClockIcon } from './icons';

const RATE_OPTIONS = Array.from({ length: MAX_SCORE }, (_, i) => i + 1);

export function TodayTimerCard({
  todayRecord,
  focusRequest,
  onStart,
  onPause,
  onResume,
  onFinish,
}: {
  todayRecord: DayRecord;
  focusRequest?: { subject: SubjectId; token: number } | null;
  onStart: (subject: SubjectId) => void;
  onPause: (subject: SubjectId) => void;
  onResume: (subject: SubjectId) => void;
  onFinish: (subject: SubjectId, score: number) => void;
}) {
  const [, setTick] = useState(0);
  const [selected, setSelected] = useState<SubjectId>(() => firstUnfinished(todayRecord));
  const [rating, setRating] = useState(false);

  const anyRunning = SUBJECTS.some((s) => todayRecord[s.id]?.timerStatus === 'running');
  useEffect(() => {
    if (!anyRunning) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [anyRunning]);

  useEffect(() => {
    if (!isFinished(todayRecord[selected])) return;
    const next = firstUnfinished(todayRecord);
    if (next !== selected) setSelected(next);
    setRating(false);
  }, [todayRecord]); // eslint-disable-line

  useEffect(() => {
    if (!focusRequest) return;
    setSelected(focusRequest.subject);
    setRating(false);
  }, [focusRequest]);

  const finishedCount = SUBJECTS.filter((s) => isFinished(todayRecord[s.id])).length;
  const allFinished = finishedCount === SUBJECTS.length;
  const subjectMeta = SUBJECTS.find((s) => s.id === selected)!;
  const sub = todayRecord[selected];
  const status = sub?.timerStatus ?? 'idle';
  const elapsed = liveElapsed(sub, Date.now());
  const isBusy = anyRunning;

  if (allFinished) {
    const totalXp = SUBJECTS.reduce((acc, s) => acc + xpForSubjectDay(todayRecord[s.id]), 0);
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-center">
        <CheckCircleIcon size={28} className="text-[hsl(var(--sprout))] mx-auto mb-2" />
        <p className="font-semibold text-[hsl(var(--ink))]">أتممت مواد اليوم كاملةً</p>
        <p className="text-xs text-muted-foreground mt-1">جمعت {totalXp} XP اليوم — عد غداً لمتابعة مسارك</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-[hsl(var(--ink))] text-sm">مؤقّت التمرين</h2>
        <span className="text-xs text-muted-foreground">{finishedCount}/{SUBJECTS.length} مواد مكتملة اليوم</span>
      </div>

      {/* subject chips */}
      <div className="flex gap-2 overflow-x-auto masar-scroll pb-1">
        {SUBJECTS.map((s) => {
          const rec = todayRecord[s.id];
          const st = rec?.timerStatus ?? 'idle';
          const done = isFinished(rec);
          const isSel = s.id === selected;
          const isRunning = st === 'running';
          return (
            <button
              key={s.id}
              onClick={() => {
                if (isBusy && !isRunning && !done) return;
                setSelected(s.id);
                setRating(false);
              }}
              disabled={isBusy && !isRunning && !done}
              className={`shrink-0 flex flex-col items-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-[11px] font-semibold transition-colors ${
                isSel ? 'border-[hsl(var(--ink))] bg-muted/40' : 'border-border'
              } ${isBusy && !isRunning && !done ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <SubjectIcon id={s.id} className={isSel ? 'text-[hsl(var(--ink))]' : 'text-muted-foreground'} />
              <span className="text-[hsl(var(--ink))]">{s.short}</span>
              {done ? (
                <span className="text-[hsl(var(--sprout))]">{rec!.score}/{MAX_SCORE}</span>
              ) : isRunning ? (
                <span className="text-[hsl(var(--ember))]">يعمل</span>
              ) : st === 'paused' ? (
                <span className="text-muted-foreground">متوقف</span>
              ) : (
                <span className="text-muted-foreground">لم يبدأ</span>
              )}
            </button>
          );
        })}
      </div>

      {/* active subject panel */}
      <div className="rounded-xl bg-muted/30 p-5 text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <SubjectIcon id={selected} className="text-[hsl(var(--ink))]" />
          <p className="text-sm font-semibold text-[hsl(var(--ink))]">{subjectMeta.name}</p>
        </div>

        {isFinished(sub) ? (
          <FinishedSummary sub={sub} />
        ) : (
          <>
            <p className="text-4xl font-bold tabular-nums text-[hsl(var(--ink))] my-3">{formatClock(elapsed)}</p>

            {!rating ? (
              <div className="flex items-center justify-center gap-2 flex-wrap">
                {status === 'idle' && (
                  <ActionButton onClick={() => onStart(selected)} tone="ink">
                    <PlayIcon size={14} /> ابدأ
                  </ActionButton>
                )}
                {status === 'running' && (
                  <ActionButton onClick={() => onPause(selected)} tone="ember">
                    <PauseIcon size={14} /> إيقاف
                  </ActionButton>
                )}
                {status === 'paused' && (
                  <ActionButton onClick={() => onResume(selected)} tone="ink">
                    <PlayIcon size={14} /> استئناف
                  </ActionButton>
                )}
                {(status === 'running' || status === 'paused') && (
                  <ActionButton
                    onClick={() => {
                      if (status === 'running') onPause(selected);
                      setRating(true);
                    }}
                    tone="sprout"
                  >
                    <CheckCircleIcon size={14} /> انتهيت
                  </ActionButton>
                )}
              </div>
            ) : (
              <div>
                <p className="text-xs text-muted-foreground mb-2">قيّم حلّك من {MAX_SCORE}</p>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {RATE_OPTIONS.map((n) => (
                    <button
                      key={n}
                      onClick={() => {
                        onFinish(selected, n);
                        setRating(false);
                      }}
                      className="h-9 w-9 rounded-lg text-sm font-semibold border border-border bg-card text-[hsl(var(--ink))] hover:border-[hsl(var(--sprout))] hover:bg-[hsl(var(--sprout-soft))] transition-colors"
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {isBusy && !isFinished(sub) && status === 'idle' && (
        <p className="text-xs text-muted-foreground text-center leading-relaxed">
          أكمل المادة الجارية أولاً ثم ابدأ مادة جديدة
        </p>
      )}
    </div>
  );
}

function firstUnfinished(rec: DayRecord): SubjectId {
  return SUBJECTS.find((s) => !isFinished(rec[s.id]))?.id ?? SUBJECTS[0].id;
}

function FinishedSummary({ sub }: { sub: NonNullable<DayRecord[SubjectId]> }) {
  const evalRes = evaluateSubjectDay(sub);
  const toneClass =
    evalRes?.tone === 'sprout'
      ? 'text-[hsl(var(--sprout))]'
      : evalRes?.tone === 'ember'
      ? 'text-[hsl(var(--ember))]'
      : 'text-[hsl(var(--coral))]';
  return (
    <div className="py-1">
      <p className="text-2xl font-bold text-[hsl(var(--ink))]">
        {sub.score}/{MAX_SCORE}
      </p>
      <p className="text-xs text-muted-foreground mt-1.5 flex items-center justify-center gap-1.5">
        <ClockIcon size={13} /> {formatClock(sub.timeSeconds ?? 0)} · {xpForSubjectDay(sub)} XP
      </p>
      {evalRes && <p className={`text-xs font-semibold mt-1.5 ${toneClass}`}>{evalRes.label}</p>}
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  tone,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  tone: 'ink' | 'ember' | 'sprout';
  disabled?: boolean;
}) {
  const toneClass =
    tone === 'ink'
      ? 'bg-[hsl(var(--ink-solid))] hover:bg-[hsl(var(--ink-solid))]/90'
      : tone === 'ember'
      ? 'bg-[hsl(var(--ember))] hover:bg-[hsl(var(--ember))]/90'
      : 'bg-[hsl(var(--sprout))] hover:bg-[hsl(var(--sprout))]/90';
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`h-10 px-5 rounded-full text-white text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 ${toneClass}`}
    >
      {children}
    </button>
  );
}
