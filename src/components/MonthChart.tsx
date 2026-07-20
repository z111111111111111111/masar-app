import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ResponsiveContainer, ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import type { DayStat } from '@/lib/dates';

export function MonthChart({
  open,
  onOpenChange,
  monthNumber,
  stats,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  monthNumber: number;
  stats: DayStat[];
}) {
  const hasData = stats.some((s) => s.points > 0 || s.minutes > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-right">أداء الشهر {monthNumber}</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground -mt-2 mb-2">
          مجموع النقاط من كل المواد مقابل الوقت المبذول، يوماً بيوم على مدار الشهر
        </p>

        {!hasData ? (
          <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">
            لا توجد بيانات مسجّلة لهذا الشهر بعد
          </div>
        ) : (
          <div className="h-64 w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={stats} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 11, fill: 'hsl(var(--slate))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={false}
                  interval={2}
                />
                <YAxis
                  yAxisId="points"
                  tick={{ fontSize: 11, fill: 'hsl(var(--sprout))' }}
                  axisLine={false}
                  tickLine={false}
                  width={28}
                  domain={[0, 50]}
                />
                <YAxis
                  yAxisId="minutes"
                  orientation="right"
                  tick={{ fontSize: 11, fill: 'hsl(var(--ember))' }}
                  axisLine={false}
                  tickLine={false}
                  width={32}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 10,
                    border: '1px solid hsl(var(--border))',
                    background: 'hsl(var(--paper))',
                  }}
                  formatter={(value: number, key: string) =>
                    key === 'points' ? [`${value} نقطة`, 'النقاط'] : [`${value} د`, 'الوقت']
                  }
                  labelFormatter={(d) => `اليوم ${d}`}
                />
                <Legend
                  formatter={(value) => (value === 'points' ? 'النقاط المجموعة' : 'الوقت المبذول (دقيقة)')}
                  wrapperStyle={{ fontSize: 11 }}
                />
                <Line
                  yAxisId="points"
                  type="linear"
                  dataKey="points"
                  stroke="hsl(var(--sprout))"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  yAxisId="minutes"
                  type="linear"
                  dataKey="minutes"
                  stroke="hsl(var(--ember))"
                  strokeWidth={2}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
