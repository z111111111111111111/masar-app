import type { ReactNode } from 'react';

export function SystemFrame({ badge, index, total, children }: {
  badge: string;
  index: number;
  total: number;
  children: ReactNode;
}) {
  return (
    <div className="space-y-4 md:space-y-5 animate-[pop-in_0.3s_ease-out]">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-bold text-[hsl(var(--sprout))] bg-[hsl(var(--sprout-soft))] px-3 py-1 rounded-full">
          {badge}
        </span>
        <span className="text-[11px] text-muted-foreground font-semibold">
          تمرين {index + 1} / {total}
        </span>
      </div>
      {children}
    </div>
  );
}

export function FeedbackBlock({ correct, explanation, actions }: {
  correct: boolean;
  explanation?: ReactNode;
  actions: ReactNode;
}) {
  return (
    <div className={`rounded-2xl border p-3 space-y-2 md:p-4 md:space-y-3 animate-[pop-in_0.2s_ease-out] ${
      correct
        ? 'border-[hsl(var(--sprout))]/30 bg-[hsl(var(--sprout))]/5'
        : 'border-[hsl(var(--coral))]/30 bg-[hsl(var(--coral))]/5'
    }`}>
      <p className={`text-sm font-bold ${correct ? 'text-[hsl(var(--sprout))]' : 'text-[hsl(var(--coral))]'}`}>
        {correct ? '✓ إجابة صحيحة' : '✗ إجابة خاطئة'}
      </p>
      {explanation && (
        <p className="text-xs leading-relaxed text-[hsl(var(--ink))]">{explanation}</p>
      )}
      <div className="space-y-2">{actions}</div>
    </div>
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
