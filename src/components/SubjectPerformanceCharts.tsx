import { useRef, useEffect } from 'react';
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

  const hasAnyData = series.some((row) => SUBJECTS.some((s) => typeof row[s.id] === 'number'));

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [series]);

  if (!hasAnyData) {
    return (
      <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">
        لا توجد نتائج مسجّلة بعد لعرض المنحنى
      </div>
    );
  }

  const chartWidth = Math.max(series.length, 1) * DAY_WIDTH;

  return (
    <div>
      <div
        ref={scrollRef}
        className="w-full overflow-x-auto masar-scroll"
      >
        <div className="h-64" dir="ltr" style={{ width: chartWidth }}>
          <LineChart data={series} width={chartWidth} height={256} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 11, fill: 'hsl(var(--slate))' }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              tickLine={false}
              interval={0}
            />
            <YAxis
              domain={[0, MAX_SCORE]}
              allowDecimals={false}
              tick={{ fontSize: 11, fill: 'hsl(var(--slate))' }}
              axisLine={false}
              tickLine={false}
              width={22}
            />
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
