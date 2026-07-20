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
  Legend,
} from 'recharts';
import { SUBJECTS, subjectColor } from '@/lib/subjects';
import { MAX_SCORE } from '@/lib/dates';

export function SubjectLineChart({
  series,
}: {
  series: Array<{ day: number } & Record<string, number | null | undefined>>;
}) {
  const hasAnyData = series.some((row) => SUBJECTS.some((s) => typeof row[s.id] === 'number'));

  if (!hasAnyData) {
    return (
      <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">
        لا توجد نتائج مسجّلة بعد لعرض المنحنى
      </div>
    );
  }

  return (
    <div className="h-64 w-full" dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 11, fill: 'hsl(var(--slate))' }}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            tickLine={false}
            interval={Math.max(0, Math.ceil(series.length / 10) - 1)}
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
          <Legend
            formatter={(value) => SUBJECTS.find((s) => s.id === value)?.short ?? value}
            wrapperStyle={{ fontSize: 11 }}
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
      </ResponsiveContainer>
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
