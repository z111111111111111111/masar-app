import { useMemo, useState } from 'react';
import {
  addDays,
  buildMonthChunks,
  dayCompletion,
  formatArabicDate,
  formatArabicShort,
  monthDayStats,
  pathDayKind,
  toISODate,
  TOTAL_DAYS,
  type PathDayKind,
  type RecordsMap,
} from '@/lib/dates';
import type { SubjectId } from '@/lib/subjects';
import { useMutation } from 'convex/react';
import { api } from 'convex/_generated/api';
import { ScoreDialog } from './ScoreDialog';
import { MonthChart } from './MonthChart';
import { ExamCountdownCard } from './ExamCountdownCard';
import { ChartIcon, ExamIcon } from './icons';

export function PathTab({
  startDate,
  records,
}: {
  startDate: string;
  records: RecordsMap;
}) {
  const recordFinish = useMutation(api.progress.recordFinish);

  const chunks = useMemo(() => buildMonthChunks(), []);
  const start = useMemo(() => new Date(startDate), [startDate]);
  const todayISO = toISODate(new Date());
  const dayIndexToday = Math.round((+new Date(todayISO) - +start) / 86400000);

  const [selectedISO, setSelectedISO] = useState<string | null>(null);
  const [chartMonth, setChartMonth] = useState<number | null>(null);

  const completedDays = Object.values(records).filter((r) => Object.keys(r).length > 0).length;

  const chartChunk = chunks.find((c) => c.monthNumber === chartMonth);

  const handleLog = (dateISO: string, subject: SubjectId, score: number) => {
    recordFinish({ dateISO, subject, score, timeSeconds: 0 });
  };

  const handleClear = (_dateISO: string, _subject: SubjectId) => {
    // No-op for now: clearing records not supported in Convex
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-[hsl(var(--ink))]">مسارك نحو البكالوريا</h1>
        <p className="text-sm text-muted-foreground">
          {completedDays} يوماً مُنجَزاً من أصل {TOTAL_DAYS} يوماً (≈ 9 أشهر)
        </p>
      </div>

      <ExamCountdownCard startDate={startDate} dayIndexToday={dayIndexToday} />

      <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
        <LegendDot className="bg-[hsl(var(--sprout))]" label="يوم مكتمل" />
        <LegendDot className="bg-[hsl(var(--ember))]" label="يوم جزئي" />
        <LegendDiamond className="bg-[hsl(var(--coral))]" label="امتحان أسبوعي" />
        <LegendSquare className="bg-[hsl(var(--ink-solid))]" label="امتحان شهري" />
      </div>

      <div className="space-y-6">
        {chunks.map((chunk) => (
          <MonthStrip
            key={chunk.monthNumber}
            chunk={chunk}
            start={start}
            dayIndexToday={dayIndexToday}
            records={records}
            onSelect={setSelectedISO}
            onOpenChart={() => setChartMonth(chunk.monthNumber)}
          />
        ))}
      </div>

      {selectedISO && (
        <ScoreDialog
          open={!!selectedISO}
          onOpenChange={(v) => !v && setSelectedISO(null)}
          dateLabel={formatArabicDate(new Date(selectedISO))}
          dayRecord={records[selectedISO] ?? {}}
          onLog={(subject, score) => handleLog(selectedISO, subject, score)}
          onClear={(subject) => handleClear(selectedISO, subject)}
          locked={selectedISO === todayISO}
        />
      )}

      {chartChunk && (
        <MonthChart
          open={!!chartMonth}
          onOpenChange={(v) => !v && setChartMonth(null)}
          monthNumber={chartChunk.monthNumber}
          stats={monthDayStats(records, start, chartChunk)}
        />
      )}
    </div>
  );
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`w-2.5 h-2.5 rounded-full ${className}`} />
      {label}
    </span>
  );
}
function LegendDiamond({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`w-2.5 h-2.5 rotate-45 ${className}`} />
      {label}
    </span>
  );
}
function LegendSquare({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`w-2.5 h-2.5 rounded-[3px] ${className}`} />
      {label}
    </span>
  );
}

