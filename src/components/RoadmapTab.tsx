import { useState } from 'react';
import { PathIcon, ChevronIcon, BookIcon } from './icons';

interface RoadmapSubject {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
}

const SUBJECTS: RoadmapSubject[] = [
  { id: 'math', name: 'الرياضيات', icon: '📐', color: 'hsl(var(--chart-1))', description: 'الجبر، الهندسة، التفاضل والتكامل' },
  { id: 'physics', name: 'الفيزياء', icon: '⚡', color: 'hsl(var(--chart-2))', description: 'الميكانيكا، الكهرباء، البصريات' },
  { id: 'nature', name: 'العلوم الطبيعية', icon: '🧬', color: 'hsl(var(--chart-3))', description: 'الأحياء، الكيمياء، البيئة' },
  { id: 'philo', name: 'الفلسفة', icon: '💭', color: 'hsl(var(--chart-4))', description: 'المقالة، النص الفلسفي، المفاهيم' },
  { id: 'social', name: 'الاجتماعيات', icon: '🌍', color: 'hsl(var(--chart-5))', description: 'التاريخ، الجغرافيا، التربية المدنية' },
  { id: 'random', name: 'تدريب عشوائي', icon: '🎲', color: 'hsl(var(--sprout))', description: 'أسئلة متنوعة من جميع المواد' },
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

      {/* Vertical Timeline */}
      <div className="relative">
        {/* Central line */}
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

  return (
    <div className="relative flex items-center">
      {/* Node on timeline */}
      <div
        className="absolute right-[14px] md:right-1/2 md:-translate-x-1/2 z-10 w-[18px] h-[18px] rounded-full border-[3px] border-background transition-all group-hover:scale-110"
        style={{ background: subject.color }}
      />

      {/* Card — desktop: alternating sides, mobile: all left */}
      <div
        className={`mr-[52px] md:mr-0 md:w-[calc(50%-40px)] ${
          isEven ? 'md:mr-auto md:pr-0' : 'md:ml-auto md:pl-0'
        }`}
      >
        <button
          onClick={onClick}
          className="w-full text-right group"
        >
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm hover:shadow-md hover:border-[hsl(var(--sprout))]/30 transition-all active:scale-[0.98]">
            <div className="flex items-center gap-3">
              <span className="text-2xl shrink-0">{subject.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[hsl(var(--ink))]">{subject.name}</h3>
                  <ChevronIcon size={14} className="rotate-180 text-muted-foreground group-hover:text-[hsl(var(--sprout))] transition-colors" />
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{subject.description}</p>
              </div>
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
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-[hsl(var(--ink))] hover:bg-muted/60 transition-all active:scale-95"
        >
          <ChevronIcon size={16} />
        </button>
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">{subject.icon}</span>
          <div>
            <h1 className="text-xl font-bold text-[hsl(var(--ink))]">{subject.name}</h1>
            <p className="text-xs text-muted-foreground">{subject.description}</p>
          </div>
        </div>
      </div>

      {/* Empty state */}
      <div className="rounded-2xl border border-dashed border-border bg-card p-10 flex flex-col items-center text-center gap-3">
        <span
          className="w-14 h-14 rounded-full flex items-center justify-center"
          style={{ background: `${subject.color}20`, color: subject.color }}
        >
          <BookIcon size={24} />
        </span>
        <p className="text-sm font-semibold text-[hsl(var(--ink))]">قريباً إن شاء الله</p>
        <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
          جارٍ 작업 على محتوى المادة. ستجد هنا الدروس والتمارين قريباً.
        </p>
      </div>

      {/* Placeholder sections */}
      <div className="space-y-3">
        {['الأسبوع 1', 'الأسبوع 2', 'الأسبوع 3'].map((week, i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-card p-4 opacity-50"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xs font-bold">
                {i + 1}
              </div>
              <div>
                <p className="text-sm font-semibold text-[hsl(var(--ink))]">{week}</p>
                <p className="text-[11px] text-muted-foreground">قريباً...</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
