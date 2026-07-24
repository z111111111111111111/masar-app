import { useState } from 'react';
import { ChevronIcon, MathIcon, AtomIcon, LeafIcon, BrainIcon, GlobeIcon, ShuffleIcon, BookIcon } from './icons';

interface RoadmapSubject {
  id: string;
  name: string;
  icon: (p: { className?: string; size?: number }) => JSX.Element;
  color: string;
}

const SUBJECTS: RoadmapSubject[] = [
  { id: 'math', name: 'الرياضيات', icon: MathIcon, color: 'hsl(var(--chart-1))' },
  { id: 'physics', name: 'الفيزياء', icon: AtomIcon, color: 'hsl(var(--chart-2))' },
  { id: 'nature', name: 'العلوم الطبيعية', icon: LeafIcon, color: 'hsl(var(--chart-3))' },
  { id: 'philo', name: 'الفلسفة', icon: BrainIcon, color: 'hsl(var(--chart-4))' },
  { id: 'social', name: 'الاجتماعيات', icon: GlobeIcon, color: 'hsl(var(--chart-5))' },
  { id: 'random', name: 'تدريب عشوائي', icon: ShuffleIcon, color: 'hsl(var(--sprout))' },
];

export function RoadmapTab() {
  const [selectedSubject, setSelectedSubject] = useState<RoadmapSubject | null>(null);

  if (selectedSubject) {
    return <SubjectPage subject={selectedSubject} onBack={() => setSelectedSubject(null)} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[hsl(var(--ink))]">مسار المواد</h1>
        <p className="text-sm text-muted-foreground">اختر المادة لبدء التعلم</p>
      </div>

      <div className="relative">
        <div className="absolute right-[22px] md:right-1/2 md:translate-x-[1px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-[hsl(var(--sprout))] via-[hsl(var(--chart-2))] to-[hsl(var(--chart-5))]" />

        <div className="space-y-8">
          {SUBJECTS.map((subject, index) => (
            <SubjectBranch
              key={subject.id}
              subject={subject}
              index={index}
              onClick={() => setSelectedSubject(subject)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function SubjectBranch({
  subject,
  index,
  onClick,
}: {
  subject: RoadmapSubject;
  index: number;
  onClick: () => void;
}) {
  const isEven = index % 2 === 0;
  const Icon = subject.icon;

  return (
    <div className="relative flex items-center">
      <div
        className={`mr-[52px] md:mr-0 md:w-[calc(50%-40px)] ${
          isEven ? 'md:mr-auto md:pr-0' : 'md:ml-auto md:pl-0'
        }`}
      >
        <button onClick={onClick} className="w-full text-right group">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm hover:shadow-md hover:border-[hsl(var(--sprout))]/30 transition-all active:scale-[0.98]">
            <div className="flex items-center gap-3">
              <span
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors"
                style={{ background: `${subject.color}15`, color: subject.color }}
              >
                <Icon size={20} />
              </span>
              <h3 className="text-sm font-bold text-[hsl(var(--ink))] flex-1">{subject.name}</h3>
              <ChevronIcon size={14} className="rotate-180 text-muted-foreground group-hover:text-[hsl(var(--sprout))] transition-colors" />
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}

function SubjectPage({
  subject,
  onBack,
}: {
  subject: RoadmapSubject;
  onBack: () => void;
}) {
  const Icon = subject.icon;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-[hsl(var(--ink))] hover:bg-muted/60 transition-all active:scale-95"
        >
          <ChevronIcon size={16} />
        </button>
        <div className="flex items-center gap-2.5">
          <span
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: `${subject.color}15`, color: subject.color }}
          >
            <Icon size={20} />
          </span>
          <h1 className="text-xl font-bold text-[hsl(var(--ink))]">{subject.name}</h1>
        </div>
      </div>

      <div className="rounded-2xl border border-dashed border-border bg-card p-10 flex flex-col items-center text-center gap-3">
        <span
          className="w-14 h-14 rounded-full flex items-center justify-center"
          style={{ background: `${subject.color}15`, color: subject.color }}
        >
          <BookIcon size={24} />
        </span>
        <p className="text-sm font-semibold text-[hsl(var(--ink))]">قريباً إن شاء الله</p>
        <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
          جارٍ العمل على المحتوى.
        </p>
      </div>
    </div>
  );
}
