import { useEffect, useState } from 'react';

// Counts down seconds until `targetAt`, seeded from two *server* timestamps
// (`targetAt` and `serverNow` come from the same snapshot) and then ticking
// 1s/sec on its own. The device clock is never read, so forwarding the phone
// time cannot make the countdown run out early; it can only overestimate the
// remaining time, never underestimate it.
export function useServerCountdown(targetAt: number, serverNow: number): number | null {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!targetAt || !serverNow) return;
    setRemaining(Math.max(0, Math.ceil((targetAt - serverNow) / 1000)));
    const id = setInterval(
      () => setRemaining((r) => (r == null ? null : Math.max(0, r - 1))),
      1000
    );
    return () => clearInterval(id);
  }, [targetAt, serverNow]);

  return remaining;
}
