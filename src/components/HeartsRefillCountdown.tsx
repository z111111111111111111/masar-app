import { useHearts } from '@/hooks/useHearts';
import { useServerCountdown } from '@/hooks/useServerCountdown';
import { formatClock } from '@/lib/dates';
import { HeartIcon } from './icons';

// Pill shown next to the greeting on the home page: hearts count plus a
// server-anchored countdown to the moment all 15 hearts come back at once.
export function HeartsRefillCountdown() {
  const { hearts, maxHearts, nextRefillAt, serverNow } = useHearts();
  const remaining = useServerCountdown(nextRefillAt ?? 0, serverNow);

  const missing = maxHearts - hearts;

  return (
    <span
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[hsl(var(--coral-soft))] text-[hsl(var(--coral))] px-3 py-1.5 text-xs font-semibold"
      title="متى تعود كل القلوب"
    >
      <HeartIcon size={13} />
      <span className="tabular-nums">
        {hearts}/{maxHearts}
      </span>
      {missing > 0 && (
        <span className="tabular-nums" dir="ltr">
          · {remaining == null ? '--:--' : formatClock(remaining)}
        </span>
      )}
    </span>
  );
}
