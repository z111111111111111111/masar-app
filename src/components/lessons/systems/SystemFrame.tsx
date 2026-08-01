import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';

export function SystemFrame({ children }: {
  children: ReactNode;
}) {
  return (
    <div className="space-y-4 md:space-y-5 animate-[pop-in_0.3s_ease-out]">
      {children}
    </div>
  );
}

export function FeedbackBlock({ correct, explanation }: {
  correct: boolean;
  explanation?: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className={`rounded-2xl border p-4 ${
        correct
          ? 'border-[hsl(var(--sprout))]/30 bg-[hsl(var(--sprout))]/5'
          : 'border-[hsl(var(--coral))]/30 bg-[hsl(var(--coral))]/5'
      }`}>
        <p className={`text-sm font-bold mb-1 ${correct ? 'text-[hsl(var(--sprout))]' : 'text-[hsl(var(--coral))]'}`}>
          {correct ? '✓ إجابة صحيحة' : '✗ إجابة خاطئة'}
        </p>
        {explanation && (
          <p className="text-xs leading-relaxed text-[hsl(var(--ink))]">{explanation}</p>
        )}
      </div>
    </div>
  );
}

export function ExerciseActionBar({ canCheck, answered, onCheck, onNext, feedback }: {
  canCheck: boolean;
  answered: boolean;
  onCheck: () => void;
  onNext: () => void;
  feedback?: ReactNode;
}) {
  const button = !answered ? (
    <Button
      onClick={onCheck}
      disabled={!canCheck}
      className={`w-full h-12 rounded-xl text-base disabled:opacity-100 ${
        canCheck ? '' : 'bg-muted text-muted-foreground shadow-none'
      }`}
    >
      تحقق
    </Button>
  ) : (
    <Button onClick={onNext} className="w-full h-12 rounded-xl text-base">
      متابعة
    </Button>
  );

  const feedbackLayer = answered && feedback ? (
    <div className="animate-rise-up">{feedback}</div>
  ) : null;

  return (
    <>
      {/* Mobile: permanently fixed above the bottom navigation */}
      <div className="fixed bottom-24 left-0 right-0 z-30 px-4 md:hidden">
        <div className="max-w-2xl mx-auto space-y-2">
          {feedbackLayer}
          {button}
        </div>
      </div>
      {/* Desktop: in flow */}
      <div className="hidden md:block pt-5 space-y-2">
        {feedbackLayer}
        {button}
      </div>
    </>
  );
}

export function CheckMark({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter">
      <polyline points="4 12 10 18 20 6" />
    </svg>
  );
}

export function XMark({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square">
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </svg>
  );
}