function MonthStrip({
  chunk,
  start,
  dayIndexToday,
  records,
  onSelect,
  onOpenChart,
}: {
  chunk: { monthNumber: number; startDay: number; endDay: number };
  start: Date;
  dayIndexToday: number;
  records: RecordsMap;
  onSelect: (iso: string) => void;
  onOpenChart: () => void;
}) {
  const days = [];
  for (let i = chunk.startDay; i <= chunk.endDay; i++) days.push(i);
  const chunkLength = chunk.endDay - chunk.startDay + 1;

  const monthHasStarted = dayIndexToday >= chunk.startDay;
  const firstDate = addDays(start, chunk.startDay);
  const lastDate = addDays(start, chunk.endDay);

  return (
    <div className={`rounded-2xl border border-border bg-card p-4 ${monthHasStarted ? '' : 'opacity-60'}`}>
      <div className="flex items-baseline justify-between mb-3">
        <button
          onClick={onOpenChart}
          className="flex items-center gap-1.5 text-sm font-bold text-[hsl(var(--ink))] hover:text-[hsl(var(--sprout))] transition-colors"
        >
          <ChartIcon size={14} />
          الشهر {chunk.monthNumber}
        </button>
        <span className="text-[11px] text-muted-foreground">
          {formatArabicShort(firstDate)} — {formatArabicShort(lastDate)}
        </span>
      </div>
      <div className="relative masar-scroll overflow-x-auto pb-1">
        <div className="relative flex items-center gap-0 min-w-max px-1" style={{ height: 40 }}>
          <div className="absolute right-3 left-3 top-1/2 -translate-y-1/2 h-0.5 bg-border" />
          {days.map((dayIdx) => {
            const date = addDays(start, dayIdx);
            const iso = toISODate(date);
            const rec = records[iso];
            const ratio = dayCompletion(rec);
            const isToday = dayIdx === dayIndexToday;
            const isFuture = dayIdx > dayIndexToday;
            const dayInMonth = dayIdx - chunk.startDay;
            const kind = pathDayKind(dayInMonth, chunkLength);
            return (
              <button
                key={dayIdx}
                disabled={isFuture || kind !== 'normal'}
                onClick={() => onSelect(iso)}
                title={
                  kind === 'weekly-exam'
                    ? 'امتحان أسبوعي — للاطّلاع فقط، بدون تسجيل نقاط'
                    : kind === 'monthly-exam'
                    ? 'امتحان شهري — للاطّلاع فقط، بدون تسجيل نقاط'
                    : formatArabicShort(date)
                }
                className="relative z-10 shrink-0 mx-[3px] disabled:cursor-not-allowed"
              >
                <DayNode ratio={ratio} isToday={isToday} isFuture={isFuture} kind={kind} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function DayNode({
  ratio,
  isToday,
  isFuture,
  kind,
}: {
  ratio: number;
  isToday: boolean;
  isFuture: boolean;
  kind: PathDayKind;
}) {
  if (kind === 'monthly-exam') {
    return (
      <span
        className={`flex items-center justify-center rounded-md text-white ${isFuture ? 'opacity-40' : ''}`}
        style={{ width: 20, height: 20, background: 'hsl(var(--ink-solid))' }}
      >
        <ExamIcon size={12} className="text-white" />
      </span>
    );
  }

  if (kind === 'weekly-exam') {
    return (
      <span
        className={`block rotate-45 ${isFuture ? 'opacity-40' : ''}`}
        style={{ width: 12, height: 12, background: 'hsl(var(--coral))' }}
      />
    );
  }

  const size = isToday ? 15 : 11;
  let fill = 'hsl(var(--fog))';
  if (ratio >= 1) fill = 'hsl(var(--sprout))';
  else if (ratio > 0) fill = 'hsl(var(--ember))';

  return (
    <span
      className={`block rounded-full transition-transform ${isToday ? 'ring-2 ring-offset-2 ring-[hsl(var(--ember))]' : ''} ${
        isFuture ? 'opacity-40' : 'hover:scale-125'
      }`}
      style={{
        width: size,
        height: size,
        background: isFuture ? 'hsl(var(--fog))' : fill,
      }}
    />
  );
}
