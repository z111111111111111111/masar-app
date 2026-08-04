import { useMemo, useState } from 'react';
import { useQuery_experimental as useQuerySafe } from 'convex/react';
import { api } from 'convex/_generated/api';
import { toISODate } from '@/lib/dates';

export interface DayInfo {
  todayISO: string;
  nextMidnightAt: number;
  serverNow: number;
  ready: boolean;
}

// Anchors the day boundary to the SERVER clock: "today" and the next midnight
// come from `getDayInfo` (server Date.now() + this device's timezone offset),
// and they are NOT extrapolated with the device clock, so changing the phone
// time cannot shift the day or speed up its countdown. Countdown components
// tick down from `nextMidnightAt` with their own interval.
export function useDayInfo(): DayInfo {
  // Capture the offset once per mount; the timezone doesn't change mid-session.
  const [tzOffsetMin] = useState(() => -new Date().getTimezoneOffset());
  const args = useMemo(() => ({ tzOffsetMin }), [tzOffsetMin]);
  const query = useQuerySafe({ query: api.progress.getDayInfo, args });
  const data = query.status === 'success' && query.data ? query.data : null;
  return {
    todayISO: data?.todayISO ?? toISODate(new Date()),
    nextMidnightAt: data?.nextMidnightAt ?? 0,
    serverNow: data?.serverNow ?? 0,
    ready: !!data,
  };
}
