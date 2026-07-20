import { SUBJECTS, type SubjectId } from './subjects';

export const TOTAL_DAYS = 273; // ~9 months
export const DAYS_PER_MONTH = 30;
export const TOTAL_MONTHS = Math.ceil(TOTAL_DAYS / DAYS_PER_MONTH); // 9 (+1 short tail)

export const MAX_SCORE = 10; // rating scale 1..10
export const TARGET_SECONDS = 20 * 60; // benchmark: one exercise in ~20 minutes
export const RANDOM_TARGET_SECONDS = 30 * 60; // benchmark for exercises started from "تمرين عشوائي"

export type TimerStatus = 'idle' | 'running' | 'paused' | 'finished';

export interface SubjectDayRecord {
  score?: number; // 1..10, set once the exercise is marked finished (or logged manually)
  timeSeconds?: number; // accumulated solving time for this subject, today
  timerStatus?: TimerStatus;
  runningSince?: number; // epoch ms — only present while timerStatus === 'running'
  viaRandom?: boolean; // true if this session was started from the random-exercise suggester
}

export type DayRecord = Partial<Record<SubjectId, SubjectDayRecord>>;
export type RecordsMap = Record<string, DayRecord>; // isoDate -> DayRecord

const ARABIC_WEEKDAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const ARABIC_MONTHS = [
  'جانفي', 'فيفري', 'مارس', 'أفريل', 'ماي', 'جوان',
  'جويلية', 'أوت', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

// The bac exam is treated as the day the 9-month path ends.
// One row per elapsed day, with each subject's score for that day (or null if
// the subject wasn't attempted that day — kept as null, never 0, so the chart
// line breaks cleanly instead of dropping toward zero).
export function subjectDailySeries(records: RecordsMap, startDate: string, daysElapsed: number) {
  const start = new Date(startDate);
  const rows: Array<{ day: number } & Partial<Record<SubjectId, number | null>>> = [];
  for (let i = 0; i < daysElapsed; i++) {
    const iso = toISODate(addDays(start, i));
    const rec = records[iso];
    const row: { day: number } & Partial<Record<SubjectId, number | null>> = { day: i + 1 };
    for (const s of SUBJECTS) {
      const v = rec?.[s.id];
      row[s.id] = typeof v?.score === 'number' ? v.score : 0;
    }
    rows.push(row);
  }
  return rows;
}

export function examDate(startDate: string): Date {
  return addDays(new Date(startDate), TOTAL_DAYS);
}

export function daysUntilExam(startDate: string, todayISO: string): number {
  const diff = Math.round((+examDate(startDate) - +new Date(todayISO)) / 86400000);
  return Math.max(0, diff);
}

export function dayIndexFromStart(startISO: string, targetISO: string): number {
  const start = new Date(startISO);
  const target = new Date(targetISO);
  const diff = Math.round((+target - +start) / 86400000);
  return diff;
}

export function formatArabicDate(d: Date): string {
  return `${ARABIC_WEEKDAYS[d.getDay()]}، ${d.getDate()} ${ARABIC_MONTHS[d.getMonth()]}`;
}

export function formatArabicShort(d: Date): string {
  return `${d.getDate()} ${ARABIC_MONTHS[d.getMonth()]}`;
}

export function formatClock(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) totalSeconds = 0;
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

// A subject-day counts as "finished" once it has a score.
export function isFinished(sub?: SubjectDayRecord): boolean {
  return typeof sub?.score === 'number';
}

// Live elapsed seconds for a subject, accounting for a running timer.
export function liveElapsed(sub: SubjectDayRecord | undefined, nowMs: number): number {
  if (!sub) return 0;
  const base = sub.timeSeconds ?? 0;
  if (sub.timerStatus === 'running' && sub.runningSince) {
    return base + Math.max(0, (nowMs - sub.runningSince) / 1000);
  }
  return base;
}

// Completion ratio for a single day (0..1) across the 5 subjects
export function dayCompletion(rec: DayRecord | undefined): number {
  if (!rec) return 0;
  const finished = SUBJECTS.filter((s) => isFinished(rec[s.id])).length;
  return finished / SUBJECTS.length;
}

export function dayAverageScore(rec: DayRecord | undefined): number | null {
  if (!rec) return null;
  const vals = Object.values(rec)
    .map((v) => v?.score)
    .filter((v): v is number => typeof v === 'number');
  if (!vals.length) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

// Streak = consecutive days ending today where ALL 5 subjects were finished.
// Finishing only some subjects keeps the day "in progress" but does not yet
// secure that day's streak — see finishedSubjectsCount() for partial progress.
export function computeStreak(records: RecordsMap, todayISO: string): number {
  let streak = 0;
  let cursor = new Date(todayISO);
  const hasAllFinished = (rec: DayRecord | undefined) =>
    !!rec && SUBJECTS.every((s) => isFinished(rec[s.id]));

  if (!hasAllFinished(records[toISODate(cursor)])) {
    cursor = addDays(cursor, -1);
  }
  while (true) {
    const iso = toISODate(cursor);
    if (hasAllFinished(records[iso])) {
      streak += 1;
      cursor = addDays(cursor, -1);
    } else {
      break;
    }
  }
  return streak;
}

// How many of the 5 subjects are finished on a given day (0..5).
export function finishedSubjectsCount(rec: DayRecord | undefined): number {
  if (!rec) return 0;
  return SUBJECTS.filter((s) => isFinished(rec[s.id])).length;
}

// Time-efficiency multiplier: faster than the benchmark earns a bonus (up to +25%),
// much slower costs a small penalty (down to -30%). No time data => neutral (1x).
export function timeEfficiencyFactor(timeSeconds?: number, benchmarkSeconds: number = TARGET_SECONDS): number {
  if (!timeSeconds || timeSeconds <= 0) return 1;
  const ratio = benchmarkSeconds / Math.max(timeSeconds, 60);
  return Math.max(0.7, Math.min(1.25, ratio));
}

function benchmarkFor(sub: SubjectDayRecord | undefined): number {
  return sub?.viaRandom ? RANDOM_TARGET_SECONDS : TARGET_SECONDS;
}

export function xpForSubjectDay(sub: SubjectDayRecord | undefined): number {
  if (!sub || typeof sub.score !== 'number') return 0;
  const factor = timeEfficiencyFactor(sub.timeSeconds, benchmarkFor(sub));
  return Math.round(sub.score * 10 * factor); // 10/10 at benchmark pace => 100xp
}

export function computeTotalXP(records: RecordsMap): number {
  let xp = 0;
  for (const rec of Object.values(records)) {
    for (const sub of Object.values(rec)) {
      xp += xpForSubjectDay(sub);
    }
  }
  return xp;
}

export interface PerformanceEval {
  label: string;
  tone: 'sprout' | 'ember' | 'coral';
}

// Evaluates a finished exercise combining the self-rated score with solving speed.
export function evaluateSubjectDay(sub: SubjectDayRecord | undefined): PerformanceEval | null {
  if (!sub || typeof sub.score !== 'number') return null;
  const { score, timeSeconds } = sub;
  const factor = timeEfficiencyFactor(timeSeconds, benchmarkFor(sub));
  const hasTime = !!timeSeconds;

  if (score >= 8 && hasTime && factor >= 1.05) return { label: 'أداء سريع ودقيق', tone: 'sprout' };
  if (score >= 8) return { label: 'إجابة قوية', tone: 'sprout' };
  if (score >= 5 && hasTime && factor < 0.85) return { label: 'جيد، حاول تسريع وقتك', tone: 'ember' };
  if (score >= 5) return { label: 'جيد، واصل التمرّن', tone: 'ember' };
  return { label: 'يحتاج مراجعة', tone: 'coral' };
}

export interface League {
  name: string;
  min: number;
  color: 'fog' | 'sprout' | 'ember' | 'ink';
}

export const LEAGUES: League[] = [
  { name: 'البداية', min: 0, color: 'fog' },
  { name: 'البرونزية', min: 300, color: 'ember' },
  { name: 'الفضية', min: 900, color: 'slate' as any },
  { name: 'الذهبية', min: 2000, color: 'ember' },
  { name: 'الماسية', min: 4000, color: 'sprout' },
];

export function currentLeague(xp: number): { league: League; next: League | null; progress: number } {
  let current = LEAGUES[0];
  let next: League | null = LEAGUES[1] ?? null;
  for (let i = 0; i < LEAGUES.length; i++) {
    if (xp >= LEAGUES[i].min) {
      current = LEAGUES[i];
      next = LEAGUES[i + 1] ?? null;
    }
  }
  const progress = next ? (xp - current.min) / (next.min - current.min) : 1;
  return { league: current, next, progress: Math.max(0, Math.min(1, progress)) };
}

export function buildMonthChunks(): { monthNumber: number; startDay: number; endDay: number }[] {
  const chunks = [];
  let day = 0;
  let month = 1;
  while (day < TOTAL_DAYS) {
    const end = Math.min(day + DAYS_PER_MONTH, TOTAL_DAYS);
    chunks.push({ monthNumber: month, startDay: day, endDay: end - 1 });
    day = end;
    month += 1;
  }
  return chunks;
}

export type PathDayKind = 'normal' | 'weekly-exam' | 'monthly-exam';

// dayInMonth is 0-indexed (0 = first day of the chunk). chunkLength is how many
// days are in that month chunk (usually 30, shorter for the trailing chunk).
export function pathDayKind(dayInMonth: number, chunkLength: number): PathDayKind {
  if (dayInMonth === chunkLength - 1) return 'monthly-exam';
  if ((dayInMonth + 1) % 7 === 0) return 'weekly-exam';
  return 'normal';
}

export interface DayStat {
  day: number; // 1-indexed day-in-month
  points: number; // sum of scores across subjects that day (out of 50)
  minutes: number; // total solving time that day, in minutes
}

export function monthDayStats(
  records: RecordsMap,
  start: Date,
  chunk: { startDay: number; endDay: number }
): DayStat[] {
  const stats: DayStat[] = [];
  for (let dayIdx = chunk.startDay; dayIdx <= chunk.endDay; dayIdx++) {
    const iso = toISODate(addDays(start, dayIdx));
    const rec = records[iso];
    let points = 0;
    let seconds = 0;
    if (rec) {
      for (const sub of Object.values(rec)) {
        if (typeof sub?.score === 'number') points += sub.score;
        if (typeof sub?.timeSeconds === 'number') seconds += sub.timeSeconds;
      }
    }
    stats.push({ day: dayIdx - chunk.startDay + 1, points, minutes: Math.round((seconds / 60) * 10) / 10 });
  }
  return stats;
}

// Seconds remaining until local midnight (end of "today").
export function secondsUntilMidnight(now: Date): number {
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return Math.max(0, Math.round((+midnight - +now) / 1000));
}
