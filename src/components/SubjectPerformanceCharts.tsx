import { useRef, useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { SUBJECTS, subjectColor } from '@/lib/subjects';
import { MAX_SCORE } from '@/lib/dates';

const DAY_WIDTH = 100;

export function SubjectLineChart({
  series,
}: {
  series: Array<{ day: number } & Record<string, number | null | undefined>>;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [boxW, setBoxW] = useState(0);

  const hasAnyData = series.some((row) => SUBJECTS.some((s) => typeof row[s.id] === 'number'));

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () => setBoxW(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Desktop mouse wheel only scrolls the page vertically, so a wide chart
  // inside this horizontal container looks "cut off" and unmovable. Translate a
  // vertical wheel over the chart into a horizontal scroll of this container
  // (only while the chart actually overflows).
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (el.scrollWidth <= el.clientWidth) return;
      if (e.shiftKey) return;
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        const before = el.scrollLeft;
        el.scrollLeft += e.deltaY;
        if (el.scrollLeft !== before) {
          e.preventDefault();
        }
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [series, boxW]);

  if (!hasAnyData) {
    return (
      <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">
        لا توجد نتائج مسجّلة بعد لعرض المنحنى
      </div>
    );
  }

  // Never narrower than the visible box, so the X axis always reaches the end
  // of the card even when there are only a few days. With many days the chart
  // grows and scrolls, keeping the value labels pinned in the fixed column.
  const contentWidth = Math.max(series.length, 1) * DAY_WIDTH;
  const chartWidth = Math.max(contentWidth, boxW);

  // Keep the value labels pinned while the days column scrolls horizontally:
  // the Y axis is hidden inside the chart (domain only) and its tick labels are
  // re-drawn in a fixed column outside the scroll container, aligned to the
  // same plot geometry (256px tall, 8px top margin) as the grid lines.
  const ticks = Array.from({ length: MAX_SCORE / 2 + 1 }, (_, i) => i * 2);
  const tickTops = ticks.map((t) => 8 + (MAX_SCORE - t) * (248 / MAX_SCORE));

  return (
    <div>
      <div className="flex" dir="ltr">
        <div className="relative shrink-0 w-7 h-64 select-none" aria-hidden>
          {ticks.map((t, i) => (
            <span
              key={t}
              className="absolute right-0 -translate-y-1/2 text-[11px] leading-none text-[hsl(var(--slate))]"
              style={{ top: tickTops[i] }}
            >
              {t}
            </span>
          ))}
        </div>
        <div ref={scrollRef} className="flex-1 min-w-0 overflow-x-auto masar-scroll">
          <div className="h-64" style={{ width: chartWidth }}>
            <LineChart data={series} width={chartWidth} height={256} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: 'hsl(var(--slate))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={false}
                interval={0}
              />
              <YAxis hide domain={[0, MAX_SCORE]} allowDecimals={false} />
              <Tooltip
              contentStyle={{
                fontSize: 12,
                borderRadius: 10,
                border: '1px solid hsl(var(--border))',
                background: 'hsl(var(--paper))',
              }}
              labelFormatter={(d) => `اليوم ${d}`}
              formatter={(value: number, name: string) => {
                const subj = SUBJECTS.find((s) => s.id === name);
                return [`${value}/${MAX_SCORE}`, subj?.name ?? name];
              }}
            />
            {SUBJECTS.map((s) => (
              <Line
                key={s.id}
                type="linear"
                dataKey={s.id}
                name={s.id}
                stroke={subjectColor(s.id)}
                strokeWidth={2}
                dot={{ r: 2.5 }}
                connectNulls={false}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </div>
      </div>
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
        {SUBJECTS.map((s) => (
          <span key={s.id} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: subjectColor(s.id) }} />
            {s.short}
          </span>
        ))}
      </div>
    </div>
  );
}

export function SubjectPercentBarChart({
  data,
}: {
  data: Array<{ id: string; short: string; percentage: number }>;
}) {
  return (
    <div className="h-56 w-full" dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey="short"
            tick={{ fontSize: 11, fill: 'hsl(var(--slate))' }}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: 'hsl(var(--slate))' }}
            axisLine={false}
            tickLine={false}
            width={30}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip
            contentStyle={{
              fontSize: 12,
              borderRadius: 10,
              border: '1px solid hsl(var(--border))',
              background: 'hsl(var(--paper))',
            }}
            formatter={(value: number) => [`${value}%`, 'نسبة التقدّم']}
          />
          <Bar dataKey="percentage" radius={0} isAnimationActive={false} barSize={18}>
            {data.map((row) => (
              <Cell key={row.id} fill={subjectColor(row.id as any)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
