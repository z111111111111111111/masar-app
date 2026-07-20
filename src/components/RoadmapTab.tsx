import { PathIcon } from './icons';

export function RoadmapTab() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-[hsl(var(--ink))]">المسار</h1>
        <p className="text-sm text-muted-foreground">مسارات تعلّم مخصصة لكل مادة</p>
      </div>

      <div className="rounded-2xl border border-dashed border-border bg-card p-10 flex flex-col items-center text-center gap-3">
        <span className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
          <PathIcon size={22} />
        </span>
        <p className="text-sm font-semibold text-[hsl(var(--ink))]">جارٍ وضع مسارات المواد</p>
        <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
          ستجد هنا قريباً مساراً تدريجياً لكل مادة يرتّب الدروس خطوة بخطوة حتى البكالوريا.
        </p>
      </div>
    </div>
  );
}
