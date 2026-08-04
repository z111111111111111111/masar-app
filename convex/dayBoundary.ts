// Pure day-boundary helpers anchored to the SERVER clock (Date.now() passed
// in by the caller). The client can pass its timezone offset so the "local
// day" rolls at the user's own midnight, but the reference time is always the
// server clock — changing the phone clock can't shift the day boundary.
export const DAY_MS = 24 * 60 * 60 * 1000;

// ISO date string (YYYY-MM-DD) of the local day containing `nowMs` for a user
// whose local time is `tzOffsetMin` minutes east of UTC.
export function dayTodayISO(nowMs: number, tzOffsetMin: number): string {
  return new Date(nowMs + tzOffsetMin * 60000).toISOString().slice(0, 10);
}

// Timestamp (server ms) of the next local midnight for that user.
export function dayNextMidnightAt(nowMs: number, tzOffsetMin: number): number {
  const local = nowMs + tzOffsetMin * 60000;
  const localDayStart = Math.floor(local / DAY_MS) * DAY_MS;
  return localDayStart + DAY_MS - tzOffsetMin * 60000;
}
